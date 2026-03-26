<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="$attrs"
    :style="{ margin: 0, opacity: ctx.hiddenThumbIndex.value === 0 ? 0 : 1, cursor: 'pointer' }"
    role="button"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
    @keydown.space.prevent="open"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
  <component :is="lightboxComponent" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useSlots, type Component } from 'vue'

defineOptions({ inheritAttrs: false })
import { PhotoImage } from '@nuxt-photo/vue'
import { provideLightboxContexts, useLightboxContext } from '@nuxt-photo/vue/internal'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

const props = defineProps<{
  photo: PhotoItem
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
  lightboxComponent?: Component
}>()

const thumbRef = ref<HTMLElement | null>(null)
const slots = useSlots()
const ctx = useLightboxContext(props.photo)
const lightboxComponent = computed(() => props.lightboxComponent ?? InternalLightbox)

provideLightboxContexts(ctx, {
  resolveSlide: photo => {
    if ((photo !== props.photo && photo.id !== props.photo.id) || !slots.slide) return null
    return slotProps => slots.slide?.(slotProps) ?? null
  },
})

onMounted(() => {
  ctx.setThumbRef(0)(thumbRef.value)
})

async function open() {
  ctx.setThumbRef(0)(thumbRef.value)
  await ctx.open(0)
}
</script>
