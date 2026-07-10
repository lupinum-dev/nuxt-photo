<template>
  <slot :photos="collectedPhotos" :controller="controller" />
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { computed, inject, provide, shallowReactive, type Component } from 'vue'
import { useLightboxProvider } from '../composables/index'
import {
  LightboxComponentKey,
  type LightboxProviderController,
  type LightboxSlideRenderer,
} from '../provide/keys'
import {
  normalizePhotos,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../core/index'
import Lightbox from './Lightbox.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupContext,
} from '../context/photoGroup'
import { warnOnSetupOptionChanges } from './shared/staticOptionWarnings'

const props = withDefaults(
  defineProps<{
    imageAdapter?: ImageAdapter
    /** Setup-time lightbox capability. Remount to change it. */
    lightbox?: boolean | Component
    /** Setup-time transition configuration. Remount to change it. */
    transition?: LightboxTransitionOption
  }>(),
  { lightbox: true },
)

type Registration = {
  photo: PhotoItem
  getThumbnailElement: () => HTMLElement | null
  renderSlide?: LightboxSlideRenderer | null
}

const registrations = shallowReactive(new Map<symbol, Registration>())
const collectedPhotos = computed<PhotoItem[]>(() => {
  const photos = [...registrations.values()].map((entry) => entry.photo)
  return normalizePhotos(photos, {
    owner: 'PhotoGroup',
    onInvalid: 'throw',
  }).photos
})

const injectedLightbox = inject(LightboxComponentKey, null)
const enabled = props.lightbox !== false
warnOnSetupOptionChanges('PhotoGroup', {
  lightbox: () => props.lightbox,
  transition: () => props.transition,
  imageAdapter: () => props.imageAdapter,
})
const provider = enabled
  ? useLightboxProvider(collectedPhotos, {
      transition: props.transition,
      imageAdapter: props.imageAdapter,
      resolveSlide: (photo) => {
        for (const entry of registrations.values()) {
          if (entry.photo.id === photo.id) return entry.renderSlide ?? null
        }
        return null
      },
    })
  : null

function register(
  id: symbol,
  photo: PhotoItem,
  getThumbnailElement: () => HTMLElement | null,
  renderSlide?: LightboxSlideRenderer | null,
) {
  registrations.set(id, { photo, getThumbnailElement, renderSlide })
  // Force aggregate validation at the registration boundary.
  void collectedPhotos.value
}

function unregister(id: symbol) {
  registrations.delete(id)
}

function syncThumbnailRefs() {
  if (!provider) return
  ;[...registrations.values()].forEach((entry, index) => {
    provider.setThumbnailRef(index)(entry.getThumbnailElement())
  })
}

async function open(index = 0) {
  if (!provider) return
  syncThumbnailRefs()
  await provider.open(index)
}

async function openById(id: string) {
  if (!provider) return
  syncThumbnailRefs()
  await provider.openById(id)
}

async function close() {
  await provider?.close()
}

const disabledController: LightboxProviderController = {
  photos: computed(() => collectedPhotos.value),
  count: computed(() => collectedPhotos.value.length),
  activeIndex: computed(() => 0),
  activePhoto: computed(() => null),
  isOpen: computed(() => false),
  open,
  openById,
  close,
  next() {},
  prev() {},
  toggleZoom() {},
  hiddenThumbnailIndex: computed(() => null),
  setThumbnailRef: () => () => {},
}

const controller: LightboxProviderController = provider
  ? { ...provider, open, openById }
  : disabledController

const hiddenPhoto = computed<PhotoItem | null>(() => {
  if (!provider) return null
  const index = provider.hiddenThumbnailIndex.value
  return index === null ? null : (collectedPhotos.value[index] ?? null)
})

const groupContext: PhotoGroupContext = {
  enabled,
  register,
  unregister,
  open,
  openById,
  photos: collectedPhotos,
  hiddenPhoto,
}
provide(PhotoGroupContextKey, groupContext)

const lightboxComponent: Component | null = !enabled
  ? null
  : props.lightbox === true
    ? (injectedLightbox ?? Lightbox)
    : props.lightbox

defineExpose({ open, openById, close })
</script>
