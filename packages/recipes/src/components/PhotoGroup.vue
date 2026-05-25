<template>
  <slot
    :open="open"
    :open-photo="openPhoto"
    :open-by-id="openById"
    :photos="collectedPhotos"
    :set-thumb-ref="setThumbRef"
    :trigger="trigger"
  />
  <component :is="LightboxComponent" v-if="LightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import {
  ref,
  computed,
  inject,
  provide,
  type Component,
  type ComponentPublicInstance,
} from 'vue'
import {
  LightboxComponentKey,
  type LightboxSlideRenderer,
  type LightboxTransitionOption,
  useLightboxProvider,
} from '@nuxt-photo/vue'
import {
  photoId,
  type ImageAdapter,
  type PhotoItem,
  type PhotoMapper,
} from '@nuxt-photo/core'
import Lightbox from './Lightbox.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupContext,
} from '../context/photoGroup'
import { resolveRecipePhotos } from '../utils/photos'
import { devWarn } from '../utils/runtime'

const props = withDefaults(
  defineProps<{
    /** Explicit photos list for custom layout/programmatic use. If omitted, photos auto-collect from child Photo components. */
    photos?: PhotoItem[] | any[]
    /** Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS/API data directly. */
    itemMapper?: PhotoMapper
    imageAdapter?: ImageAdapter
    /** Lightbox to render: true = default, false = none, Component = custom */
    lightbox?: boolean | Component
    /** Transition mode for open/close animations */
    transition?: LightboxTransitionOption
  }>(),
  {
    lightbox: true,
  },
)

// Global lightbox override (set via provide(LightboxComponentKey, MyLightbox) in app.vue)
const injectedLightbox = inject(LightboxComponentKey, null)

// Registration storage: Map preserves insertion order (O(1) register/unregister)
type Registration = {
  photo: PhotoItem
  getThumbEl: () => HTMLElement | null
  renderSlide?: LightboxSlideRenderer | null
}

const registrationMap = new Map<symbol, Registration>()
const registrationVersion = ref(0)
let warnedIgnoredRegistrations = false

// 'explicit' when :photos prop is provided; 'auto' when collecting from children
const groupMode = computed<'auto' | 'explicit'>(() =>
  props.photos !== undefined ? 'explicit' : 'auto',
)
// The Vue provider can only be created during setup; a group mounted disabled
// must stay inert instead of later exposing controls with no backing context.
const hasLightboxProvider: boolean = props.lightbox !== false
const lightboxEnabled = computed(
  () => hasLightboxProvider && props.lightbox !== false,
)

function register(
  id: symbol,
  photo: PhotoItem,
  getThumbEl: () => HTMLElement | null,
  renderSlide?: LightboxSlideRenderer | null,
) {
  if (props.photos !== undefined) {
    if (!warnedIgnoredRegistrations) {
      warnedIgnoredRegistrations = true
      devWarn(
        'PhotoGroup has both a :photos prop and child registrations. The :photos prop is the only photo source; child registrations are ignored. Remove :photos to use auto-collection.',
      )
    }
    return
  }
  for (const [existingId, entry] of registrationMap) {
    if (existingId !== id && photoId(entry.photo) === photoId(photo)) {
      devWarn(`Duplicate photo id "${photo.id}" registered in PhotoGroup`)
      break
    }
  }
  registrationMap.set(id, { photo, getThumbEl, renderSlide })
  registrationVersion.value++
}

function unregister(id: symbol) {
  if (props.photos !== undefined) return
  registrationMap.delete(id)
  registrationVersion.value++
}

// Collected photos (reactive) — either from :photos prop or auto-registered children
const collectedPhotos = computed<PhotoItem[]>(() => {
  void registrationVersion.value // reactive dependency
  if (props.photos !== undefined) {
    return resolveRecipePhotos(props.photos, props.itemMapper, 'PhotoGroup')
  }
  return Array.from(registrationMap.values()).map((r) => r.photo)
})

// Full lightbox context — creates and provides to children
const ctx = hasLightboxProvider
  ? useLightboxProvider(collectedPhotos, {
      transition: props.transition,
      imageAdapter: props.imageAdapter,
      resolveSlide: (photo) => {
        if (groupMode.value !== 'auto') return null
        for (const entry of registrationMap.values()) {
          if (photoId(entry.photo) === photoId(photo)) {
            return entry.renderSlide ?? null
          }
        }
        return null
      },
    })
  : null

const ignoreThumbRef = (_el: Element | ComponentPublicInstance | null) => {
  // no lightbox means no transition anchor is needed
}

