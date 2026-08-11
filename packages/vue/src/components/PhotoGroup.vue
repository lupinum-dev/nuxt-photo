<template>
  <slot :photos="canonicalPhotos" :controller="controller" />
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, provide, shallowRef, type Component } from 'vue'
import { useLightboxProvider } from '../composables/index'
import { LightboxComponentKey, type LightboxProviderController } from '../provide/keys'
import {
  normalizePhotos,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../core/index'
import Lightbox from './Lightbox.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupCapability,
  type PhotoGroupContext,
} from './photo-group/context'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'

defineOptions({ inheritAttrs: false })

defineSlots<{
  default?: (props: {
    photos: readonly PhotoItem<TMeta>[]
    controller: LightboxProviderController<TMeta>
  }) => unknown
}>()

const props = withDefaults(
  defineProps<{
    /** Canonical photo collection and navigation order. */
    photos: readonly PhotoItem<TMeta>[]
    imageAdapter?: ImageAdapter<TMeta>
    /** Setup-time lightbox capability. Remount to change it. */
    lightbox?: boolean | Component
    /** Setup-time transition configuration. Remount to change it. */
    transition?: LightboxTransitionOption
  }>(),
  { lightbox: true },
)

const canonicalPhotos = computed<readonly PhotoItem<TMeta>[]>(
  () =>
    normalizePhotos<TMeta>(props.photos, {
      owner: 'PhotoGroup',
      onInvalid: 'throw',
    }).photos,
)
const capabilityBatches = shallowRef(new Map<symbol, readonly PhotoGroupCapability[]>())
const capabilities = computed(() => [...capabilityBatches.value.values()].flat())

function hasPhoto(id: string) {
  return canonicalPhotos.value.some((photo) => photo.id === id)
}

const injectedLightbox = inject(LightboxComponentKey, null)
const lightboxComponent = resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, true)
const enabled = lightboxComponent !== null
warnOnSetupOptionChanges('PhotoGroup', {
  lightbox: () => props.lightbox,
  transition: () => props.transition,
})
const provider = enabled
  ? useLightboxProvider(canonicalPhotos, {
      transition: props.transition,
      imageAdapter: computed(() => props.imageAdapter),
      resolveSlide: (photo) => {
        for (const entry of capabilities.value) {
          if (entry.id === photo.id && entry.renderSlide) {
            return entry.renderSlide
          }
        }
        return null
      },
    })
  : null

function validateCapabilityIds(batches: ReadonlyMap<symbol, readonly PhotoGroupCapability[]>) {
  const canonicalIds = new Set(canonicalPhotos.value.map((photo) => photo.id))
  for (const batch of batches.values()) {
    for (const entry of batch) {
      if (!canonicalIds.has(entry.id)) {
        throw new Error(
          `[nuxt-photo] PhotoGroup descendant photo "${entry.id}" is missing from the canonical photos collection`,
        )
      }
    }
  }
}

function replaceCapabilities(owner: symbol, entries: readonly PhotoGroupCapability[]) {
  const next = new Map(capabilityBatches.value)
  if (entries.length === 0) next.delete(owner)
  else next.set(owner, [...entries])

  validateCapabilityIds(next)

  const rendererOwner = new Map<string, symbol>()
  for (const [batchOwner, batch] of next) {
    for (const entry of batch) {
      if (!entry.renderSlide) continue
      const existingOwner = rendererOwner.get(entry.id)
      if (existingOwner && existingOwner !== batchOwner) {
        throw new Error(
          `[nuxt-photo] Multiple custom slide renderers registered for photo "${entry.id}"`,
        )
      }
      rendererOwner.set(entry.id, batchOwner)
    }
  }

  capabilityBatches.value = next
}

function removeCapabilities(owner: symbol) {
  if (!capabilityBatches.value.has(owner)) return
  const next = new Map(capabilityBatches.value)
  next.delete(owner)
  capabilityBatches.value = next
}

function syncThumbnailRefs() {
  if (!provider) return
  canonicalPhotos.value.forEach((photo, index) => {
    let element: HTMLElement | null = null
    for (const candidate of capabilities.value) {
      if (candidate.id !== photo.id) continue
      const current = candidate.getThumbnailElement()
      if (!current?.isConnected) continue
      element = current
      break
    }
    provider.setThumbnailRef(index)(element)
  })
}

async function open(index = 0) {
  if (index < 0 || index >= canonicalPhotos.value.length) {
    throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  }
  if (!provider) return
  syncThumbnailRefs()
  await provider.open(index)
}

async function activateById(id: string, source?: HTMLElement | null) {
  const index = canonicalPhotos.value.findIndex((photo) => photo.id === id)
  if (index < 0) {
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  }
  if (!provider) return
  syncThumbnailRefs()
  if (source) provider.setThumbnailRef(index)(source)
  await provider.openById(id)
}

async function openById(id: string) {
  await activateById(id)
}

async function close() {
  await provider?.close()
}

const disabledController: LightboxProviderController<TMeta> = {
  photos: computed(() => canonicalPhotos.value),
  count: computed(() => canonicalPhotos.value.length),
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

const controller: LightboxProviderController<TMeta> = provider
  ? { ...provider, open, openById }
  : disabledController

const hiddenPhoto = computed<PhotoItem<TMeta> | null>(() => {
  if (!provider) return null
  const index = provider.hiddenThumbnailIndex.value
  return index === null ? null : (canonicalPhotos.value[index] ?? null)
})

const groupContext: PhotoGroupContext = {
  enabled,
  hasPhoto,
  replaceCapabilities,
  removeCapabilities,
  open,
  activateById,
  photos: canonicalPhotos,
  hiddenPhoto,
}
provide(PhotoGroupContextKey, groupContext)

defineExpose({ open, openById, close })
</script>
