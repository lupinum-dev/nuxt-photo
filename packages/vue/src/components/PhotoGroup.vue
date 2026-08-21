<template>
  <slot :photos="canonicalPhotos" :controller="controller" />
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, provide, shallowRef, watch, type Component } from 'vue'
import { provideLightbox } from '../composables/index'
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
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { devWarn } from '../core/env'

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
    /** Reactive lightbox capability. */
    lightbox?: boolean | Component
    /** Reactive transition configuration. */
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
const lightboxComponent = computed(() =>
  resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, true),
)
const enabled = computed(() => lightboxComponent.value !== null)
const provider = provideLightbox(canonicalPhotos, {
  transition: () => props.transition,
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

watch(enabled, (isEnabled) => {
  if (!isEnabled && provider.isOpen.value) {
    void provider.close()
  }
})

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

let warnedDisabled = false

function warnDisabledInteraction(method: string) {
  if (warnedDisabled || !import.meta.env.DEV) return
  warnedDisabled = true
  devWarn(
    `PhotoGroup.${method}() was ignored because its lightbox is disabled. Enable the \`lightbox\` prop to control it.`,
  )
}

async function open(index = 0) {
  if (!enabled.value) {
    warnDisabledInteraction('open')
    return
  }
  if (index < 0 || index >= canonicalPhotos.value.length) {
    throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  }
  syncThumbnailRefs()
  await provider.open(index)
}

async function activateById(id: string, source: HTMLElement | null) {
  if (!enabled.value) {
    warnDisabledInteraction('openById')
    return
  }
  const index = canonicalPhotos.value.findIndex((photo) => photo.id === id)
  if (index < 0) {
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  }
  syncThumbnailRefs()
  provider.setThumbnailRef(index)(source)
  await provider.openById(id)
}

async function openById(id: string) {
  if (!enabled.value) {
    warnDisabledInteraction('openById')
    return
  }
  syncThumbnailRefs()
  await provider.openById(id)
}

async function close() {
  await provider.close()
}

const isOpen = computed(() => enabled.value && provider.isOpen.value)
const controller: LightboxProviderController<TMeta> = {
  ...provider,
  open,
  openById,
  close,
  isOpen,
}

const hiddenPhoto = computed<PhotoItem<TMeta> | null>(() => {
  if (!enabled.value) return null
  const index = provider.hiddenThumbnailIndex.value
  return index === null ? null : (canonicalPhotos.value[index] ?? null)
})

const groupContext: PhotoGroupContext = {
  enabled,
  hasPhoto,
  replaceCapabilities,
  removeCapabilities,
  open,
  openById,
  activateById,
  close,
  isOpen,
  photos: canonicalPhotos,
  hiddenPhoto,
}
provide(PhotoGroupContextKey, groupContext)

defineExpose({ open, openById, close, isOpen })
</script>
