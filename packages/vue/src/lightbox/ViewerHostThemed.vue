<template>
  <ViewerHost :bridge="bridge" />
</template>

<script setup lang="ts">
import ViewerHost from './ViewerHost.vue'
import type { ViewerBridge } from '../gallery/viewer'

// The viewer with the lightbox structure and theme CSS (Nuxt `css: 'all'`).
defineProps<{ bridge: ViewerBridge }>()
</script>

<style src="../styles/lightbox-structure.css"></style>
<style src="../styles/lightbox-theme.css"></style>
