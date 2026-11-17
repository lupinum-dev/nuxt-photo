<template>
  <div
    ref="containerRef"
    v-bind="$attrs"
    class="np-album"
    :class="[ui?.root, scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <ContainerQueryStyle v-if="plan.css" :css="plan.css" />
    <div class="np-album__frame" :style="plan.frameStyle">
      <template v-for="(item, position) in plan.items" :key="normalizedPhotos[item.index]!.id">
        <div
          class="np-album__item"
          :class="[item.className, ui?.item]"
          :style="{ ...item.style, ...(hasLightbox ? { cursor: 'pointer' } : {}) }"
          v-bind="itemBindings(normalizedPhotos[item.index]!, position)"
        >
          <AlbumThumbnail
            :photo="normalizedPhotos[item.index]!"
            :index="item.index"
            :width="normalizedPhotos[item.index]!.width"
            :height="normalizedPhotos[item.index]!.height"
            :hidden="isHidden(normalizedPhotos[item.index]!)"
            :image-class="ui?.img"
            :sizes="planSizes(position)"
            :priority="position < priority"
            :cover="layoutCropsPhotos(layoutType)"
          >
            <template v-if="$slots.thumbnail" #thumbnail="slotProps">
              <slot name="thumbnail" v-bind="slotProps" />
            </template>
          </AlbumThumbnail>
          <span v-if="item.more" class="np-album__more" aria-hidden="true">+{{ item.more }}</span>
        </div>
        <span
          v-if="item.breakClass"
          class="np-album__break"
          :class="item.breakClass"
          aria-hidden="true"
        />
      </template>
    </div>

    <span ref="endRef" class="np-album__end" aria-hidden="true" />
  </div>

  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import { computed, defineComponent, h, ref, useId } from 'vue'
import type { PhotoUi } from '../types/ui'
import { useRecipeLightbox } from './shared/useRecipeLightbox'

// Direct imports, not the core barrel: the barrel would pull the viewer's core modules
// (zoom, gestures, transitions) into the album's eager chunk.
import {
  mergeResponsiveBreakpoints,
  type AlbumLayout,
  type PhotoItem,
  type ResolvedPhotoItem,
  type ResponsiveParameter,
  type ResponsivePhotoSizes,
} from '../core/types'
import type { InvalidPhotoPolicy, InvalidPhotosEvent } from '../core/photo/normalize'
import type { AlbumPlan } from '../core/layout/plan'
import { computeFramePlan } from '../core/layout/frame'
import { computeRowsPlan, type RowBreakMemo } from '../core/layout/rows/plan'
import { computePhotoSizes } from '../core/image/sizes'
import { computeColumnsPlan } from '../core/layout/columns'
import { computeMasonryPlan } from '../core/layout/masonry'
import {
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  isLayoutType,
  layoutCropsPhotos,
} from '../core/layout/constants'

import AlbumThumbnail from './photo-album/AlbumThumbnail.vue'
import { useElementWidth } from '../composables/useElementWidth'
import { devWarn } from '../core/env'
import { useCollectionLightbox } from './shared/useCollectionLightbox'
import { useAlbumEndReached } from './photo-album/endReached'
import { useRecipePhotos } from './shared/useRecipePhotos'

// Generated layout CSS is trusted internal output. innerHTML preserves `<` and
// `>` range operators identically in SSR output and during client hydration.
const ContainerQueryStyle = defineComponent({
  props: { css: { type: String, required: true } },
  setup: (props) => () => h('style', { innerHTML: props.css }),
})

defineOptions({ inheritAttrs: false })

defineSlots<{
  thumbnail?: (props: {
    photo: ResolvedPhotoItem<TMeta>
    index: number
    width: number
    height: number
    hidden: boolean
    sizes?: string
    priority?: boolean
  }) => unknown
}>()

const props = withDefaults(
  defineProps<{
    /**
     * Photos in display and navigation order. Each needs a `src` and the real pixel `width` and
     * `height` of the image file. `id` defaults to `src`; set it when two photos share a `src`.
     */
    photos: readonly PhotoItem<TMeta>[]
    /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
    active?: string | null
    ui?: PhotoUi<'PhotoAlbum'>
    /**
     * What to do with invalid photos: `'throw'` stops with an error, `'drop'` skips them and emits
     * `invalidPhotos`.
     * @default 'throw'
     */
    validation?: InvalidPhotoPolicy
    /**
     * `'rows'`, `'columns'`, `'masonry'`, `'grid'`, `'bento'`, `'mosaic'`, `'accordion'`, or an
     * object with options: `{ type: 'rows', targetRowHeight: 300 }` or `{ type: 'grid', columns: 3 }`.
     * Options accept `responsive()` values.
     * @default 'rows'
     */
    layout?: AlbumLayout<TMeta> | AlbumLayout['type']
    /**
     * Gap between photos in pixels. Accepts a number, `responsive({ 0: 4, 768: 8 })`, or a function
     * of the container width.
     * @default 8
     */
    spacing?: ResponsiveParameter<number>
    /**
     * Space inside each photo item in pixels. Same forms as `spacing`.
     * @default 0
     */
    padding?: ResponsiveParameter<number>
    /**
     * Container widths in pixels where the layout may change. Taken from `responsive()` keys when
     * omitted. Below the smallest one, and without any, rows and function values are planned at
     * 320, 480, 640, 768, 1024, 1280, 1536, 1920 and 2560.
     */
    breakpoints?: readonly number[]
    /**
     * Image `sizes`: an HTML `sizes` string, or a `ResponsivePhotoSizes` object that each
     * layout turns into a value per photo.
     */
    sizes?: string | ResponsivePhotoSizes
    /** Number of leading photos to load eagerly with high fetch priority. @default 0 */
    priority?: number
    /** Image provider object, or a Nuxt Image provider name. Wins over inherited config. */
    provider?: PhotoProvider | string
    /**
     * `true` opens the built-in lightbox; `false` turns it off. Use `lightbox.component` to replace the viewer. Read once
     * at mount; change the component `key` to remount.
     * @default true
     */
    lightbox?: boolean | LightboxOptions
  }>(),
  {
    lightbox: undefined,
    layout: 'rows',
    priority: 0,
    spacing: DEFAULT_SPACING,
    padding: DEFAULT_PADDING,
  },
)

