<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="`np-album--${props.layout}`"
    :style="containerStyle"
  >
    <!-- Rows: flat flex, no DOM switch = zero CLS.
         Pre-mount: CSS flex-grow approximation; post-mount: JS-computed widths on same elements.
         With breakpoints: container query rules handle all widths from first paint; JS syncs after mount. -->
    <template v-if="props.layout === 'rows'">
      <component v-if="containerQueryCSS" :is="'style'">{{ containerQueryCSS }}</component>
      <div :style="ssrWrapperStyle">
        <div
          v-for="item in rowItems"
          :key="photoId(item.photo)"
          class="np-album__item"
          :class="containerQueriesActive ? `np-item-${item.index}` : undefined"
          :style="item.style"
          v-bind="hasLightbox ? {
            ref: setItemRef(item.index),
            role: 'button',
            tabindex: '0',
            onClick: () => openPhoto(item.photo, item.index),
            onKeydown: (e: KeyboardEvent) => handleItemKeydown(e, item.photo, item.index),
          } : { ref: setItemRef(item.index) }"
        >
          <div :style="isHidden(item.photo) && !$slots.thumbnail ? { opacity: 0 } : undefined" style="width:100%;height:100%">
            <slot
              v-if="$slots.thumbnail"
              name="thumbnail"
              :photo="item.photo"
              :index="item.index"
              :width="item.width"
              :height="item.height"
              :hidden="isHidden(item.photo)"
            />
            <PhotoImage
              v-else
              :photo="item.photo"
              context="thumb"
              :adapter="adapter"
              loading="lazy"
              :sizes="item.computedSizes"
              class="np-album__img"
              :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${item.photo.width} / ${item.photo.height}` }"
            />
          </div>
        </div>
        <!-- Absorbs remaining space in the last row so photos don't stretch to fill it -->
        <span style="flex-grow:9999;flex-basis:0;height:0;margin:0;padding:0" aria-hidden="true" />
      </div>
    </template>

    <!-- columns / masonry / bento: CSS grid until mounted, then JS-computed layout -->
    <template v-else>
      <template v-if="!isMounted">
        <div :style="ssrWrapperStyle">
          <div
            v-for="(photo, index) in photos"
            :key="photoId(photo)"
            class="np-album__item"
            :style="ssrItemStyle(photo)"
            v-bind="hasLightbox ? {
              ref: setItemRef(index),
              role: 'button',
              tabindex: '0',
              onClick: () => openPhoto(photo, index),
              onKeydown: (e: KeyboardEvent) => handleItemKeydown(e, photo, index),
            } : { ref: setItemRef(index) }"
          >
            <div style="width:100%;height:100%">
              <slot
                v-if="$slots.thumbnail"
                name="thumbnail"
                :photo="photo"
                :index="index"
                :width="photo.width"
                :height="photo.height"
                :hidden="false"
              />
              <PhotoImage
                v-else
                :photo="photo"
                context="thumb"
                :adapter="adapter"
                loading="lazy"
                class="np-album__img"
                :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${photo.width} / ${photo.height}` }"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <template v-if="groups.length === 0 && photos.length > 0">
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
      </template>
    </template>
  </div>

  <!-- Own lightbox — only rendered when not inside a parent PhotoGroup -->
  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onBeforeUnmount, useId, type CSSProperties, type Component, type ComponentPublicInstance } from 'vue'
import { PhotoImage, useContainerWidth } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  provideLightboxContexts,
  useLightboxContext,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/internal'
import {
  computeRowsLayout,
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computeBentoLayout,
  computePhotoSizes,
  photoId,
  resolveResponsiveParameter,
  type PhotoItem,
  type ImageAdapter,
  type LayoutGroup,
  type LayoutEntry,
  type BentoSizing,
  type ResponsiveParameter,
} from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

function round(value: number, digits = 0) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  /** Number of columns (columns/masonry/bento layouts). Accepts a responsive function. @default 3 */
  columns?: ResponsiveParameter<number>
  /** Gap between images in pixels. Accepts a responsive function. @default 8 */
  spacing?: ResponsiveParameter<number>
  /** Outer padding around each image in pixels. Accepts a responsive function. @default 0 */
  padding?: ResponsiveParameter<number>
  /** Target row height in pixels (rows layout only). Accepts a responsive function. @default 300 */
  targetRowHeight?: ResponsiveParameter<number>
  /** Row height in pixels (bento layout only). Accepts a responsive function. @default 280 */
  bentoRowHeight?: ResponsiveParameter<number>
  bentoSizing?: BentoSizing
  bentoPatternInterval?: number
  /**
   * Assumed container width in pixels for SSR.
   * When set, the JS row layout runs on the server so the SSR HTML matches the
   * client-hydrated layout — eliminating CLS.
   * Combine with `breakpoints` so both server and client snap to the same width.
   * A value of `0` has no effect; omit the prop to keep the CSS flex-grow fallback.
   */
  defaultContainerWidth?: number
  /**
   * Snap the observed container width down to the largest breakpoint ≤ actual width.
   * Prevents re-layout on sub-pixel fluctuations and scrollbar oscillation.
   * When used without `defaultContainerWidth`, snapping only applies after mount.
   */
  breakpoints?: readonly number[]
  /**
   * `<img sizes>` hint for the rows layout.
   * `size` describes the album container width (e.g. `'100vw'`).
   * `sizes` adds viewport-specific overrides prepended to the default.
   */
  sizes?: {
    size: string
    sizes?: Array<{ viewport: string; size: string }>
  }
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

