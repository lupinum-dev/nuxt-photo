<template>
  <slot
    :open="open"
    :open-photo="openPhoto"
    :open-by-id="openById"
    :photos="collectedPhotos"
    :set-thumb-ref="ctx.setThumbRef"
    :trigger="trigger"
  />
  <component :is="LightboxComponent" v-if="LightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { ref, computed, inject, provide, type Component } from 'vue'
import {
  LightboxComponentKey,
  type LightboxSlideRenderer,
  type LightboxTransitionOption,
  PhotoGroupContextKey,
  type PhotoGroupContext,
  useLightboxProvider,
} from '@nuxt-photo/vue'
import {
  devWarn,
  photoId,
  type ImageAdapter,
  type PhotoItem,
  type PhotoMapper,
} from '@nuxt-photo/core'
import Lightbox from './Lightbox.vue'
import { resolveRecipePhotos } from '../utils/photos'

const props = withDefaults(
  defineProps<{
    /** Explicit photos list (for headless/programmatic use). If omitted, photos auto-collect from child Photo components. */
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
const ctx = useLightboxProvider(collectedPhotos, {
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

// Which photo's thumb is currently hidden during transitions
const hiddenPhoto = computed<PhotoItem | null>(() => {
  const idx = ctx.hiddenThumbIndex.value
  if (idx === null) return null
  return collectedPhotos.value[idx] ?? null
})

function syncThumbRefs() {
  // Wire current thumb elements from registrations (auto mode only)
  if (props.photos === undefined) {
    Array.from(registrationMap.values()).forEach((reg, i) => {
      ctx.setThumbRef(i)(reg.getThumbEl())
    })
  }
}

async function open(index = 0) {
  if (index < 0 || index >= collectedPhotos.value.length) {
    devWarn(`No photo found at index ${index}`)
    return
  }
  syncThumbRefs()
  await ctx.open(index)
}

async function openPhoto(photo: PhotoItem) {
  const index = collectedPhotos.value.findIndex(
    (p) => photoId(p) === photoId(photo),
  )
  if (index < 0) {
    devWarn(`No photo found for id "${photoId(photo)}"`)
    return
  }
  await open(index)
}

async function openById(id: string | number) {
  const index = collectedPhotos.value.findIndex(
    (photo) => photoId(photo) === String(id),
  )
  if (index < 0) {
    devWarn(`No photo found for id "${String(id)}"`)
    return
  }
  await open(index)
}

function trigger(photoOrIndex: PhotoItem | number, maybeIndex?: number) {
  const photos = collectedPhotos.value
  const index =
    typeof photoOrIndex === 'number'
      ? photoOrIndex
      : typeof maybeIndex === 'number'
        ? maybeIndex
        : photos.findIndex((photo) => photoId(photo) === photoId(photoOrIndex))
  const hasValidIndex = index >= 0 && index < photos.length
  const photo = typeof photoOrIndex === 'number' ? photos[index] : photoOrIndex
  const labelIndex = hasValidIndex ? index + 1 : 0

  return {
    ref: hasValidIndex ? ctx.setThumbRef(index) : undefined,
    role: 'button',
    tabindex: 0,
    'aria-label': photo?.alt || `View photo ${labelIndex}`,
    'data-nuxt-photo-trigger': photo ? photoId(photo) : String(index),
    onClick: () => open(index),
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        void open(index)
      }
    },
  }
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  mode: groupMode,
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
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? Lightbox
  return props.lightbox as Component
})

defineExpose({ open, openPhoto, openById, close: ctx.close })
</script>
