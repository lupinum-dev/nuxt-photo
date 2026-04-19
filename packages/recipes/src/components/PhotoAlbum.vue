<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="[scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <template v-if="layoutType === 'rows'">
      <component v-if="containerQueryCSS" :is="'style'">{{
        containerQueryCSS
      }}</component>
      <div :style="ssrWrapperStyle">
        <div
          v-for="item in rowItems"
          :key="photoId(item.photo)"
          class="np-album__item"
          :class="[
            containerQueriesActive ? `np-item-${item.index}` : undefined,
            itemClass,
          ]"
          :style="item.style"
          v-bind="itemBindings(item.photo, item.index)"
        >
          <div
            :style="
              isHidden(item.photo) && !$slots.thumbnail
                ? { opacity: 0 }
                : undefined
            "
            style="width: 100%; height: 100%"
          >
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
              :image-adapter="imageAdapter"
              loading="lazy"
              :sizes="item.computedSizes"
              class="np-album__img"
              :class="imgClass"
              :style="{
                display: 'block',
                width: '100%',
                height: 'auto',
                aspectRatio: `${item.photo.width} / ${item.photo.height}`,
              }"
            />
          </div>
        </div>
        <!-- Absorbs remaining space in the last row so photos don't stretch to fill it -->
        <span
          style="
            flex-grow: 9999;
            flex-basis: 0;
            height: 0;
            margin: 0;
            padding: 0;
          "
          aria-hidden="true"
        />
      </div>
    </template>

    <template v-else>
      <template v-if="!isMounted && breakpointSnapshots.length > 0">
        <component :is="'style'" v-if="containerQueryCSS">{{
          containerQueryCSS
        }}</component>
        <div
          v-for="snap in breakpointSnapshots"
          :key="snap.spanKey"
          :class="[snapshotClass, 'np-album__bp-snapshot']"
          :data-bp="snap.spanKey"
          :style="snapshotWrapperStyle(snap, breakpointSnapshots.length > 1)"
        >
          <div
            v-for="group in snap.groups"
            :key="`${snap.spanKey}-${group.type}-${group.index}`"
            class="np-album__column"
            :style="snapshotGroupStyle(group, snap)"
          >
            <div
              v-for="entry in group.entries"
              :key="`${snap.spanKey}-${entry.photo.id}`"
              class="np-album__item"
              :class="itemClass"
              :style="snapshotItemStyle(entry, group, snap)"
              v-bind="itemBindings(entry.photo, entry.index)"
            >
              <div style="width: 100%; height: 100%">
                <slot
                  v-if="$slots.thumbnail"
                  name="thumbnail"
                  :photo="entry.photo"
                  :index="entry.index"
                  :width="entry.width"
                  :height="entry.height"
                  :hidden="false"
                />
                <PhotoImage
                  v-else
                  :photo="entry.photo"
                  context="thumb"
                  :image-adapter="imageAdapter"
                  loading="lazy"
                  class="np-album__img"
                  :class="imgClass"
                  :style="{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    aspectRatio: `${entry.photo.width} / ${entry.photo.height}`,
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Approximate fallback (no breakpoints, no defaultContainerWidth). -->
      <template v-else-if="!isMounted">
        <div :style="ssrWrapperStyle">
          <div
            v-for="(photo, index) in photos"
            :key="photoId(photo)"
            class="np-album__item"
            :class="itemClass"
            :style="ssrItemStyle(photo)"
            v-bind="itemBindings(photo, index)"
          >
            <div style="width: 100%; height: 100%">
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
                :image-adapter="imageAdapter"
                loading="lazy"
                class="np-album__img"
                :class="imgClass"
                :style="{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: `${photo.width} / ${photo.height}`,
                }"
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
            :class="group.type === 'row' ? 'np-album__row' : 'np-album__column'"
            :style="groupStyle(group)"
          >
            <div
              v-for="entry in group.entries"
              :key="entry.photo.id"
              class="np-album__item"
              :class="itemClass"
              :style="itemStyle(entry, group)"
              v-bind="itemBindings(entry.photo, entry.index)"
            >
              <div
                :style="
                  isHidden(entry.photo) && !$slots.thumbnail
                    ? { opacity: 0 }
                    : undefined
                "
                style="width: 100%; height: 100%"
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
                  :image-adapter="imageAdapter"
                  loading="lazy"
                  class="np-album__img"
                  :class="imgClass"
                  :style="{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    aspectRatio: `${entry.photo.width} / ${entry.photo.height}`,
                  }"
                />
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>

  <!-- Own lightbox — only rendered when not inside a parent PhotoGroup -->
  <component
    :is="LightboxComponent"
    v-if="hasOwnLightbox && LightboxComponent"
  />
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  provide,
  watch,
  onBeforeUnmount,
  useSlots,
  type Component,
  type ComponentPublicInstance,
} from 'vue'
import { PhotoImage, useLightboxProvider } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  LightboxSlotsKey,
  type LightboxSlotOverrides,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/extend'
