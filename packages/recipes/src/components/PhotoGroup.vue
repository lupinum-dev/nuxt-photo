<template>
  <slot :open="open" :setThumbRef="ctx.setThumbRef" />
  <component :is="LightboxComponent" v-if="LightboxComponent" />
</template>

<script setup lang="ts">
import { ref, computed, provide, type Component, type ComponentPublicInstance } from 'vue'
import { provideLightboxContexts, PhotoGroupContextKey, type LightboxSlideRenderer, type PhotoGroupContext, useLightboxContext } from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'
import DefaultLightbox from './Lightbox.vue'

const props = withDefaults(defineProps<{
  /** Explicit photos list (for headless/programmatic use). If omitted, photos auto-collect from child Photo components. */
  photos?: PhotoItem[]
  /** Lightbox to render: true = default, false = none, Component = custom */
  lightbox?: boolean | Component
}>(), {
  lightbox: true,
})

// Registration storage: ordered insertion via array + map
type Registration = {
  photo: PhotoItem
  getThumbEl: () => HTMLElement | null
  renderSlide?: LightboxSlideRenderer | null
}

const registrationOrder: symbol[] = []
const registrationMap = new Map<symbol, Registration>()
const registrationVersion = ref(0)

function register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null) {
  if (!registrationMap.has(id)) {
    registrationOrder.push(id)
  }
  registrationMap.set(id, { photo, getThumbEl, renderSlide })
  registrationVersion.value++
}

function unregister(id: symbol) {
  const idx = registrationOrder.indexOf(id)
  if (idx !== -1) registrationOrder.splice(idx, 1)
  registrationMap.delete(id)
  registrationVersion.value++
}

// Collected photos (reactive) — either from :photos prop or auto-registered children
const collectedPhotos = computed<PhotoItem[]>(() => {
  void registrationVersion.value // reactive dependency
  if (props.photos) return props.photos
  return registrationOrder.map(id => registrationMap.get(id)!.photo)
})

// Full internal lightbox context
const ctx = useLightboxContext(collectedPhotos)

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
    index = photos.findIndex(p => p === photoOrIndex || p.id === photoOrIndex.id)
    if (index === -1) index = 0
  }

  // Wire current thumb elements from registrations
  if (!props.photos) {
    registrationOrder.forEach((id, i) => {
      const reg = registrationMap.get(id)!
      ctx.setThumbRef(i)(reg.getThumbEl())
    })
  }

  await ctx.open(index)
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  register,
  unregister,
  open,
  photos: collectedPhotos,
  hiddenPhoto,
}

provide(PhotoGroupContextKey, groupContext)
provideLightboxContexts(ctx, {
  resolveSlide: photo => {
    const registration = registrationOrder
      .map(id => registrationMap.get(id))
      .find(entry => entry?.photo === photo || entry?.photo.id === photo.id)

    return registration?.renderSlide ?? null
  },
})

// Which lightbox component to render
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return DefaultLightbox
  return props.lightbox as Component
})

defineExpose({ open, close: ctx.close })
</script>
