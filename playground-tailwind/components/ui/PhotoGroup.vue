<template>
  <RecipePhotoGroup ref="innerGroup" :photos="photos" v-bind="$attrs">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </RecipePhotoGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { PhotoGroup as RecipePhotoGroup } from '@nuxt-photo/recipes'

defineProps<{
  photos?: PhotoItem[]
}>()

const innerGroup = ref<{ open: (photoOrIndex: PhotoItem | number) => void; close: () => void } | null>(null)

defineExpose({
  open: (photoOrIndex: PhotoItem | number) => innerGroup.value?.open(photoOrIndex),
  close: () => innerGroup.value?.close(),
})
</script>
