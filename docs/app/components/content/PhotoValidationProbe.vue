<script setup lang="ts">
import type { PhotoItem } from '@lupinum/nuxt-photo/app'
import { onErrorCaptured } from 'vue'

defineProps<{ photos: readonly PhotoItem[] }>()
const emit = defineEmits<{ error: [error: Error] }>()

onErrorCaptured((error) => {
  emit('error', error as Error)
  return false
})
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" :lightbox="false" />
</template>
