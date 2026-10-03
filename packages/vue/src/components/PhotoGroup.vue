<template>
  <div ref="rootRef" style="display: contents" v-bind="$attrs">
    <slot :photos="canonicalPhotos" :controller="controller" />
  </div>
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, provide, ref, shallowRef, type Component } from 'vue'
import { useGalleryRuntime } from '../gallery/runtime'
import { useGalleryModel } from '../gallery/model'
import { provideLightbox } from '../composables/index'
import type { LightboxProviderController } from '../provide/keys'
import type {
  ImageAdapter,
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  LightboxNavigationMode,
  LightboxTransitionOption,
  PhotoItem,
} from '../core/index'
import { providePhotoConfig, isLightboxOptions, type LightboxOptions } from '../config'
import Lightbox from './Lightbox.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupCapability,
  type PhotoGroupContext,
} from './photo-group/context'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { useRecipePhotos } from './shared/useRecipePhotos'
import { buildPhotoGroupCapabilityIndex } from './photo-group/capabilities'

defineOptions({ inheritAttrs: false })

defineSlots<{
  default?: (props: {
    photos: readonly PhotoItem<TMeta>[]
    controller: LightboxProviderController<TMeta>
  }) => unknown
}>()

const props = withDefaults(
  defineProps<{
    /**
     * All photos of the group in navigation order. Every descendant `Photo` or `PhotoAlbum` must
     * use photos from this list.
     */
    photos: readonly PhotoItem<TMeta>[]
    /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
    active?: string | null
    /**
     * What to do with invalid photos: `'throw'` stops with an error, `'drop'` skips them and emits
     * `invalidPhotos`.
     * @default 'throw'
     */
    validation?: InvalidPhotoPolicy
    /** Image adapter for this component. Wins over the inherited config and the module default. */
    imageAdapter?: ImageAdapter<TMeta>
    /**
     * `true` opens the built-in lightbox, `false` turns it off, a component replaces it. Read once
     * at mount; change the component `key` to remount.
     * @default true
     */
    lightbox?: boolean | Component | LightboxOptions
    /**
     * How the lightbox opens and closes. `'auto'` animates from the thumbnail when enough of it is
     * visible and fades otherwise. Also `'flip'`, `'fade'`, `'none'`, or an options object. Can
     * change while mounted.
     * @default 'auto'
     */
    transition?: LightboxTransitionOption
    /**
     * How the lightbox changes photos: `'slide'`, `'fade'`, or `'crossfade'`. Can change while
     * mounted.
     * @default 'slide'
     */
    navigation?: LightboxNavigationMode
  }>(),
  { lightbox: true },
)

