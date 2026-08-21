<template>
  <component
    v-if="!dropped"
    :is="isInteractive ? 'button' : 'figure'"
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
    <span v-if="photo.caption" class="np-photo__caption" :class="captionClass">
      {{ photo.caption }}
    </span>
  </component>
  <component :is="soloLightboxComponent" v-if="!dropped && isSolo" />
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
import type {
  PhotoItem,
  ImageAdapter,
  InvalidPhotoPolicy,
  LightboxTransitionOption,
} from '../core/index'
import Lightbox from './Lightbox.vue'
import { PhotoGroupContextKey } from './photo-group/context'
import { normalizePhotos, PhotoValidationError } from '../core/photo/normalize'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { usePhotoLabels } from '../provide/labels'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    photo: PhotoItem<TMeta>
    /** Opens a solo lightbox when this Photo is not inside a PhotoGroup. */
    lightbox?: boolean | Component
    /** Opt this photo out of a parent PhotoGroup (renders as plain image). */
    lightboxIgnore?: boolean
    imageAdapter?: ImageAdapter<TMeta>
    transition?: LightboxTransitionOption
    loading?: 'lazy' | 'eager'
    imgClass?: string
    captionClass?: string
    validation?: InvalidPhotoPolicy
  }>(),
  { lightbox: true, validation: 'throw' },
)
const slots = defineSlots<{
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

const resolution = computed(() =>
  normalizePhotos<TMeta>([props.photo], { owner: 'Photo', onInvalid: 'return' }),
)
const dropped = computed(() => props.validation === 'drop' && resolution.value.issues.length > 0)

function assertValidPhoto() {
  if (props.validation === 'throw' && resolution.value.issues.length > 0) {
    throw new PhotoValidationError('Photo', resolution.value.issues)
  }
}

watch([resolution, () => props.validation], assertValidPhoto, { immediate: true })

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

const soloLightboxComponent = computed(() =>
  !group ? resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox) : null,
)
const isSolo = computed(() => soloLightboxComponent.value !== null)

// Solo lightbox context — only created when solo (outside group)
const soloCtx = !group
  ? provideLightbox(
      computed(() => (dropped.value ? [] : [props.photo])),
      {
        transition: () => props.transition,
        imageAdapter: computed(() => props.imageAdapter),
        resolveSlide: (photo) => {
          if ((photo.id !== props.photo.id && photo !== props.photo) || !slots.slide) return null
          return (slotProps) => slots.slide?.(slotProps) ?? null
        },
      },
    )
  : null

watch(isSolo, (enabled) => {
  if (!enabled && soloCtx?.isOpen.value) void soloCtx.close()
})

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value?.id === props.photo.id)

// Group mode: the parent owns the canonical collection; this photo is a trigger.
const isGrouped = computed(
  () =>
    !!group &&
    group.enabled.value &&
    group.hasPhoto(props.photo.id) &&
    !props.lightboxIgnore &&
    !dropped.value,
)
const isInteractive = computed(() => !dropped.value && (isSolo.value || isGrouped.value))

const figureStyle = computed(() => {
  if (isSolo.value) {
    return {
      margin: 0,
      opacity: soloCtx?.hiddenThumbnailIndex.value === 0 ? 0 : 1,
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
  return createPhotoTriggerBindings(handleClick, props.photo.alt || labels.value.viewPhoto(1))
})

// Capability registration with the parent group.
const id = Symbol()
const registered = ref(false)

function shouldRegisterWithGroup() {
  return group && group.enabled.value && !props.lightboxIgnore && !isSolo.value && !dropped.value
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
        ? (slotProps) => slots.slide?.({ ...slotProps, photo: props.photo }) ?? null
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
  () => [props.photo, props.lightboxIgnore, dropped.value, group?.enabled.value],
  () => {
    unregisterFromGroup()
    registerWithGroup()
  },
)

onBeforeUnmount(unregisterFromGroup)

async function soloOpen() {
  if (!soloCtx || !isSolo.value || dropped.value) return
  soloCtx.setThumbnailRef(0)(thumbRef.value)
  await soloCtx.open(0)
}

async function open(index = 0) {
  if (isSolo.value && !dropped.value) {
    if (index !== 0) throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
    return soloOpen()
  }
  if (isGrouped.value) return group!.open(index)
}

async function openById(id: string) {
  if (isSolo.value && !dropped.value) {
    if (id !== props.photo.id) throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
    return soloOpen()
  }
  if (isGrouped.value) {
    return id === props.photo.id
      ? group!.activateById(id, thumbRef.value)
      : group!.openById(id)
  }
}

async function close() {
  if (isSolo.value) return soloCtx?.close()
  if (isGrouped.value) return group!.close()
}

const isOpen = computed(() => {
  if (isSolo.value) return soloCtx?.isOpen.value ?? false
  if (isGrouped.value) return group!.isOpen.value
  return false
})

defineExpose({ open, openById, close, isOpen })
</script>
