<template>
  <div
    ref="containerRef"
    v-bind="$attrs"
    class="np-album"
    :class="[ui?.root, scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <template v-if="renderBranch.kind === 'frame'">
      <ContainerQueryStyle v-if="frame.css" :css="frame.css" />
      <div class="np-album__frame" :style="frame.frameStyle">
        <div
          v-for="(item, position) in frame.items"
          :key="normalizedPhotos[item.index]!.id"
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
            :sizes="frameSizes(position)"
            :priority="position < priority"
            cover
          >
            <template v-if="$slots.thumbnail" #thumbnail="slotProps">
              <slot name="thumbnail" v-bind="slotProps" />
            </template>
          </AlbumThumbnail>
          <span v-if="item.more" class="np-album__more" aria-hidden="true">+{{ item.more }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="renderBranch.kind === 'rows'">
      <template v-if="renderBranch.containerQueryCss">
        <ContainerQueryStyle :css="renderBranch.containerQueryCss" />
      </template>

      <div :style="renderBranch.wrapperStyle">
        <div
          v-for="item in renderBranch.items"
          :key="item.photo.id"
          class="np-album__item"
          :class="[
            renderBranch.containerQueriesRender ? `np-item-${item.index}` : undefined,
            ui?.item,
          ]"
          :style="item.style"
          v-bind="itemBindings(item.photo, item.index)"
        >
          <AlbumThumbnail
            :photo="item.photo"
            :index="item.index"
            :width="item.width"
            :height="item.height"
            :hidden="isHidden(item.photo)"
            :image-class="ui?.img"
            :sizes="item.computedSizes"
            :priority="item.index < priority"
          >
            <template v-if="$slots.thumbnail" #thumbnail="slotProps">
              <slot name="thumbnail" v-bind="slotProps" />
            </template>
          </AlbumThumbnail>
        </div>

        <span
          style="flex-grow: 9999; flex-basis: 0; height: 0; margin: 0; padding: 0"
          aria-hidden="true"
        />
      </div>
    </template>

    <template v-else>
      <template v-if="renderBranch.groups.length === 0 && normalizedPhotos.length > 0">
        <div class="np-album__skeleton" />
      </template>

      <template v-else>
        <div
          v-for="group in renderBranch.groups"
          :key="`${group.type}-${group.index}`"
          :class="group.type === 'row' ? 'np-album__row' : 'np-album__column'"
          :style="groupStyle(group)"
        >
          <div
            v-for="entry in group.entries"
            :key="entry.photo.id"
            class="np-album__item"
            :class="ui?.item"
            :style="itemStyle(entry, group)"
            v-bind="itemBindings(entry.photo, entry.index)"
          >
            <AlbumThumbnail
              :photo="entry.photo"
              :index="entry.index"
              :width="entry.width"
              :height="entry.height"
              :hidden="isHidden(entry.photo)"
              :image-class="ui?.img"
              :sizes="thumbnailSizes(entry)"
              :priority="entry.index < priority"
            >
              <template v-if="$slots.thumbnail" #thumbnail="slotProps">
                <slot name="thumbnail" v-bind="slotProps" />
              </template>
            </AlbumThumbnail>
          </div>
        </div>
      </template>
    </template>

    <span ref="endRef" class="np-album__end" aria-hidden="true" />
  </div>

  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import { computed, defineComponent, h } from 'vue'
import type { PhotoUi } from '../types/ui'
import { useRecipeLightbox } from './shared/useRecipeLightbox'

import {
  mergeResponsiveBreakpoints,
  computeFrameLayout,
  computePhotoSizes,
  type FrameLayout,
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  type AlbumLayout,
  type PhotoItem,
  type ResponsiveParameter,
  type ResponsivePhotoSizes,
  type InvalidPhotoPolicy,
  type InvalidPhotosEvent,
} from '../core/index'

