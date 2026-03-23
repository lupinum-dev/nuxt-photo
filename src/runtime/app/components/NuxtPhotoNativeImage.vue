<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

let warned = false

const attrs = useAttrs()

const imageAttrs = computed(() => {
  const {
    densities: _densities,
    modifiers: _modifiers,
    placeholder: _placeholder,
    preset: _preset,
    provider: _provider,
    srcSet: _srcSet,
    ...rest
  } = attrs

  if (import.meta.dev && !warned) {
    warned = true
    console.warn('[nuxt-photo] `@nuxt/image` is not installed. Falling back to plain <img>.')
  }

  return rest
})
</script>

<template>
  <img
    v-bind="imageAttrs"
    data-slot="photo-image"
  >
</template>
