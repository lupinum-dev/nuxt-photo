<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="mergeProps(interactiveAttrs, $attrs)"
    :style="figureStyle"
  >
    <PhotoImage
      :photo="resolvedPhoto"
      context="thumb"
      :image-adapter="imageAdapter"
      :loading="loading"
      :priority="priority"
      class="np-photo__img"
      :class="imgClass"
    />
    <figcaption v-if="photo.caption" class="np-photo__caption" :class="captionClass">
      {{ photo.caption }}
    </figcaption>
  </figure>
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import {
  ref,
  computed,
  inject,
  onMounted,
  onBeforeUnmount,
  watch,
  watchEffect,
  mergeProps,
  type Component,
  type VNodeChild,
} from 'vue'

import { useGalleryRuntime } from '../gallery/runtime'
import { useGalleryModel } from '../gallery/model'
import { provideLightbox } from '../composables/index'
import { PhotoImage } from '../primitives/index'
import type { PhotoItem, ImageAdapter } from '../core/index'
import type { LightboxNavigationMode, LightboxTransitionOption } from '../core/index'
import { providePhotoConfig, isLightboxOptions, type LightboxOptions } from '../config'
import Lightbox from './Lightbox.vue'
import { PhotoGroupContextKey } from './photo-group/context'
import { normalizePhotos } from '../core/photo/normalize'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { usePhotoLabels } from '../composables/usePhotoLabels'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /**
   * The photo to render. Needs a stable `id`, a `src`, and the real pixel `width` and `height`.
   * Invalid data throws.
   */
  photo: PhotoItem<TMeta>
  /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
  active?: string | null
  /**
   * `true` opens a one-photo lightbox, a component replaces it. Ignored inside `PhotoGroup`, which
   * owns the lightbox. Read once at mount; change the component `key` to remount.
   */
  lightbox?: boolean | Component | LightboxOptions
  /**
   * Inside a `PhotoGroup`, render a plain image that does not open the lightbox. The photo stays in
   * the group's navigation.
   */
  lightboxIgnore?: boolean
  /** Image adapter for this component. Wins over the inherited config and the module default. */
  imageAdapter?: ImageAdapter<TMeta>
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
  /**
   * Native image `loading` hint. Use `'eager'` for images in the first screen.
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager'
  /** Load eagerly with high fetch priority. Explicit `loading` wins. @default false */
  priority?: boolean
  /** Classes for each `<img>`. */
  imgClass?: string
  /** Classes for the caption. */
  captionClass?: string
}>()
const emit = defineEmits<{ 'update:active': [id: string | null] }>()
const slots = defineSlots<{
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

const photoConfig = providePhotoConfig(() => ({
  lightbox: isLightboxOptions(props.lightbox) ? props.lightbox : undefined,
}))

const resolveDimensions = (src: string) => photoConfig.value.dimensions?.(src)
const resolvedPhoto = computed(
  () =>
    normalizePhotos<TMeta>([props.photo], { owner: 'Photo', onInvalid: 'throw', resolveDimensions })
      .photos[0]!,
)
watchEffect(() => {
  void resolvedPhoto.value
})

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)
if (!group)
  useGalleryRuntime(
    computed(() => [resolvedPhoto.value]),
    () => thumbRef.value,
  )

// Global lightbox override
const injectedLightbox = photoConfig.value.lightbox.component ?? null

const soloLightboxComponent = !group
  ? resolveLightboxComponent(
      isLightboxOptions(props.lightbox) ? true : props.lightbox,
      injectedLightbox,
      Lightbox,
      false,
    )
  : null
// Standalone mode: lightbox capability set and no parent group.
const hasSoloProvider = soloLightboxComponent !== null
const isSolo = computed(() => hasSoloProvider)
warnOnSetupOptionChanges('Photo', {
  lightbox: () => props.lightbox,
})

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? provideLightbox(resolvedPhoto, {
      transition: () => props.transition,
      navigation: () => props.navigation,
      imageAdapter: computed(() => props.imageAdapter),
      resolveSlide: (photo) => {
        if ((photo !== props.photo && String(photo.id) !== String(props.photo.id)) || !slots.slide)
          return null
        return (slotProps) => slots.slide?.(slotProps) ?? null
      },
    })
  : null

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value?.id === props.photo.id)

// Group mode: the parent owns the canonical collection; this photo is a trigger.
const isGrouped = computed(
  () => !!group && group.enabled && group.hasPhoto(props.photo.id) && !props.lightboxIgnore,
)
const isInteractive = computed(() => isSolo.value || isGrouped.value)

const figureStyle = computed(() => {
  if (isSolo.value) {
    return {
      margin: 0,
      opacity: soloCtx && soloCtx.hiddenThumbnailIndex.value === 0 ? 0 : 1,
      cursor: 'pointer',
    }
  }
  if (isGrouped.value) {
    return { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
  }
  return { margin: 0 }
})

function handleClick() {
  return open()
}

const labels = usePhotoLabels()

const interactiveAttrs = computed(() => {
  if (!isInteractive.value) return {}
  return createPhotoTriggerBindings(
    resolvedPhoto.value,
    0,
    handleClick,
    props.photo.alt || labels.viewPhoto(1),
  )
})

// Capability registration with the parent group.
const id = Symbol()
const registered = ref(false)

function shouldRegisterWithGroup() {
  return group && group.enabled && !props.lightboxIgnore && !isSolo.value
}

function unregisterFromGroup() {
  if (!group || !registered.value) return
  group.removeCapabilities(id)
  registered.value = false
}

function registerWithGroup() {
  if (!shouldRegisterWithGroup()) return
  group!.replaceCapabilities(id, [
    {
      id: props.photo.id,
      getThumbnailElement: () => thumbRef.value,
      renderSlide: slots.slide
        ? (slotProps) =>
            slots.slide?.({ ...slotProps, photo: slotProps.photo as PhotoItem<TMeta> }) ?? null
        : null,
    },
  ])
  registered.value = true
}

onMounted(() => {
  if (soloCtx) {
    soloCtx.setThumbnailRef(0)(thumbRef.value)
  }
})

registerWithGroup()

watch(
  () => [props.photo.id, props.lightboxIgnore],
  () => {
    unregisterFromGroup()
    registerWithGroup()
  },
)

onBeforeUnmount(unregisterFromGroup)

async function open(index = 0) {
  if (index !== 0) throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  if (isGrouped.value) return group!.activateById(props.photo.id, thumbRef.value)
  if (!soloCtx) return
  soloCtx.setThumbnailRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
async function openById(id: string) {
  if (id !== resolvedPhoto.value.id)
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  await open()
}
async function close() {
  if (isGrouped.value) await group!.close()
  else await soloCtx?.close()
}
const isOpen = computed(() =>
  isGrouped.value
    ? !!group?.isOpen.value && group.activeId.value === props.photo.id
    : (soloCtx?.isOpen.value ?? false),
)
const { activeId, activePhoto } = useGalleryModel(
  'Photo',
  () => props.active,
  () => [resolvedPhoto.value],
  {
    isOpen,
    activeId: computed(() => (isOpen.value ? resolvedPhoto.value.id : null)),
    activePhoto: computed(() => (isOpen.value ? resolvedPhoto.value : null)),
    openById,
    close,
  },
  (id) => emit('update:active', id),
)
defineExpose({ open, openById, close, isOpen, activeId, activePhoto })
</script>
