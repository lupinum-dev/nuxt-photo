<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="`np-album--${props.layout}`"
    :style="containerStyle"
  >
    <!-- Skeleton shown until ResizeObserver measures real width -->
    <template v-if="!layoutReady">
      <div class="np-album__skeleton" />
    </template>

    <template v-else>
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
          v-bind="hasLightbox ? {
            ref: setItemRef(entry.index),
            role: 'button',
            tabindex: '0',
            onClick: () => openPhoto(entry.photo, entry.index),
            onKeydown: (e: KeyboardEvent) => handleItemKeydown(e, entry.photo, entry.index),
          } : { ref: setItemRef(entry.index) }"
        >
          <div
            :style="isHidden(entry.photo) && !$slots.thumbnail ? { opacity: 0 } : undefined"
            style="width:100%;height:100%"
          >
            <slot
              v-if="$slots.thumbnail"
              name="thumbnail"
              :photo="entry.photo"
              :index="entry.index"
              :width="entry.width"
              :height="entry.height"
              :hidden="isHidden(entry.photo)"
            />
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
    </template>
  </div>

  <!-- Own lightbox — only rendered when not inside a parent PhotoGroup -->
  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onBeforeUnmount, type CSSProperties, type Component, type ComponentPublicInstance } from 'vue'
import { PhotoImage } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  provideLightboxContexts,
  useLightboxContext,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/internal'
import {
  computeRowsLayout,
  computeColumnsLayout,
  computeMasonryLayout,
  computeBentoLayout,
  photoId,
  type PhotoItem,
  type ImageAdapter,
  type LayoutGroup,
  type LayoutEntry,
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
  /** Transition mode for lightbox open/close */
  transition?: LightboxTransitionOption
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

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

const hasLightbox = computed(() => props.lightbox !== false)
const hasOwnLightbox = !parentGroup && props.lightbox !== false
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? InternalLightbox
  return props.lightbox as Component
})

// For standalone mode: create own lightbox context
const ownCtx = !parentGroup ? useLightboxContext(computed(() => props.photos), props.transition) : null

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
    for (const [i, el] of Object.entries(thumbElsMap)) {
      ownCtx.setThumbRef(Number(i))(el)
    }
    ownCtx.open(index)
  }
}

function handleItemKeydown(e: KeyboardEvent, photo: PhotoItem, index: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openPhoto(photo, index)
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

// ─── Stable group registration (diff-based) ────────────────────────────────

const idToSymbol = new Map<string, symbol>() // normalized photo id → registration symbol
let registrationIds: symbol[] = []

if (parentGroup) {
  function syncRegistrations(photos: PhotoItem[]) {
    const newIds = new Set(photos.map(photoId))
    const oldIds = new Set(idToSymbol.keys())

    // Remove photos that are no longer present
    for (const pid of oldIds) {
      if (!newIds.has(pid)) {
        const sym = idToSymbol.get(pid)!
        parentGroup!.unregister(sym)
        idToSymbol.delete(pid)
      }
    }

    // Register new photos (preserve order in registrationIds for index mapping)
    registrationIds = photos.map((photo, index) => {
      const pid = photoId(photo)
      let sym = idToSymbol.get(pid)
      if (!sym) {
        sym = Symbol()
        idToSymbol.set(pid, sym)
        parentGroup!.register(sym, photo, () => thumbElsMap[index] ?? null, null)
      }
      return sym
    })
  }

  watch(() => props.photos.slice(), (photos) => {
    syncRegistrations(photos)
  }, { immediate: true })

  onBeforeUnmount(() => {
    for (const sym of registrationIds) {
      parentGroup.unregister(sym)
    }
    idToSymbol.clear()
    registrationIds = []
  })
}

// ─── Layout ──────────────────────────────────────────────────────────────────

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const layoutReady = ref(false)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return

  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width
    if (width && width > 0) {
      containerWidth.value = width
      layoutReady.value = true
    }
  })
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const groups = computed<LayoutGroup[]>(() => {
  if (!layoutReady.value || containerWidth.value <= 0) return []

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
  const cursor = hasLightbox.value ? { cursor: 'pointer' } : {}

  if (group.type === 'grid') {
    return {
      ...cursor,
      gridColumn: (entry.colSpan ?? 1) > 1 ? `span ${entry.colSpan}` : undefined,
      gridRow: (entry.rowSpan ?? 1) > 1 ? `span ${entry.rowSpan}` : undefined,
      overflow: 'hidden',
      padding: `${props.padding}px`,
    }
  }

  if (group.type === 'row') {
    const gaps = props.spacing * (entry.itemsCount - 1) + 2 * props.padding * entry.itemsCount
    return {
      ...cursor,
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
    ...cursor,
    boxSizing: 'content-box',
    display: 'block',
    height: 'auto',
    padding: `${props.padding}px`,
    marginBottom: !isLast ? `${props.spacing}px` : undefined,
    width: `calc(100% - ${2 * props.padding}px)`,
  }
}
</script>
