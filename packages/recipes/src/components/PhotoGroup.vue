<template>
  <slot :open="open" :setThumbRef="ctx.setThumbRef" />
  <component :is="LightboxComponent" v-if="LightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { ref, computed, inject, provide, type Component } from 'vue'
import {
  provideLightboxContexts,
  PhotoGroupContextKey,
  LightboxComponentKey,
  type LightboxSlideRenderer,
  type PhotoGroupContext,
  useLightboxContext,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/internal'
import { photoId, type PhotoItem } from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

const props = withDefaults(defineProps<{
  /** Explicit photos list (for headless/programmatic use). If omitted, photos auto-collect from child Photo components. */
  photos?: PhotoItem[]
  /** Lightbox to render: true = default, false = none, Component = custom */
  lightbox?: boolean | Component
  /** Transition mode for open/close animations */
  transition?: LightboxTransitionOption
}>(), {
  lightbox: true,
})

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
const groupMode = computed<'auto' | 'explicit'>(() => props.photos !== undefined ? 'explicit' : 'auto')

function register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null) {
  if (process.env.NODE_ENV !== 'production') {
    for (const [existingId, entry] of registrationMap) {
      if (existingId !== id && photoId(entry.photo) === photoId(photo)) {
        console.warn(`[nuxt-photo] Duplicate photo id "${photo.id}" registered in PhotoGroup`)
      }
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
  if (props.photos !== undefined) return props.photos
  return Array.from(registrationMap.values()).map(r => r.photo)
})

// Full internal lightbox context
const ctx = useLightboxContext(collectedPhotos, props.transition)

// Which photo's thumb is currently hidden during transitions
const hiddenPhoto = computed<PhotoItem | null>(() => {
  const idx = ctx.hiddenThumbIndex.value
  if (idx === null) return null
  return collectedPhotos.value[idx] ?? null
})

// Wire thumb refs from registrations, then open
async function open(photoOrIndex: PhotoItem | number = 0) {
  const photos = collectedPhotos.value
  let index: number

  if (typeof photoOrIndex === 'number') {
    index = photoOrIndex
  } else {
    index = photos.findIndex(p => photoId(p) === photoId(photoOrIndex))
    if (index === -1) index = 0
  }

  // Wire current thumb elements from registrations (auto mode only)
  if (props.photos === undefined) {
    Array.from(registrationMap.values()).forEach((reg, i) => {
      ctx.setThumbRef(i)(reg.getThumbEl())
    })
  }

  await ctx.open(index)
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  mode: groupMode.value,
  register,
  unregister,
  open,
  photos: collectedPhotos,
  hiddenPhoto,
}

// Keep mode reactive for children that check it after mount
Object.defineProperty(groupContext, 'mode', {
  get: () => groupMode.value,
  enumerable: true,
})

provide(PhotoGroupContextKey, groupContext)
provideLightboxContexts(ctx, {
  resolveSlide: photo => {
    for (const entry of registrationMap.values()) {
      if (photoId(entry.photo) === photoId(photo)) {
        return entry.renderSlide ?? null
      }
    }
    return null
  },
})

// Which lightbox component to render
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? InternalLightbox
  return props.lightbox as Component
})

defineExpose({ open, close: ctx.close })
</script>
