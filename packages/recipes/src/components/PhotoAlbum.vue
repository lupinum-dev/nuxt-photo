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
        :style="[itemStyle(entry, group), hasLightbox ? { cursor: 'pointer' } : {}]"
        :ref="setItemRef(entry.index)"
        @click="hasLightbox ? openPhoto(entry.photo, entry.index) : undefined"
      >
        <div
          :style="isHidden(entry.photo) ? { opacity: 0 } : undefined"
          style="width:100%;height:100%"
        >
          <slot v-if="$slots.thumbnail" name="thumbnail" :photo="entry.photo" :index="entry.index" :width="entry.width" :height="entry.height" />
          <PhotoImage
            v-else
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
        </div>
      </div>
    </div>
  </div>

  <!-- Own lightbox — only rendered when not inside a parent PhotoGroup -->
  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onBeforeUnmount, type CSSProperties, type Component, type ComponentPublicInstance } from 'vue'
import { PhotoImage } from '@nuxt-photo/vue'
import { PhotoGroupContextKey, provideLightboxContexts, useLightboxContext } from '@nuxt-photo/vue/internal'
import {
  computeRowsLayout,
  computeColumnsLayout,
  computeMasonryLayout,
  computeBentoLayout,
  type PhotoItem,
  type ImageAdapter,
  type LayoutGroup,
  type BentoSizing,
} from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

function round(value: number, digits = 0) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  columns?: number
  /** Gap between images in pixels @default 8 */
  spacing?: number
  /** Outer padding around each image in pixels @default 0 */
  padding?: number
  /** Target row height in pixels (rows layout only) @default 300 */
  targetRowHeight?: number
  /** Row height in pixels (bento layout only) @default 280 */
  bentoRowHeight?: number
  bentoSizing?: BentoSizing
  bentoPatternInterval?: number
  adapter?: ImageAdapter
  /** Whether to enable lightbox. @default true */
  lightbox?: boolean | Component
}>(), {
  layout: 'rows',
  columns: 3,
  spacing: 8,
  padding: 0,
  targetRowHeight: 300,
  bentoRowHeight: 280,
  bentoSizing: 'auto',
  bentoPatternInterval: 5,
  lightbox: true,
})

// Check for parent PhotoGroup
const parentGroup = inject(PhotoGroupContextKey, null)
const hasLightbox = computed(() => props.lightbox !== false)
const hasOwnLightbox = !parentGroup && props.lightbox !== false
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return InternalLightbox
  return props.lightbox as Component
})

// For standalone mode: create own lightbox context
const ownCtx = !parentGroup ? useLightboxContext(computed(() => props.photos)) : null

if (ownCtx) {
  provideLightboxContexts(ownCtx)
}

// Track thumb DOM elements by photo index
const thumbElsMap: Record<number, HTMLElement | null> = {}

function setItemRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    thumbElsMap[index] = el as HTMLElement | null
  }
}

// Open handler
function openPhoto(photo: PhotoItem, index: number) {
  if (parentGroup) {
    parentGroup.open(photo)
  } else if (ownCtx) {
    // Wire current thumb refs before opening
    for (const [i, el] of Object.entries(thumbElsMap)) {
      ownCtx.setThumbRef(Number(i))(el)
    }
    ownCtx.open(index)
  }
}

// Is this photo's thumb hidden during transition?
function isHidden(photo: PhotoItem): boolean {
  if (parentGroup) return parentGroup.hiddenPhoto.value === photo
  if (ownCtx) {
    const idx = ownCtx.hiddenThumbIndex.value
    if (idx === null) return false
    return props.photos[idx] === photo
  }
  return false
}

// Registration with parent group
let registrationIds: symbol[] = []

if (parentGroup) {
  function refreshGroupRegistrations(photos: PhotoItem[]) {
    for (const id of registrationIds) {
      parentGroup.unregister(id)
    }

    registrationIds = photos.map((photo, index) => {
      const id = Symbol()
      parentGroup.register(id, photo, () => thumbElsMap[index] ?? null, null)
      return id
    })
  }

  watch(() => props.photos.slice(), (photos) => {
    refreshGroupRegistrations(photos)
  }, { immediate: true })

  onBeforeUnmount(() => {
    for (const id of registrationIds) {
      parentGroup.unregister(id)
    }
    registrationIds = []
  })
}

// Layout
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return

  containerWidth.value = containerRef.value.getBoundingClientRect().width

  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width
    if (width && width > 0) containerWidth.value = width
  })
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const groups = computed<LayoutGroup[]>(() => {
  if (containerWidth.value <= 0) return []

  const input = {
    photos: props.photos,
    containerWidth: containerWidth.value,
    spacing: props.spacing,
    padding: props.padding,
  }

  switch (props.layout) {
    case 'rows': {
      const result = computeRowsLayout({ ...input, targetRowHeight: props.targetRowHeight })
      if (result.length === 0 && props.photos.length > 0) {
        console.warn('[nuxt-photo] rows layout produced no groups — containerWidth may be too small for targetRowHeight')
      }
      return result
    }
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
      padding: `${props.padding}px`,
    }
  }

  if (group.type === 'row') {
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
