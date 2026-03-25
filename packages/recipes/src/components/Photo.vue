<template>
  <figure class="np-photo" v-bind="$attrs">
    <PhotoImage
      :photo="photo"
      :context="lightbox ? 'thumb' : 'slide'"
      :adapter="adapter"
      :loading="loading"
      class="np-photo__img"
    />
    <figcaption v-if="photo.caption" class="np-photo__caption">
      {{ photo.caption }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { PhotoImage } from '@nuxt-photo/vue'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'

withDefaults(defineProps<{
  photo: PhotoItem
  lightbox?: boolean
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>(), {
  lightbox: false,
  loading: 'lazy',
})
</script>
