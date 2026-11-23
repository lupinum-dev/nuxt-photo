<template>
  <ViewerHost :bridge="bridge" />
</template>

<script setup lang="ts">
import '../styles/lightbox-structure.css'
import '../styles/lightbox-theme.css'
import ViewerHost from './ViewerHost.vue'
import type { ViewerBridge } from '../gallery/viewer'

// The viewer with the lightbox structure and theme CSS (Nuxt `css: 'all'`).
defineProps<{ bridge: ViewerBridge }>()
</script>
