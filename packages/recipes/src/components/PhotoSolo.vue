<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="$attrs"
    :style="{ opacity: ctx.hiddenThumbIndex.value === 0 ? 0 : 1, cursor: 'pointer' }"
    role="button"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
    @keydown.space.prevent="open"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" />
    <figcaption v-if="photo.caption" class="np-photo__caption">{{ photo.caption }}</figcaption>
  </figure>
  <Lightbox />
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import { useLightbox, LightboxContextKey, PhotoImage } from '@nuxt-photo/vue'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import Lightbox from './Lightbox.vue'

const props = defineProps<{
  photo: PhotoItem
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>()

const thumbRef = ref<HTMLElement | null>(null)
const ctx = useLightbox(computed(() => [props.photo]))

provide(LightboxContextKey, ctx)

onMounted(() => {
  ctx.setThumbRef(0)(thumbRef.value)
})

async function open() {
  ctx.setThumbRef(0)(thumbRef.value)
  await ctx.open(0)
}
</script>