const emit = defineEmits<{
  'update:active': [id: string | null]
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const photoConfig = providePhotoConfig(() => ({
  lightbox: isLightboxOptions(props.lightbox) ? props.lightbox : undefined,
  validation: props.validation,
}))

const canonicalPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoGroup',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)
const rootRef = ref<HTMLElement | null>(null)
useGalleryRuntime(canonicalPhotos, () => rootRef.value)

const capabilityBatches = shallowRef(new Map<symbol, readonly PhotoGroupCapability[]>())
const canonicalIds = computed(() => new Set(canonicalPhotos.value.map((photo) => photo.id)))
const canonicalIndexById = computed(
  () => new Map(canonicalPhotos.value.map((photo, index) => [photo.id, index])),
)
const capabilitiesById = computed(() =>
  buildPhotoGroupCapabilityIndex(canonicalIds.value, capabilityBatches.value),
)

function hasPhoto(id: string) {
  return canonicalIds.value.has(id)
}

const injectedLightbox = photoConfig.value.lightbox.component ?? null
const lightboxComponent = resolveLightboxComponent(
  isLightboxOptions(props.lightbox) ? true : props.lightbox,
  injectedLightbox,
  Lightbox,
  true,
)
const enabled = lightboxComponent !== null
warnOnSetupOptionChanges('PhotoGroup', {
  lightbox: () => props.lightbox,
})
const provider = enabled
  ? provideLightbox(canonicalPhotos, {
      transition: () => props.transition,
      navigation: () => props.navigation,
      imageAdapter: computed(() => props.imageAdapter),
      resolveSlide: (photo) => capabilitiesById.value.get(photo.id)?.renderSlide ?? null,
    })
  : null

function replaceCapabilities(owner: symbol, entries: readonly PhotoGroupCapability[]) {
  for (const entry of entries) {
    if (!canonicalIds.value.has(entry.id)) {
      throw new Error(
        `[nuxt-photo] PhotoGroup descendant photo "${entry.id}" is missing from the canonical photos collection. ` +
          'Add it to the photos of the surrounding <PhotoGroup>, or render it outside the group. ' +
          'See https://nuxt-photo.lupinum.com/docs/reference/photo-group',
      )
    }
  }

  const next = new Map(capabilityBatches.value)
  if (entries.length === 0) next.delete(owner)
  else next.set(owner, [...entries])

  buildPhotoGroupCapabilityIndex(canonicalIds.value, next)
  capabilityBatches.value = next
}

function removeCapabilities(owner: symbol) {
  if (!capabilityBatches.value.has(owner)) return
  const next = new Map(capabilityBatches.value)
  next.delete(owner)
  capabilityBatches.value = next
}

function syncThumbnailRefs() {
  if (!provider) return
  canonicalPhotos.value.forEach((photo, index) => {
    const element =
      capabilitiesById.value
        .get(photo.id)
        ?.thumbnailCandidates.map((candidate) => candidate())
        .find((candidate) => candidate?.isConnected) ?? null
    provider.setThumbnailRef(index)(element)
  })
}

async function open(index = 0) {
  if (index < 0 || index >= canonicalPhotos.value.length) {
    throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  }
  if (!provider) return
  syncThumbnailRefs()
  await provider.open(index)
}

async function activateById(id: string, source?: HTMLElement | null) {
  const index = canonicalIndexById.value.get(id)
  if (index === undefined) {
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  }
  if (!provider) return
  syncThumbnailRefs()
  if (source) provider.setThumbnailRef(index)(source)
  await provider.openById(id)
}

async function openById(id: string) {
  await activateById(id)
}

async function close() {
  await provider?.close()
}

const disabledController: LightboxProviderController<TMeta> = {
  photos: computed(() => canonicalPhotos.value),
  count: computed(() => canonicalPhotos.value.length),
  activeId: computed(() => null),
  activeIndex: computed(() => 0),
  activePhoto: computed(() => null),
  isOpen: computed(() => false),
  open,
  openById,
  close,
  next() {},
  prev() {},
  toggleZoom() {},
  hiddenThumbnailIndex: computed(() => null),
  setThumbnailRef: () => () => {},
}

const controller: LightboxProviderController<TMeta> = provider
  ? { ...provider, open, openById }
  : disabledController

const { activeId, activePhoto } = useGalleryModel(
  'PhotoGroup',
  () => props.active,
  () => canonicalPhotos.value,
  controller,
  (id) => emit('update:active', id),
)

const hiddenPhoto = computed<PhotoItem<TMeta> | null>(() => {
  if (!provider) return null
  const index = provider.hiddenThumbnailIndex.value
  return index === null ? null : (canonicalPhotos.value[index] ?? null)
})
const isOpen = computed(() => provider?.isOpen.value ?? false)

const groupContext: PhotoGroupContext = {
  enabled,
  hasPhoto,
  replaceCapabilities,
  removeCapabilities,
  open,
  close,
  activateById,
  photos: canonicalPhotos,
  hiddenPhoto,
  isOpen,
  activeId,
  activePhoto,
}
provide(PhotoGroupContextKey, groupContext)

defineExpose({ open, openById, close, isOpen, activeId, activePhoto })
</script>
