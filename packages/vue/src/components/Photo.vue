<template>
  <figure
    v-if="!dropped"
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
  <component :is="soloLightboxComponent" v-if="!dropped && isSolo && soloCtx" />
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

import { useLightboxProvider } from '../composables/index'
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
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { usePhotoLabels } from '../composables/usePhotoLabels'
import { devWarn } from '../core/env'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    photo: PhotoItem<TMeta>
    /** Opens a solo lightbox when this Photo is not inside a PhotoGroup */
    lightbox?: boolean | Component
    /** Opt this photo out of a parent PhotoGroup (renders as plain image) */
    lightboxIgnore?: boolean
    imageAdapter?: ImageAdapter<TMeta>
    /** Transition configuration for a standalone lightbox. Reactive. */
    transition?: LightboxTransitionOption
    loading?: 'lazy' | 'eager'
    /** Extra classes for the inner img element */
    imgClass?: string
    /** Extra classes for the caption element */
    captionClass?: string
    /**
     * What to do with an invalid photo. `'throw'` (default) fails loudly;
     * `'drop'` renders nothing, matching the `PhotoAlbum` policy surface.
     */
    validation?: InvalidPhotoPolicy
  }>(),
  { validation: 'throw' },
)
const slots = defineSlots<{
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

// Validates on access and re-validates when the photo prop changes.
// With `validation="drop"` an invalid photo renders nothing; otherwise it
// fails fast with a structured error, matching the historical contract.
const resolution = computed(() =>
  normalizePhotos<TMeta>([props.photo], {
    owner: 'Photo',
    onInvalid: 'return',
  }),
)
const dropped = computed(() => props.validation === 'drop' && resolution.value.issues.length > 0)

function assertValidPhoto() {
  if (resolution.value.issues.length > 0) {
    throw new PhotoValidationError('Photo', resolution.value.issues)
  }
}

if (props.validation !== 'drop') {
  assertValidPhoto()
}

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

// Solo lightbox context — only created when solo (outside group) and valid.
// Created once at setup; a photo that becomes valid later requires a remount,
// matching the setup-time semantics of the `lightbox` prop.
const soloCtx =
  isSolo.value && !dropped.value
    ? useLightboxProvider(
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
  if (!isInteractive.value || dropped.value) return {}
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
  return group && group.enabled && !props.lightboxIgnore && !isSolo.value && !dropped.value
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
    if (props.validation !== 'drop') assertValidPhoto()
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

// Programmatic control surface: drives the solo lightbox directly, or
// delegates to the parent PhotoGroup when grouped.
async function open(index = 0) {
  if (isSolo.value) {
    if (index !== 0) {
      throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
    }
    await soloOpen()
    return
  }
  if (isGrouped.value) {
    await group!.open(index)
    return
  }
  devWarn('[nuxt-photo] Photo.open() was ignored because no lightbox is available.')
}

async function openById(id: string) {
  if (isSolo.value) {
    if (id !== props.photo.id) {
      throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
    }
    await soloOpen()
    return
  }
  if (isGrouped.value) {
    await group!.activateById(id, thumbRef.value)
    return
  }
  devWarn('[nuxt-photo] Photo.openById() was ignored because no lightbox is available.')
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