const emit = defineEmits<{
  'end-reached': []
  'update:active': [id: string | null]
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const endRef = useAlbumEndReached(
  () => props.photos.length,
  () => emit('end-reached'),
)

const normalizedLayout = computed<AlbumLayout<TMeta>>(() => {
  const raw = props.layout
  if (typeof raw === 'object') return raw
  if (isLayoutType(raw)) return { type: raw } as AlbumLayout<TMeta>
  devWarn(`Unknown layout type "${raw}", falling back to "rows"`)
  return { type: 'rows' }
})

const { options: recipeLightboxOptions } = useRecipeLightbox('PhotoAlbum', () => props.lightbox)

providePhotoConfig(() => ({
  provider: props.provider,
  lightbox: recipeLightboxOptions(),
  validation: props.validation,
}))

const normalizedPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoAlbum',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)

const layoutType = computed(() => normalizedLayout.value.type)
const effectiveBreakpoints = computed<readonly number[] | undefined>(() => {
  if (props.breakpoints?.length) return props.breakpoints
  const layout = normalizedLayout.value
  return mergeResponsiveBreakpoints([
    props.spacing,
    props.padding,
    'columns' in layout ? layout.columns : undefined,
    layout.type === 'rows' ? layout.targetRowHeight : undefined,
  ])
})

const containerRef = ref<HTMLElement | null>(null)
// One container name per album keeps several albums' generated CSS apart.
const containerName = `np-${useId().replace(/[^a-z0-9]/gi, '')}`
const scopeClass = `np-scope-${containerName}`
const containerStyle = { width: '100%', containerType: 'inline-size', containerName } as const

// The measured width only chooses image `sizes`; CSS alone positions photos.
// Before the browser measures, assume the smallest breakpoint, else a common
// desktop width.
const { containerWidth } = useElementWidth(containerRef)
const layoutWidth = computed(() =>
  containerWidth.value > 0
    ? containerWidth.value
    : ([...(effectiveBreakpoints.value ?? [])].sort((a, b) => a - b)[0] ?? 1200),
)

// Row breaks of the last rows plan: appended photos (infinite scroll) keep the rows
// already on screen. Plain state, not reactive: the plan only reads it.
let rowBreaks: RowBreakMemo | undefined
const plan = computed<AlbumPlan>(() => {
  const layout = normalizedLayout.value
  const shared = {
    photos: normalizedPhotos.value,
    containerName,
    breakpoints: effectiveBreakpoints.value,
    spacing: props.spacing,
    padding: props.padding,
  }
  if (layout.type === 'rows') {
    const rows = computeRowsPlan({ ...shared, targetRowHeight: layout.targetRowHeight }, rowBreaks)
    rowBreaks = rows.memo
    return rows
  }
  if (layout.type === 'columns') return computeColumnsPlan({ ...shared, columns: layout.columns })
  if (layout.type === 'masonry') return computeMasonryPlan({ ...shared, columns: layout.columns })
  return computeFramePlan({ ...layout, ...shared })
})

// Bento and mosaic reorder photos; the lightbox follows the order on screen.
const orderedPhotos = computed(() =>
  plan.value.order.map((index) => normalizedPhotos.value[index]!),
)

/** The tile's width at the measured (or, on the server, estimated) album width. */
function planSizes(position: number): string {
  const width = layoutWidth.value
  const range = [...plan.value.widths].reverse().find((entry) => entry.start <= width)
  const gaps = range?.gaps?.[position] ?? 0
  const tile = Math.ceil((width - gaps) * (range?.shares[position] ?? 1))
  return computePhotoSizes(tile, width, gaps, props.sizes) ?? `${tile}px`
}

// Bento and mosaic navigate in display order; `open(index)` still addresses `photos`.
const { lightboxComponent, hasLightbox, itemBindings, isHidden, handle } = useCollectionLightbox({
  owner: 'PhotoAlbum',
  photos: orderedPhotos,
  publicPhotos: normalizedPhotos,
  root: () => containerRef.value,
  lightbox: () => props.lightbox,
  defaultEnabled: true,
  active: () => props.active,
  emitActive: (id) => emit('update:active', id),
})
const { open, openById, close, isOpen, activeId, activePhoto } = handle

defineExpose({ open, openById, close, isOpen, activeId, activePhoto })
</script>
