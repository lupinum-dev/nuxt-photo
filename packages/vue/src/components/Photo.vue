<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="mergeProps(interactiveAttrs, $attrs)"
    :style="figureStyle"
  >
    <PhotoImage
      :photo="photo"
      context="thumb"
      :image-adapter="imageAdapter"
      :loading="loading ?? 'lazy'"
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

import { provideLightbox } from '../composables/index'
import { PhotoImage } from '../primitives/index'
import { LightboxComponentKey } from '../provide/keys'
import type { PhotoItem, ImageAdapter } from '../core/index'
import type { LightboxNavigationMode, LightboxTransitionOption } from '../core/index'
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
  /**
   * `true` opens a one-photo lightbox, a component replaces it. Ignored inside `PhotoGroup`, which
   * owns the lightbox. Read once at mount; change the component `key` to remount.
   */
  lightbox?: boolean | Component
  /**
   * Inside a `PhotoGroup`, render a plain image that does not open the lightbox. The photo stays in
   * the group's navigation.
   */
  lightboxIgnore?: boolean
  /** Image adapter for this component. Wins over `ImageAdapterKey` and the module default. */
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
  /** Classes for each `<img>`. */
  imgClass?: string
  /** Classes for the caption. */
  captionClass?: string
}>()
const slots = defineSlots<{
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

function validatePhoto() {
  normalizePhotos<TMeta>([props.photo], { owner: 'Photo', onInvalid: 'throw' })
}
watchEffect(validatePhoto)

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

const soloLightboxComponent = !group
  ? resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, false)
  : null
// Standalone mode: lightbox capability set and no parent group.
const hasSoloProvider = soloLightboxComponent !== null
const isSolo = computed(() => hasSoloProvider)
warnOnSetupOptionChanges('Photo', {
  lightbox: () => props.lightbox,
})

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? provideLightbox(
      computed(() => props.photo),
      {
        transition: () => props.transition,
        navigation: () => props.navigation,
        imageAdapter: computed(() => props.imageAdapter),
        resolveSlide: (photo) => {
          if (
            (photo !== props.photo && String(photo.id) !== String(props.photo.id)) ||
            !slots.slide
          )
            return null
          return (slotProps) => slots.slide?.(slotProps) ?? null
        },
      },
    )
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
  if (isSolo.value) return soloOpen()
  else if (isGrouped.value) return group!.activateById(props.photo.id, thumbRef.value)
}

const labels = usePhotoLabels()

const interactiveAttrs = computed(() => {
  if (!isInteractive.value) return {}
  return createPhotoTriggerBindings(
    props.photo,
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

async function soloOpen() {
  if (!soloCtx) return
  soloCtx.setThumbnailRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
</script>