import {
  mergeResponsiveBreakpoints,
  photoId,
  type PhotoItem,
  type PhotoAdapter,
  type ImageAdapter,
  type AlbumLayout,
  type ResponsiveParameter,
} from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'
import { usePhotoLayout } from '../composables/usePhotoLayout'

const props = withDefaults(
  defineProps<{
    photos: PhotoItem[] | any[]
    /** Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS/API data directly. */
    itemAdapter?: PhotoAdapter
    /**
     * Layout algorithm and its options. Pass a string for defaults, or an object for full control.
     *
     * @example
     * layout="rows"
     * :layout="{ type: 'rows', targetRowHeight: 280 }"
     */
    layout?: AlbumLayout | AlbumLayout['type']
    /** Shorthand for rows layout. Ignored unless `layout` resolves to `rows`. */
    targetRowHeight?: ResponsiveParameter<number>
    /** Shorthand for columns/masonry layouts. Ignored unless `layout` resolves to `columns` or `masonry`. */
    columns?: ResponsiveParameter<number>
    /** Gap between images in pixels. Accepts a responsive function. @default 8 */
    spacing?: ResponsiveParameter<number>
    /** Outer padding around each image in pixels. Accepts a responsive function. @default 0 */
    padding?: ResponsiveParameter<number>
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
    imageAdapter?: ImageAdapter
    /** Whether to enable lightbox. @default true */
    lightbox?: boolean | Component
    /** Transition mode for lightbox open/close */
    transition?: LightboxTransitionOption
    /** Extra classes for each album item wrapper */
    itemClass?: string
    /** Extra classes for each album img element */
    imgClass?: string
  }>(),
  {
    layout: 'rows',
    spacing: 8,
    padding: 0,
    lightbox: true,
  },
)

// Normalize layout prop: string → object with defaults
const normalizedLayout = computed<AlbumLayout>(() => {
  const raw = props.layout
  if (typeof raw === 'object') {
    switch (raw.type) {
      case 'rows':
        return {
          ...raw,
          targetRowHeight: raw.targetRowHeight ?? props.targetRowHeight,
        }
      case 'columns':
      case 'masonry':
        return { ...raw, columns: raw.columns ?? props.columns }
    }
  }
  switch (raw) {
    case 'rows':
      return { type: 'rows', targetRowHeight: props.targetRowHeight }
    case 'columns':
      return { type: 'columns', columns: props.columns }
    case 'masonry':
      return { type: 'masonry', columns: props.columns }
    default: {
      if ((globalThis as any).process?.env?.NODE_ENV !== 'production') {
        console.warn(
          `[nuxt-photo] Unknown layout type "${raw}", falling back to "rows"`,
        )
      }
      return { type: 'rows', targetRowHeight: props.targetRowHeight }
    }
  }
})

if (
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV !== 'production' &&
  props.defaultContainerWidth === 0
) {
  console.warn(
    '[nuxt-photo] defaultContainerWidth=0 has no effect; omit it or use a positive value',
  )
}

// ─── Photos (with optional adapter) ──────────────────────────────────────────

const photos = computed<PhotoItem[]>(() =>
  props.itemAdapter
    ? props.photos.map(props.itemAdapter)
    : (props.photos as PhotoItem[]),
)

// ─── Layout ──────────────────────────────────────────────────────────────────

const hasLightbox = computed(() => props.lightbox !== false)

