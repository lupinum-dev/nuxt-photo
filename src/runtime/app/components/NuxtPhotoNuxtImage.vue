<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const imageAttrs = computed(() => {
  const {
    srcSet: _srcSet,
    srcset: _srcset,
    ...rest
  } = attrs

  return rest
})
</script>

<template>
  <NuxtImg
    v-bind="imageAttrs"
    data-slot="photo-image"
  />
</template>
