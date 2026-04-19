<template>
  <PrimitivePhotoImage v-bind="props" />
</template>

<script setup lang="ts">
import type { ImageAdapter, ImageContext, PhotoItem } from '@nuxt-photo/core'
import { PhotoImage as PrimitivePhotoImage } from '@nuxt-photo/vue'

const props = defineProps<{
  photo: PhotoItem
  context?: ImageContext
  imageAdapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>()
</script>
