<template>
  <div ref="containerRef" class="np-album" :style="{ position: 'relative', height: `${layoutResult.containerHeight}px` }">
    <div
      v-for="item in layoutResult.items"
      :key="item.photo.id"
      class="np-album__item"
      :style="{
        position: 'absolute',
        left: `${item.left}px`,
        top: `${item.top}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
      }"
    >
      <slot name="item" :photo="item.photo" :index="item.index" :width="item.width" :height="item.height">
        <PhotoImage
          :photo="item.photo"
          context="thumb"
          :adapter="adapter"
          loading="lazy"
          class="np-album__img"
          :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { PhotoImage } from '@nuxt-photo/vue'
import {
  computeRowsLayout,
  computeColumnsLayout,
  computeMasonryLayout,
  type PhotoItem,
  type ImageAdapter,
  type LayoutOutput,
} from '@nuxt-photo/core'

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry'
  columns?: number
  spacing?: number
  padding?: number
  targetRowHeight?: number
  adapter?: ImageAdapter
}>(), {
  layout: 'rows',
  columns: 3,
  spacing: 8,
  padding: 0,
  targetRowHeight: 300,
})

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const layoutResult = computed<LayoutOutput>(() => {
  const input = {
    photos: props.photos,
    containerWidth: containerWidth.value,
    spacing: props.spacing,
    padding: props.padding,
  }

  switch (props.layout) {
    case 'rows':
      return computeRowsLayout({ ...input, targetRowHeight: props.targetRowHeight })
    case 'columns':
      return computeColumnsLayout({ ...input, columns: props.columns })
    case 'masonry':
      return computeMasonryLayout({ ...input, columns: props.columns })
  }
})
</script>
