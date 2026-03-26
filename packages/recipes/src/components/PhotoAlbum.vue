<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="`np-album--${props.layout}`"
    :style="containerStyle"
  >
    <div
      v-for="group in groups"
      :key="`${group.type}-${group.index}`"
      :class="group.type === 'grid' ? 'np-album__grid' : group.type === 'row' ? 'np-album__row' : 'np-album__column'"
      :style="groupStyle(group)"
    >
      <div
        v-for="entry in group.entries"
        :key="entry.photo.id"
        class="np-album__item"
        :style="itemStyle(entry, group)"
      >
        <slot name="item" :photo="entry.photo" :index="entry.index" :width="entry.width" :height="entry.height">
          <PhotoImage
            :photo="entry.photo"
            context="thumb"
            :adapter="adapter"
            loading="lazy"
            class="np-album__img"
            :style="group.type === 'grid'
              ? { display: 'block', width: '100%', height: '100%', objectFit: 'cover' }
              : { display: 'block', width: '100%', height: 'auto', aspectRatio: `${entry.photo.width} / ${entry.photo.height}` }
            "
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type CSSProperties } from 'vue'
import { PhotoImage } from '@nuxt-photo/vue'
import {
  computeRowsLayout,
  computeColumnsLayout,
  computeMasonryLayout,
  computeBentoLayout,
  type PhotoItem,
  type ImageAdapter,
  type LayoutGroup,
  type LayoutEntry,
  type BentoSizing,
} from '@nuxt-photo/core'

function round(value: number, digits = 0) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  columns?: number
  spacing?: number
  padding?: number
  targetRowHeight?: number
  bentoRowHeight?: number
  bentoSizing?: BentoSizing
  bentoPatternInterval?: number
  adapter?: ImageAdapter
}>(), {
  layout: 'rows',
  columns: 3,
  spacing: 8,
  padding: 0,
  targetRowHeight: 300,
  bentoRowHeight: 240,
  bentoSizing: 'auto',
  bentoPatternInterval: 5,
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
      initialWidth = width
      return
    }

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

const groups = computed<LayoutGroup[]>(() => {
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
    case 'bento':
      return computeBentoLayout({ ...input, columns: props.columns, rowHeight: props.bentoRowHeight, sizing: props.bentoSizing, patternInterval: props.bentoPatternInterval })
  }
})

const containerStyle = computed<CSSProperties>(() => {
  if (props.layout === 'bento') {
    return { width: '100%' }
  }
  return {
    display: 'flex',
    flexDirection: props.layout === 'rows' ? 'column' : 'row',
    flexWrap: 'nowrap',
    justifyContent: props.layout === 'rows' ? undefined : 'space-between',
    width: '100%',
  }
})

function groupStyle(group: LayoutGroup): CSSProperties {
  if (group.type === 'grid') {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
      gridAutoRows: `${props.bentoRowHeight}px`,
      gridAutoFlow: 'dense',
      gap: `${props.spacing}px`,
    }
  }

  if (group.type === 'row') {
    return {
      alignItems: 'flex-start',
      display: 'flex',
      flexFlow: 'row nowrap',
      justifyContent: 'space-between',
      marginBottom: group.index < groups.value.length - 1 ? `${props.spacing}px` : undefined,
    }
  }

  const columnsCount = groups.value.length || 1

  // Masonry: equal-width columns
  if (
    props.layout === 'masonry'
    || group.columnsGaps === undefined
    || group.columnsRatios === undefined
  ) {
    return {
      alignItems: 'flex-start',
      display: 'flex',
      flexFlow: 'column nowrap',
      justifyContent: props.layout === 'columns' ? 'space-between' : 'flex-start',
      marginLeft: group.index > 0 ? `${props.spacing}px` : undefined,
      width: `calc((100% - ${props.spacing * (columnsCount - 1)}px) / ${columnsCount})`,
    }
  }

  // Balanced columns: proportional widths via CSS calc
  const totalRatio = group.columnsRatios.reduce((acc, v) => acc + v, 0)
  const totalAdjustedGaps = group.columnsRatios.reduce(
    (acc, v, ratioIndex) =>
      acc + ((group.columnsGaps![group.index] ?? 0) - (group.columnsGaps![ratioIndex] ?? 0)) * v,
    0,
  )

  return {
    alignItems: 'flex-start',
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'space-between',
    marginLeft: group.index > 0 ? `${props.spacing}px` : undefined,
    width: `calc((100% - ${round(
      (columnsCount - 1) * props.spacing
      + 2 * columnsCount * props.padding
      + totalAdjustedGaps,
      3,
    )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
      2 * props.padding
    }px)`,
  }
}

function itemStyle(entry: LayoutEntry, group: LayoutGroup): CSSProperties {
  if (group.type === 'grid') {
    return {
      gridColumn: (entry.colSpan ?? 1) > 1 ? `span ${entry.colSpan}` : undefined,
      gridRow: (entry.rowSpan ?? 1) > 1 ? `span ${entry.rowSpan}` : undefined,
      overflow: 'hidden',
      borderRadius: '4px',
      padding: `${props.padding}px`,
    }
  }

  if (group.type === 'row') {
    // Row items: width proportional to their share of the row
    const gaps = props.spacing * (entry.itemsCount - 1) + 2 * props.padding * entry.itemsCount
    return {
      boxSizing: 'content-box',
      display: 'block',
      height: 'auto',
      padding: `${props.padding}px`,
      width: `calc((100% - ${gaps}px) / ${round(
        (containerWidth.value - gaps) / entry.width,
        5,
      )})`,
    }
  }

  // Column/masonry items: full width of column
  const isLast = entry.positionIndex === entry.itemsCount - 1
  return {
    boxSizing: 'content-box',
    display: 'block',
    height: 'auto',
    padding: `${props.padding}px`,
    marginBottom: !isLast ? `${props.spacing}px` : undefined,
    width: `calc(100% - ${2 * props.padding}px)`,
  }
}
</script>
