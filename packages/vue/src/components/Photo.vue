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
  mergeProps,
  type Component,
  type VNodeChild,
} from 'vue'

import { provideLightbox } from '../composables/index'
import { PhotoImage } from '../primitives/index'
import { LightboxComponentKey } from '../provide/keys'
import type { PhotoItem, ImageAdapter } from '../core/index'
import type { LightboxTransitionOption } from '../core/index'
import Lightbox from './Lightbox.vue'
import { PhotoGroupContextKey } from './photo-group/context'
import { normalizePhotos } from '../core/photo/normalize'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { usePhotoLabels } from '../composables/usePhotoLabels'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photo: PhotoItem<TMeta>
  /** Opens a solo lightbox when this Photo is not inside a PhotoGroup */
  lightbox?: boolean | Component
  /** Opt this photo out of a parent PhotoGroup (renders as plain image) */
  lightboxIgnore?: boolean
  imageAdapter?: ImageAdapter<TMeta>
  /** Setup-time transition configuration for a standalone lightbox. */
  transition?: LightboxTransitionOption
  loading?: 'lazy' | 'eager'
  /** Extra classes for the inner img element */
  imgClass?: string
  /** Extra classes for the caption element */
  captionClass?: string
}>()
const slots = defineSlots<{
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

function validatePhoto() {
  normalizePhotos<TMeta>([props.photo], { owner: 'Photo', onInvalid: 'throw' })
}
validatePhoto()

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
  return createPhotoTriggerBindings(props.photo, 0, handleClick, props.photo.alt || labels.viewPhoto(1))
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
  () => [props.photo, props.lightboxIgnore],
  () => {
    validatePhoto()
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
