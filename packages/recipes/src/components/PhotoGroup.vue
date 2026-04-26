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
  type PhotoItem,
  type PhotoAdapter,
} from '@nuxt-photo/core'
import Lightbox from './Lightbox.vue'

const props = withDefaults(
  defineProps<{
    /** Explicit photos list (for headless/programmatic use). If omitted, photos auto-collect from child Photo components. */
    photos?: PhotoItem[] | any[]
    /** Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS/API data directly. */
    itemAdapter?: PhotoAdapter
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
    devWarn(
      'PhotoGroup has both a :photos prop and child <Photo> registrations. The :photos prop takes precedence; child registrations are ignored. Remove :photos to use auto-collection, or remove child <Photo> components.',
    )
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
  registrationMap.delete(id)
  registrationVersion.value++
}

// Collected photos (reactive) — either from :photos prop or auto-registered children
const collectedPhotos = computed<PhotoItem[]>(() => {
  void registrationVersion.value // reactive dependency
  if (props.photos !== undefined) {
    return props.itemAdapter
      ? props.photos.map(props.itemAdapter)
      : (props.photos as PhotoItem[])
  }
  return Array.from(registrationMap.values()).map((r) => r.photo)
})

// Full lightbox context — creates and provides to children
const ctx = useLightboxProvider(collectedPhotos, {
  transition: props.transition,
  resolveSlide: (photo) => {
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
  syncThumbRefs()
  await ctx.open(index)
}

async function openPhoto(photo: PhotoItem) {
  const index = collectedPhotos.value.findIndex(
    (p) => photoId(p) === photoId(photo),
  )
  await open(index >= 0 ? index : 0)
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
  const safeIndex = index >= 0 ? index : 0
  const photo =
    typeof photoOrIndex === 'number' ? photos[safeIndex] : photoOrIndex

  return {
    ref: ctx.setThumbRef(safeIndex),
    role: 'button',
    tabindex: 0,
    'aria-label': photo?.alt || `View photo ${safeIndex + 1}`,
    'data-nuxt-photo-trigger': photo ? photoId(photo) : String(safeIndex),
    onClick: () => open(safeIndex),
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        void open(safeIndex)
      }
    },
  }
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  mode: groupMode.value,
  register,
  unregister,
  open,
  openPhoto,
  openById,
  photos: collectedPhotos,
  hiddenPhoto,
}

// Keep mode reactive for children that check it after mount
Object.defineProperty(groupContext, 'mode', {
  get: () => groupMode.value,
  enumerable: true,
})

provide(PhotoGroupContextKey, groupContext)

// Which lightbox component to render
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? Lightbox
  return props.lightbox as Component
})

defineExpose({ open, openPhoto, openById, close: ctx.close })
</script>