if (import.meta.dev && props.defaultContainerWidth === 0) {
  console.warn('[nuxt-photo] defaultContainerWidth=0 has no effect; omit it or use a positive value')
}

// SSR-safe unique container name for CSS container queries (useId() is deterministic across server/client)
const albumId = useId()
const containerName = computed(() => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`)

const containerQueriesActive = computed(() =>
  props.layout === 'rows' && !!props.breakpoints?.length,
)

const containerQueryCSS = computed(() => {
  if (!containerQueriesActive.value) return ''
  return computeBreakpointStyles({
    photos: props.photos,
    breakpoints: props.breakpoints!,
    spacing: props.spacing,
    padding: props.padding,
    targetRowHeight: props.targetRowHeight,
    containerName: containerName.value,
  })
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
const isMounted = ref(false)

const { containerWidth } = useContainerWidth(containerRef, {
  defaultContainerWidth: props.defaultContainerWidth,
  breakpoints: props.breakpoints,
})

onMounted(() => {
  // Switch columns/masonry/bento from CSS grid to JS layout
  isMounted.value = true
})

const groups = computed<LayoutGroup[]>(() => {
  if (containerWidth.value <= 0) return []

  const w = containerWidth.value
  const spacing = resolveResponsiveParameter(props.spacing, w, 8)
  const padding = resolveResponsiveParameter(props.padding, w, 0)
  const columns = resolveResponsiveParameter(props.columns, w, 3)
  const targetRowHeight = resolveResponsiveParameter(props.targetRowHeight, w, 300)
  const bentoRowHeight = resolveResponsiveParameter(props.bentoRowHeight, w, 280)

  const input = { photos: props.photos, containerWidth: w, spacing, padding }

  switch (props.layout) {
    case 'rows': {
      const result = computeRowsLayout({ ...input, targetRowHeight })
      if (result.length === 0 && props.photos.length > 0) {
        console.warn('[nuxt-photo] rows layout produced no groups — containerWidth may be too small for targetRowHeight')
      }
      return result
    }
    case 'columns':
      return computeColumnsLayout({ ...input, columns })
    case 'masonry':
      return computeMasonryLayout({ ...input, columns })
    case 'bento':
      return computeBentoLayout({ ...input, columns, rowHeight: bentoRowHeight, sizing: props.bentoSizing, patternInterval: props.bentoPatternInterval })
  }
})

// Flat per-item descriptors for the rows layout.
// CSS flex-grow fallback when containerWidth is 0 (no defaultContainerWidth set).
// JS-computed widths when containerWidth > 0 (same flat DOM structure → zero CLS).
type RowItem = { photo: PhotoItem; index: number; width: number; height: number; style: CSSProperties; computedSizes?: string }

const rowItems = computed<RowItem[]>(() => {
  const cursor = hasLightbox.value ? { cursor: 'pointer' as const } : {}
  const w = containerWidth.value
  const spacing = resolveResponsiveParameter(props.spacing, w, 8)
  const padding = resolveResponsiveParameter(props.padding, w, 0)
  const targetRowHeight = resolveResponsiveParameter(props.targetRowHeight, w, 300)

  // Container queries active + no defaultContainerWidth: CSS @container rules handle all widths.
  // Items get no inline flex/width; after mount, ResizeObserver fires → JS adds matching styles → zero CLS.
  if (containerQueriesActive.value && !props.defaultContainerWidth) {
    return props.photos.map((photo, index) => ({
      photo,
      index,
      width: photo.width,
      height: photo.height,
      style: { ...cursor, overflow: 'hidden' } as CSSProperties,
    }))
  }

  if (containerWidth.value <= 0 || groups.value.length === 0) {
    return props.photos.map((photo, index) => {
      const ar = photo.width / photo.height
      return {
        photo,
        index,
        width: photo.width,
        height: photo.height,
        style: { ...cursor, flexGrow: ar, flexBasis: `${targetRowHeight * ar}px`, overflow: 'hidden' } as CSSProperties,
      }
    })
  }

  return groups.value.flatMap(row =>
    row.entries.map((entry) => {
      const gaps = spacing * (entry.itemsCount - 1) + 2 * padding * entry.itemsCount
      return {
        photo: entry.photo,
        index: entry.index,
        width: entry.width,
        height: entry.height,
        computedSizes: computePhotoSizes(entry.width, w, entry.itemsCount, spacing, padding, props.sizes),
        style: {
          ...cursor,
          flex: '0 0 auto',
          boxSizing: 'content-box' as const,
          padding: `${padding}px`,
          overflow: 'hidden',
          width: `calc((100% - ${gaps}px) / ${round(
            (w - gaps) / entry.width,
            5,
          )})`,
        } as CSSProperties,
      }
    })
  )
})

// SSR / pre-mount wrapper style: overrides the album's CSS flex direction
const ssrWrapperStyle = computed<CSSProperties>(() => {
  const w = containerWidth.value
  const spacing = resolveResponsiveParameter(props.spacing, w, 8)
  const columns = resolveResponsiveParameter(props.columns, w, 3)
  if (props.layout === 'rows') {
    return { display: 'flex', flexWrap: 'wrap', gap: `${spacing}px`, width: '100%' }
  }
  // columns / masonry / bento: simple equal-width grid
  return { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${spacing}px`, width: '100%' }
})

