<template>
  <!-- Standalone photo (no parent group): wraps in its own single-photo context -->
  <figure
    v-if="isSolo"
    ref="thumbRef"
    class="np-photo"
    v-bind="$attrs"
    :style="{ margin: 0, opacity: soloCtx && soloCtx.hiddenThumbIndex.value === 0 ? 0 : 1, cursor: 'pointer' }"
    role="button"
    tabindex="0"
    @click="soloOpen"
    @keydown.enter="soloOpen"
    @keydown.space.prevent="soloOpen"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx" />

  <!-- Photo inside a PhotoGroup (auto mode): clickable thumb that registers with the group -->
  <figure
    v-else-if="group && !lightboxIgnore && group.mode === 'auto'"
    ref="thumbRef"
    class="np-photo"
    v-bind="$attrs"
    :style="{ margin: 0, opacity: isHidden ? 0 : 1, cursor: 'pointer' }"
    role="button"
    tabindex="0"
    @click="group.open(photo)"
    @keydown.enter="group.open(photo)"
    @keydown.space.prevent="group.open(photo)"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>

  <!-- Plain image (explicit group mode, no group, no lightbox, or lightbox-ignore) -->
  <figure v-else class="np-photo" v-bind="$attrs" :style="{ margin: 0 }">
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, useSlots, type Component } from 'vue'

defineOptions({ inheritAttrs: false })
import { PhotoImage } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  provideLightboxContexts,
  useLightboxContext,
} from '@nuxt-photo/vue/internal'
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
const soloCtx = isSolo.value ? useLightboxContext(computed(() => props.photo)) : null

if (soloCtx) {
  provideLightboxContexts(soloCtx, {
    resolveSlide: photo => {
      if ((photo !== props.photo && String(photo.id) !== String(props.photo.id)) || !slots.slide) return null
      return slotProps => slots.slide?.(slotProps) ?? null
    },
  })
}

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
