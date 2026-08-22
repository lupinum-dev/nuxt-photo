<template>
  <slot :photos="canonicalPhotos" :controller="controller" />
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, provide, shallowRef, type Component } from 'vue'
import { provideLightbox } from '../composables/index'
import { LightboxComponentKey, type LightboxProviderController } from '../provide/keys'
import type {
  ImageAdapter,
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  LightboxTransitionOption,
  PhotoItem,
} from '../core/index'
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
    /** Canonical photo collection and navigation order. */
    photos: readonly PhotoItem<TMeta>[]
    validation?: InvalidPhotoPolicy
    imageAdapter?: ImageAdapter<TMeta>
    /** Setup-time lightbox capability. Remount to change it. */
    lightbox?: boolean | Component
    /** Reactive transition configuration. */
    transition?: LightboxTransitionOption
  }>(),
  { lightbox: true },
)

const emit = defineEmits<{
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const canonicalPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoGroup',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)
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

const injectedLightbox = inject(LightboxComponentKey, null)
const lightboxComponent = resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, true)
const enabled = lightboxComponent !== null
warnOnSetupOptionChanges('PhotoGroup', {
  lightbox: () => props.lightbox,
})
const provider = enabled
  ? provideLightbox(canonicalPhotos, {
      transition: () => props.transition,
      imageAdapter: computed(() => props.imageAdapter),
      resolveSlide: (photo) => capabilitiesById.value.get(photo.id)?.renderSlide ?? null,
    })
  : null

function replaceCapabilities(owner: symbol, entries: readonly PhotoGroupCapability[]) {
  for (const entry of entries) {
    if (!canonicalIds.value.has(entry.id)) {
      throw new Error(
        `[nuxt-photo] PhotoGroup descendant photo "${entry.id}" is missing from the canonical photos collection`,
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
}
provide(PhotoGroupContextKey, groupContext)

defineExpose({ open, openById, close, isOpen })
</script>
