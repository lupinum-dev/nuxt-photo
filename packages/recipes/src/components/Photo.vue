<template>
  <!-- Standalone photo with its own lightbox -->
  <PhotoSolo
    v-if="isSolo"
    :photo="photo"
    :adapter="adapter"
    :loading="loading"
    :lightbox-component="lightboxComponent"
    v-bind="$attrs"
  />

  <!-- Photo inside a PhotoGroup: clickable thumb that registers with the group -->
  <figure
    v-else-if="group && !lightboxIgnore"
    ref="thumbRef"
    class="np-photo"
    v-bind="$attrs"
    :style="{ opacity: isHidden ? 0 : 1, cursor: 'pointer' }"
    role="button"
    tabindex="0"
    @click="group.open(photo)"
    @keydown.enter="group.open(photo)"
    @keydown.space.prevent="group.open(photo)"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>

  <!-- Plain image (no group, no lightbox, or lightbox-ignore) -->
  <figure v-else class="np-photo" v-bind="$attrs">
    <PhotoImage :photo="photo" context="slide" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, useSlots, type Component } from 'vue'
import { PhotoImage, PhotoGroupContextKey } from '@nuxt-photo/vue'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import PhotoSolo from './PhotoSolo.vue'

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

// Standalone mode: lightbox prop set and no parent group
const isSolo = computed(() => !group && !!props.lightbox && !props.lightboxIgnore)
const lightboxComponent = computed<Component | undefined>(() =>
  props.lightbox === true || props.lightbox === undefined ? undefined : props.lightbox,
)

// Ref for the thumb element (used when inside a group)
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value === props.photo)

// Registration with parent group
const id = Symbol()

onMounted(() => {
  if (group && !props.lightboxIgnore && !isSolo.value) {
    group.register(
      id,
      props.photo,
      () => thumbRef.value,
      slots.slide ? slotProps => slots.slide?.(slotProps) ?? null : null,
    )
  }
})

onBeforeUnmount(() => {
  if (group && !props.lightboxIgnore && !isSolo.value) {
    group.unregister(id)
  }
})
</script>
