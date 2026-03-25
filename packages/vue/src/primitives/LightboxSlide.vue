<template>
  <div v-bind="$attrs">
    <div :style="ctx.getSlideEffectStyle(index)">
      <div :style="ctx.getSlideFrameStyle(photo)">
        <div :ref="ctx.setSlideZoomRef(index)">
          <slot :photo="photo" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { LightboxContextKey } from '../provide/keys'

defineProps<{
  photo: PhotoItem
  index: number
}>()

const ctx = inject(LightboxContextKey)!
</script>
