<template>
  <component :is="bridge.component ?? Lightbox" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { provideLightbox } from '../composables/provideLightbox'
import Lightbox from '../components/Lightbox.vue'
import type { ViewerBridge } from '../gallery/viewer'

// The lazy half of a photo group: it runs the viewer engine on the group's photos and
// identity store, and tells the group once the lightbox can open photos.
const { bridge } = defineProps<{ bridge: ViewerBridge }>()

const viewer = provideLightbox(bridge.photos, undefined, {
  resolveSlide: bridge.resolveSlide,
  thumbnailFor: bridge.thumbnailFor,
  gallery: bridge.gallery,
})
onMounted(() => bridge.attach(viewer))
onBeforeUnmount(() => bridge.attach(null))
</script>
