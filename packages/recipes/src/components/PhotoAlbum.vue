<template>
  <div
    ref="containerRef"
    class="np-album"
    :style="{
      position: 'relative',
      width: '100%',
      aspectRatio: `${containerWidth || 1} / ${layoutResult.containerHeight || 1}`,
    }"
  >
    <div
      v-for="item in layoutResult.items"
      :key="item.photo.id"
      class="np-album__item"
      :style="{
        position: 'absolute',
        left: `${(item.left / (containerWidth || 1)) * 100}%`,
        top: `${(item.top / (layoutResult.containerHeight || 1)) * 100}%`,
        width: `${(item.width / (containerWidth || 1)) * 100}%`,
        height: `${(item.height / (layoutResult.containerHeight || 1)) * 100}%`,
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
  if (!containerRef.value) return

  let initialWidth = 0

  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width
    if (!width || width <= 0) return

    if (initialWidth === 0) {
      // First measurement after mount — record but don't recompute.
      // The SSR percentage layout is already visually correct at any width.
      initialWidth = width
      return
    }

    // Genuine resize — recompute layout
    if (Math.abs(width - initialWidth) > 1) {
      initialWidth = width
      containerWidth.value = width
    }
  })
  resizeObserver.observe(containerRef.value)
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
