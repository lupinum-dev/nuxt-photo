<template>
  <ViewerHost :bridge="bridge" />
</template>

<script setup lang="ts">
import '../styles/lightbox-structure.css'
import ViewerHost from './ViewerHost.vue'
import type { ViewerBridge } from '../gallery/viewer'

// The viewer with the lightbox structure CSS: it loads with this chunk, and server
// rendering includes it when the page opens with a photo.
defineProps<{ bridge: ViewerBridge }>()
</script>