import AlbumThumbnail from './photo-album/AlbumThumbnail.vue'
import { usePhotoAlbumLayoutState } from './photo-album/layoutState'
import { devWarn } from '../core/env'
import { useCollectionLightbox } from './shared/useCollectionLightbox'
import { useGalleryModel } from '../gallery/model'
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
    photo: PhotoItem<TMeta>
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
     * Photos in display and navigation order. Each needs a stable `id`, a `src`, and the real pixel
     * `width` and `height` of the image file.
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
     * Container width in pixels for the server render, before the browser can measure. Set it close
     * to the usual width to avoid a layout jump after hydration.
     */
    defaultContainerWidth?: number
    /**
     * Container widths in pixels that measurement snaps to. Taken from `responsive()` keys when
     * omitted.
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

const LAYOUT_TYPES: readonly AlbumLayout['type'][] = [
  'rows',
  'columns',
  'masonry',
  'grid',
  'bento',
  'mosaic',
  'accordion',
]

const normalizedLayout = computed<AlbumLayout<TMeta>>(() => {
  const raw = props.layout
  if (typeof raw === 'object') return raw

  switch (true) {
    case LAYOUT_TYPES.includes(raw):
      return { type: raw } as AlbumLayout<TMeta>
    default:
      devWarn(`Unknown layout type "${raw}", falling back to "rows"`)
      return { type: 'rows' }
  }
})

if (props.defaultContainerWidth === 0) {
  devWarn('defaultContainerWidth=0 has no effect; omit it or use a positive value')
}

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
const layoutColumns = computed(() => {
  const layout = normalizedLayout.value
  if (layout.type === 'columns' || layout.type === 'masonry' || layout.type === 'grid') {
    return layout.columns ?? DEFAULT_COLUMNS
  }
  if (layout.type === 'bento') return layout.columns ?? 4
  return DEFAULT_COLUMNS
})
const layoutTargetRowHeight = computed(() => {
  const layout = normalizedLayout.value
  return layout.type === 'rows'
    ? (layout.targetRowHeight ?? DEFAULT_TARGET_ROW_HEIGHT)
    : DEFAULT_TARGET_ROW_HEIGHT
})

const effectiveBreakpoints = computed<readonly number[] | undefined>(() => {
  if (props.breakpoints?.length) return props.breakpoints

  return mergeResponsiveBreakpoints([
    props.spacing,
    props.padding,
    layoutColumns.value,
    layoutTargetRowHeight.value,
  ])
})

const {
  containerRef,
  layoutWidth,
  containerName,
  scopeClass,
  containerStyle,
  containerQueryCSS,
  containerQueriesRender,
  groups,
  rowItems,
  thumbnailSizes,
  ssrWrapperStyle,
  groupStyle,
  itemStyle,
} = usePhotoAlbumLayoutState({
  photos: normalizedPhotos,
  layout: layoutType,
  columns: layoutColumns,
  spacing: computed(() => props.spacing),
  padding: computed(() => props.padding),
  targetRowHeight: layoutTargetRowHeight,
  defaultContainerWidth: props.defaultContainerWidth,
  breakpoints: effectiveBreakpoints,
  sizes: computed(() => props.sizes),
  interactive: computed((): boolean => hasLightbox.value),
})

const isFrame = computed(() => !['rows', 'columns', 'masonry'].includes(layoutType.value))
let warnedFunction = false
const frame = computed<FrameLayout>(() => {
  const layout = normalizedLayout.value
  if (
    layout.type !== 'grid' &&
    layout.type !== 'bento' &&
    layout.type !== 'mosaic' &&
    layout.type !== 'accordion'
  ) {
    return { css: '', frameStyle: {}, items: [], order: [], widths: [] }
  }
  if (
    !effectiveBreakpoints.value?.length &&
    !warnedFunction &&
    [
      props.spacing,
      props.padding,
      layout.type === 'grid' || layout.type === 'bento' ? layout.columns : undefined,
    ].some((value) => typeof value === 'function')
  ) {
    warnedFunction = true
    devWarn(
      `${layout.type} layout renders with CSS only; a function value needs responsive() or the breakpoints prop. Using its value at width 0.`,
    )
  }
  return computeFrameLayout({
    ...layout,
    photos: normalizedPhotos.value,
    containerName: containerName.value,
    breakpoints: effectiveBreakpoints.value,
    spacing: props.spacing,
    padding: props.padding,
  })
})

// Bento and mosaic reorder photos; the lightbox follows the order on screen.
const orderedPhotos = computed(() =>
  isFrame.value
    ? frame.value.order.map((index) => normalizedPhotos.value[index]!)
    : normalizedPhotos.value,
)

/** The tile's share of the measured (or, on the server, estimated) album width. */
function frameSizes(position: number): string {
  const width = layoutWidth.value
  const range = [...frame.value.widths].reverse().find((entry) => entry.start <= width)
  const tile = Math.ceil((range?.shares[position] ?? 1) * width)
  return computePhotoSizes(tile, width, 1, 0, 0, props.sizes) ?? `${tile}px`
}

const {
  hasLightbox,
  hasOwnLightbox,
  LightboxComponent,
  itemBindings,
  isHidden,
  open: openAt,
  openById,
  close,
  isOpen,
  activeId: ownerActiveId,
  activePhoto: ownerActivePhoto,
} = useCollectionLightbox(orderedPhotos, props, (): HTMLElement | null => containerRef.value)

const { activeId, activePhoto } = useGalleryModel(
  'PhotoAlbum',
  () => props.active,
  () => normalizedPhotos.value,
  { isOpen, activeId: ownerActiveId, activePhoto: ownerActivePhoto, openById, close },
  (id) => emit('update:active', id),
)

/** Opens by position in `photos`, which differs from the display order in bento and mosaic. */
async function open(index = 0) {
  if (!isFrame.value) return openAt(index)
  const photo = normalizedPhotos.value[index]
  if (!photo) throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  return openById(photo.id)
}

defineExpose({ open, openById, close, isOpen, activeId, activePhoto })

const renderBranch = computed(() => {
  if (isFrame.value) return { kind: 'frame' as const }
  if (layoutType.value === 'rows') {
    return {
      kind: 'rows' as const,
      containerQueryCss: containerQueryCSS.value,
      wrapperStyle: ssrWrapperStyle.value,
      items: rowItems.value,
      containerQueriesRender: containerQueriesRender.value,
    }
  }

  return {
    kind: 'measured' as const,
    groups: groups.value,
  }
})
</script>
