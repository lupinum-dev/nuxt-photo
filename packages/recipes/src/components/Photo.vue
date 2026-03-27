<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="{ ...$attrs, ...interactiveAttrs }"
    :style="figureStyle"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx" />
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, useSlots, type Component } from 'vue'

defineOptions({ inheritAttrs: false })
import { PhotoImage, useLightboxProvider } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
} from '@nuxt-photo/vue/extend'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

const props = defineProps<{
  photo: PhotoItem
  /** Opens a solo lightbox when this Photo is not inside a PhotoGroup */
  lightbox?: boolean | Component
  /** Opt this photo out of a parent PhotoGroup (renders as plain image) */
  lightboxIgnore?: boolean
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>()
const slots = useSlots()

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

// Standalone mode: lightbox prop set and no parent group
const isSolo = computed(() => !group && !!props.lightbox && !props.lightboxIgnore)

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? useLightboxProvider(computed(() => props.photo), {
    resolveSlide: photo => {
      if ((photo !== props.photo && String(photo.id) !== String(props.photo.id)) || !slots.slide) return null
      return slotProps => slots.slide?.(slotProps) ?? null
    },
  })
  : null

const soloLightboxComponent = computed<Component>(() => {
  if (props.lightbox === true || props.lightbox === undefined) {
    return injectedLightbox ?? InternalLightbox
  }
  return (props.lightbox as Component) ?? InternalLightbox
})

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value === props.photo)

// Auto-group mode: inside a PhotoGroup with auto-collection
const isAutoGrouped = computed(() => !!group && !props.lightboxIgnore && group.mode === 'auto')
const isInteractive = computed(() => isSolo.value || isAutoGrouped.value)

const figureStyle = computed(() => {
  if (isSolo.value) {
    return { margin: 0, opacity: soloCtx && soloCtx.hiddenThumbIndex.value === 0 ? 0 : 1, cursor: 'pointer' }
  }
  if (isAutoGrouped.value) {
    return { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
  }
  return { margin: 0 }
})

function handleClick() {
  if (isSolo.value) soloOpen()
  else if (isAutoGrouped.value) group!.open(props.photo)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    if (e.key === ' ') e.preventDefault()
    handleClick()
  }
}

const interactiveAttrs = computed(() => {
  if (!isInteractive.value) return {}
  return { role: 'button' as const, tabindex: 0, onClick: handleClick, onKeydown: handleKeydown }
})

// Registration with parent group (auto mode only)
const id = Symbol()

onMounted(() => {
  if (soloCtx) {
    soloCtx.setThumbRef(0)(thumbRef.value)
  }
  if (group && group.mode === 'auto' && !props.lightboxIgnore && !isSolo.value) {
    group.register(
      id,
      props.photo,
      () => thumbRef.value,
      slots.slide ? slotProps => slots.slide?.(slotProps) ?? null : null,
    )
  }
})

onBeforeUnmount(() => {
  if (group && group.mode === 'auto' && !props.lightboxIgnore && !isSolo.value) {
    group.unregister(id)
  }
})

async function soloOpen() {
  if (!soloCtx) return
  soloCtx.setThumbRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
</script>