function setThumbRef(index: number) {
  return ctx?.setThumbRef(index) ?? ignoreThumbRef
}

function findPhotoIndex(photo: PhotoItem) {
  return collectedPhotos.value.findIndex((p) => photoId(p) === photoId(photo))
}

function findPhotoIndexById(id: string | number) {
  return collectedPhotos.value.findIndex(
    (photo) => photoId(photo) === String(id),
  )
}

function warnMissingPhoto(photoOrIndex: number | string) {
  if (typeof photoOrIndex === 'number') {
    devWarn(`No photo found at index ${photoOrIndex}`)
    return
  }

  devWarn(`No photo found for id "${String(photoOrIndex)}"`)
}

function resolveTriggerPhoto(
  photoOrIndex: PhotoItem | number,
  maybeIndex?: number,
) {
  const photos = collectedPhotos.value
  const index =
    typeof photoOrIndex === 'number'
      ? photoOrIndex
      : typeof maybeIndex === 'number'
        ? maybeIndex
        : findPhotoIndex(photoOrIndex)

  return {
    index,
    hasValidIndex: index >= 0 && index < photos.length,
    photo: typeof photoOrIndex === 'number' ? photos[index] : photoOrIndex,
  }
}

async function openResolvedIndex(index: number) {
  if (!lightboxEnabled.value || !ctx) return

  if (index < 0 || index >= collectedPhotos.value.length) {
    warnMissingPhoto(index)
    return
  }

  syncThumbRefs()
  await ctx.open(index)
}

function buildDisabledTrigger(photoOrIndex: PhotoItem | number) {
  const photo =
    typeof photoOrIndex === 'number'
      ? collectedPhotos.value[photoOrIndex]
      : photoOrIndex

  return photo
    ? { 'data-nuxt-photo-trigger': photoId(photo) }
    : { 'data-nuxt-photo-trigger': String(photoOrIndex) }
}

function buildEnabledTrigger(
  photoOrIndex: PhotoItem | number,
  maybeIndex?: number,
) {
  const { index, hasValidIndex, photo } = resolveTriggerPhoto(
    photoOrIndex,
    maybeIndex,
  )
  const labelIndex = hasValidIndex ? index + 1 : 0

  return {
    ref: hasValidIndex ? setThumbRef(index) : undefined,
    role: 'button',
    tabindex: 0,
    'aria-label': photo?.alt || `View photo ${labelIndex}`,
    'data-nuxt-photo-trigger': photo ? photoId(photo) : String(index),
    onClick: () => openResolvedIndex(index),
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        void openResolvedIndex(index)
      }
    },
  }
}

// Which photo's thumb is currently hidden during transitions
const hiddenPhoto = computed<PhotoItem | null>(() => {
  if (!ctx) return null
  const idx = ctx.hiddenThumbIndex.value
  if (idx === null) return null
  return collectedPhotos.value[idx] ?? null
})

function syncThumbRefs() {
  if (!ctx) return
  // Wire current thumb elements from registrations (auto mode only)
  if (props.photos === undefined) {
    Array.from(registrationMap.values()).forEach((reg, i) => {
      ctx.setThumbRef(i)(reg.getThumbEl())
    })
  }
}

async function open(index = 0) {
  await openResolvedIndex(index)
}

async function openPhoto(photo: PhotoItem) {
  if (!lightboxEnabled.value || !ctx) return

  const index = findPhotoIndex(photo)
  if (index < 0) {
    warnMissingPhoto(photoId(photo))
    return
  }
  await open(index)
}

async function openById(id: string | number) {
  if (!lightboxEnabled.value || !ctx) return

  const index = findPhotoIndexById(id)
  if (index < 0) {
    warnMissingPhoto(id)
    return
  }
  await open(index)
}

async function close() {
  if (!ctx) return
  await ctx.close()
}

function trigger(photoOrIndex: PhotoItem | number, maybeIndex?: number) {
  return lightboxEnabled.value && ctx
    ? buildEnabledTrigger(photoOrIndex, maybeIndex)
    : buildDisabledTrigger(photoOrIndex)
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  mode: groupMode,
  lightboxEnabled,
  register,
  unregister,
  open,
  openPhoto,
  openById,
  photos: collectedPhotos,
  hiddenPhoto,
}

provide(PhotoGroupContextKey, groupContext)

// Which lightbox component to render
const LightboxComponent = computed<Component | null>(() => {
  if (!lightboxEnabled.value) return null
  if (props.lightbox === true) return injectedLightbox ?? Lightbox
  return props.lightbox as Component
})

defineExpose({ open, openPhoto, openById, close })
</script>
