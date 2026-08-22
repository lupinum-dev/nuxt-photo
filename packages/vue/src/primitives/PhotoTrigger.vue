<template>
  <button
    type="button"
    class="np-trigger"
    :ref="ctx.setThumbRef(index)"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @click="ctx.open(index)"
  >
    <slot :photo="photo" :index="index" :hidden="ctx.hiddenThumbIndex.value === index" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoItem } from '../core/index'
import { useLightboxInject } from '../lightbox/inject'
import { usePhotoLabels } from '../composables/usePhotoLabels'

const props = defineProps<{
  photo: PhotoItem
  index: number
}>()

const ctx = useLightboxInject('PhotoTrigger')
const labels = usePhotoLabels()

const ariaLabel = computed(() => props.photo.alt || labels.viewPhoto(props.index + 1))
</script>
