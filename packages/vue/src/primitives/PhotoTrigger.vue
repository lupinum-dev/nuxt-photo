<template>
  <div
    :ref="ctx.setThumbRef(index)"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @click="ctx.open(index)"
    @keydown.enter="ctx.open(index)"
    @keydown.space.prevent="ctx.open(index)"
  >
    <slot :photo="photo" :index="index" :hidden="ctx.hiddenThumbIndex.value === index" />
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { LightboxTriggerKey } from '../provide/keys'

const props = defineProps<{
  photo: PhotoItem
  index: number
}>()

const ctx = inject(LightboxTriggerKey)!

const ariaLabel = computed(() => props.photo.alt || `View photo ${props.index + 1}`)
</script>