const layoutType = computed(() => normalizedLayout.value.type)
const layoutColumns = computed(() => {
  const l = normalizedLayout.value
  if (l.type === 'columns' || l.type === 'masonry') {
    return l.columns ?? 3
  }
  return 3
})
const layoutTargetRowHeight = computed(() => {
  const l = normalizedLayout.value
  return l.type === 'rows' ? (l.targetRowHeight ?? 300) : 300
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
  isMounted,
  scopeClass,
  snapshotClass,
  containerStyle,
  containerQueryCSS,
  containerQueriesActive,
  breakpointSnapshots,
  groups,
  rowItems,
  ssrWrapperStyle,
  ssrItemStyle,
  groupStyle,
  itemStyle,
  snapshotGroupStyle,
  snapshotItemStyle,
  snapshotWrapperStyle,
  maybeWarnApproximate,
} = usePhotoLayout({
  photos,
  layout: layoutType,
  columns: layoutColumns,
  spacing: computed(() => props.spacing),
  padding: computed(() => props.padding),
  targetRowHeight: layoutTargetRowHeight,
  defaultContainerWidth: props.defaultContainerWidth,
  breakpoints: effectiveBreakpoints.value,
  sizes: props.sizes,
  interactive: hasLightbox,
})

maybeWarnApproximate()

// ─── Lightbox ────────────────────────────────────────────────────────────────

const parentGroup = inject(PhotoGroupContextKey, null)
const injectedLightbox = inject(LightboxComponentKey, null)

const hasOwnLightbox = !parentGroup && props.lightbox !== false
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? InternalLightbox
  return props.lightbox as Component
})

const ownCtx = !parentGroup
  ? useLightboxProvider(photos, { transition: props.transition })
  : null

// Forward #toolbar, #caption, #slide slots into the lightbox via injection
const albumSlots = useSlots()
if (hasOwnLightbox) {
  const slotOverrides = computed<LightboxSlotOverrides>(() => {
    const overrides: LightboxSlotOverrides = {}
    if (albumSlots.toolbar)
      overrides.toolbar = albumSlots.toolbar as LightboxSlotOverrides['toolbar']
    if (albumSlots.caption)
      overrides.caption = albumSlots.caption as LightboxSlotOverrides['caption']
    if (albumSlots.slide)
      overrides.slide = albumSlots.slide as LightboxSlotOverrides['slide']
    return overrides
  })
  provide(LightboxSlotsKey, slotOverrides)
}

// Track thumb DOM elements by photo index
const thumbElsMap: Record<number, HTMLElement | null> = {}

function setItemRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    thumbElsMap[index] = el as HTMLElement | null
  }
}

function openPhoto(photo: PhotoItem, index: number) {
  if (parentGroup) {
    void parentGroup.openPhoto(photo)
  } else if (ownCtx) {
    for (const [i, el] of Object.entries(thumbElsMap)) {
      ownCtx.setThumbRef(Number(i))(el)
    }
    void ownCtx.open(index)
  }
}

function handleItemKeydown(e: KeyboardEvent, photo: PhotoItem, index: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openPhoto(photo, index)
  }
}

function itemBindings(photo: PhotoItem, index: number) {
  const base = { ref: setItemRef(index) }
  if (!hasLightbox.value) return base

  return {
    ...base,
    role: 'button',
    tabindex: '0',
    'aria-label': photo.alt || `View photo ${index + 1}`,
    onClick: () => openPhoto(photo, index),
    onKeydown: (e: KeyboardEvent) => handleItemKeydown(e, photo, index),
  }
}

function isHidden(photo: PhotoItem): boolean {
  if (parentGroup) return parentGroup.hiddenPhoto.value === photo
  if (ownCtx) {
    const idx = ownCtx.hiddenThumbIndex.value
    if (idx === null) return false
    return photos.value[idx] === photo
  }
  return false
}

// ─── Stable group registration (diff-based) ────────────────────────────────

const idToSymbol = new Map<string, symbol>()
let registrationIds: symbol[] = []

if (parentGroup) {
  function syncRegistrations(photos: PhotoItem[]) {
    const newIds = new Set(photos.map(photoId))
    const oldIds = new Set(idToSymbol.keys())

    for (const pid of oldIds) {
      if (!newIds.has(pid)) {
        const sym = idToSymbol.get(pid)!
        parentGroup!.unregister(sym)
        idToSymbol.delete(pid)
      }
    }

    registrationIds = photos.map((photo, index) => {
      const pid = photoId(photo)
      let sym = idToSymbol.get(pid)
      if (!sym) {
        sym = Symbol()
        idToSymbol.set(pid, sym)
        parentGroup!.register(
          sym,
          photo,
          () => thumbElsMap[index] ?? null,
          null,
        )
      }
      return sym
    })
  }

  watch(
    photos,
    (p) => {
      syncRegistrations(p)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    for (const sym of registrationIds) {
      parentGroup.unregister(sym)
    }
    idToSymbol.clear()
    registrationIds = []
  })
}
</script>