// SSR / pre-mount per-item style
function ssrItemStyle(photo: PhotoItem): CSSProperties {
  const cursor = hasLightbox.value ? { cursor: 'pointer' } : {}
  if (props.layout === 'rows') {
    const w = containerWidth.value
    const targetRowHeight = resolveResponsiveParameter(props.targetRowHeight, w, 300)
    const ar = photo.width / photo.height
    return { ...cursor, flexGrow: ar, flexBasis: `${targetRowHeight * ar}px`, overflow: 'hidden' }
  }
  return { ...cursor, overflow: 'hidden' }
}

const containerStyle = computed<CSSProperties>(() => {
  if (containerQueriesActive.value) {
    return { width: '100%', containerType: 'inline-size', containerName: containerName.value }
  }
  return { width: '100%' }
})

function groupStyle(group: LayoutGroup): CSSProperties {
  const w = containerWidth.value
  const spacing = resolveResponsiveParameter(props.spacing, w, 8)
  const padding = resolveResponsiveParameter(props.padding, w, 0)
  const columns = resolveResponsiveParameter(props.columns, w, 3)
  const bentoRowHeight = resolveResponsiveParameter(props.bentoRowHeight, w, 280)

  if (group.type === 'grid') {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridAutoRows: `${bentoRowHeight}px`,
      gridAutoFlow: 'dense',
      gap: `${spacing}px`,
    }
  }

  if (group.type === 'row') {
    return {
      marginBottom: group.index < groups.value.length - 1 ? `${spacing}px` : undefined,
    }
  }

  const columnsCount = groups.value.length || 1

  if (
    props.layout === 'masonry'
    || group.columnsGaps === undefined
    || group.columnsRatios === undefined
  ) {
    return {
      marginLeft: group.index > 0 ? `${spacing}px` : undefined,
      width: `calc((100% - ${spacing * (columnsCount - 1)}px) / ${columnsCount})`,
    }
  }

  const totalRatio = group.columnsRatios.reduce((acc, v) => acc + v, 0)
  const totalAdjustedGaps = group.columnsRatios.reduce(
    (acc, v, ratioIndex) =>
      acc + ((group.columnsGaps![group.index] ?? 0) - (group.columnsGaps![ratioIndex] ?? 0)) * v,
    0,
  )

  return {
    marginLeft: group.index > 0 ? `${spacing}px` : undefined,
    width: `calc((100% - ${round(
      (columnsCount - 1) * spacing
      + 2 * columnsCount * padding
      + totalAdjustedGaps,
      3,
    )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
      2 * padding
    }px)`,
  }
}

function itemStyle(entry: LayoutEntry, group: LayoutGroup): CSSProperties {
  const cursor = hasLightbox.value ? { cursor: 'pointer' } : {}
  const w = containerWidth.value
  const spacing = resolveResponsiveParameter(props.spacing, w, 8)
  const padding = resolveResponsiveParameter(props.padding, w, 0)

  if (group.type === 'grid') {
    return {
      ...cursor,
      gridColumn: (entry.colSpan ?? 1) > 1 ? `span ${entry.colSpan}` : undefined,
      gridRow: (entry.rowSpan ?? 1) > 1 ? `span ${entry.rowSpan}` : undefined,
      overflow: 'hidden',
      padding: `${padding}px`,
    }
  }

  if (group.type === 'row') {
    const gaps = spacing * (entry.itemsCount - 1) + 2 * padding * entry.itemsCount
    return {
      ...cursor,
      boxSizing: 'content-box',
      display: 'block',
      height: 'auto',
      padding: `${padding}px`,
      width: `calc((100% - ${gaps}px) / ${round(
        (w - gaps) / entry.width,
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
    padding: `${padding}px`,
    marginBottom: !isLast ? `${spacing}px` : undefined,
    width: `calc(100% - ${2 * padding}px)`,
  }
}
</script>
