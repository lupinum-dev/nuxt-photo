<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { usePhotoRuntimeConfig } from '../utils/lightbox'
import NuxtPhotoNativeImage from './NuxtPhotoNativeImage.vue'
import NuxtPhotoNuxtImage from './NuxtPhotoNuxtImage.vue'

defineOptions({
  inheritAttrs: false,
})

const runtimeConfig = usePhotoRuntimeConfig()
const attrs = useAttrs()

const resolvedComponent = computed(() =>
  runtimeConfig.value.hasNuxtImage
    ? NuxtPhotoNuxtImage
    : NuxtPhotoNativeImage,
)
</script>

<template>
  <component
    :is="resolvedComponent"
    v-bind="attrs"
  />
</template>
