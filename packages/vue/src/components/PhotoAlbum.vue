<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="[scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <template v-if="renderBranch.kind === 'rows'">
      <template v-if="renderBranch.containerQueryCss">
        <component :is="'style'">{{
          renderBranch.containerQueryCss
        }}</component>
      </template>

      <div :style="renderBranch.wrapperStyle">
        <div
          v-for="item in renderBranch.items"
          :key="photoId(item.photo)"
          class="np-album__item"
          :class="[
            renderBranch.containerQueriesActive
              ? `np-item-${item.index}`
              : undefined,
            itemClass,
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
            :image-adapter="imageAdapter"
            :img-class="imgClass"
            :sizes="item.computedSizes"
          >
            <template v-if="$slots.thumbnail" #thumbnail="slotProps">
              <slot name="thumbnail" v-bind="slotProps" />
            </template>
          </AlbumThumbnail>
        </div>

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

    <template v-else-if="renderBranch.kind === 'measured'">
      <template v-if="renderBranch.groups.length === 0 && photos.length > 0">
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
            :class="itemClass"
            :style="itemStyle(entry, group)"
            v-bind="itemBindings(entry.photo, entry.index)"
          >
            <AlbumThumbnail
              :photo="entry.photo"
              :index="entry.index"
              :width="entry.width"
              :height="entry.height"
              :hidden="isHidden(entry.photo)"
              :image-adapter="imageAdapter"
              :img-class="imgClass"
            >
              <template v-if="$slots.thumbnail" #thumbnail="slotProps">
                <slot name="thumbnail" v-bind="slotProps" />
              </template>
            </AlbumThumbnail>
          </div>
        </div>
      </template>
    </template>

    <div v-else :style="renderBranch.wrapperStyle">
      <div
        v-for="(photo, index) in renderBranch.photos"
        :key="photoId(photo)"
        class="np-album__item"
        :class="itemClass"
        :style="ssrItemStyle(photo)"
        v-bind="itemBindings(photo, index)"
      >
        <AlbumThumbnail
          :photo="photo"
          :index="index"
          :width="photo.width"
          :height="photo.height"
          :hidden="false"
          :image-adapter="imageAdapter"
          :img-class="imgClass"
        >
          <template v-if="$slots.thumbnail" #thumbnail="slotProps">
            <slot name="thumbnail" v-bind="slotProps" />
          </template>
        </AlbumThumbnail>
      </div>
    </div>
  </div>

  <component
    :is="LightboxComponent"
    v-if="hasOwnLightbox && LightboxComponent"
  />
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  watch,
  type Component,
  type ComponentPublicInstance,
} from 'vue'
import { useLightboxProvider } from '../composables/index'
import { LightboxComponentKey } from '../provide/keys'
import {
  mergeResponsiveBreakpoints,
  photoId,
  type AlbumLayout,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoMapper,
  type PhotoItem,
  type ResponsiveParameter,
} from '../core/index'
import Lightbox from './Lightbox.vue'
import AlbumThumbnail from './photo-album/AlbumThumbnail.vue'
import { PhotoGroupContextKey } from '../context/photoGroup'
import { usePhotoAlbumLayoutState } from '../composables/usePhotoAlbumLayoutState'
import { resolveRecipePhotos } from '../utils/photos'
import { devWarn } from '../utils/runtime'

const props = withDefaults(
  defineProps<{
    photos: PhotoItem[] | any[]
    itemMapper?: PhotoMapper
    layout?: AlbumLayout | AlbumLayout['type']
    targetRowHeight?: ResponsiveParameter<number>
    columns?: ResponsiveParameter<number>
    spacing?: ResponsiveParameter<number>
    padding?: ResponsiveParameter<number>
    defaultContainerWidth?: number
    breakpoints?: readonly number[]
    sizes?: {
      size: string
      sizes?: Array<{ viewport: string; size: string }>
    }
    imageAdapter?: ImageAdapter
    lightbox?: boolean | Component
    transition?: LightboxTransitionOption
    itemClass?: string
    imgClass?: string
  }>(),
  {
    layout: 'rows',
    spacing: 8,
    padding: 0,
    lightbox: true,
  },
)

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
    default:
      devWarn(`Unknown layout type "${raw}", falling back to "rows"`)
      return { type: 'rows', targetRowHeight: props.targetRowHeight }
  }
})

if (props.defaultContainerWidth === 0) {
  devWarn(
    'defaultContainerWidth=0 has no effect; omit it or use a positive value',
  )
}

const photos = computed<PhotoItem[]>(() =>
  resolveRecipePhotos(props.photos, props.itemMapper, 'PhotoAlbum'),
)

const parentGroup = inject(PhotoGroupContextKey, null)
const parentAutoGroup = computed(() =>
  parentGroup?.mode.value === 'auto' && parentGroup.lightboxEnabled.value
    ? parentGroup
    : null,
)
const injectedLightbox = inject(LightboxComponentKey, null)

const hasLightbox = computed(
  () =>
    props.lightbox !== false && (parentGroup?.lightboxEnabled.value ?? true),
)

const layoutType = computed(() => normalizedLayout.value.type)
const layoutColumns = computed(() => {
  const layout = normalizedLayout.value
  if (layout.type === 'columns' || layout.type === 'masonry') {
    return layout.columns ?? 3
  }
  return 3
})
const layoutTargetRowHeight = computed(() => {
  const layout = normalizedLayout.value
  return layout.type === 'rows' ? (layout.targetRowHeight ?? 300) : 300
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
  containerStyle,
  containerQueryCSS,
  containerQueriesActive,
  groups,
  rowItems,
  ssrWrapperStyle,
  ssrItemStyle,
  groupStyle,
  itemStyle,
  maybeWarnApproximate,
} = usePhotoAlbumLayoutState({
  photos,
  layout: layoutType,
  columns: layoutColumns,
  spacing: computed(() => props.spacing),
  padding: computed(() => props.padding),
  targetRowHeight: layoutTargetRowHeight,
  defaultContainerWidth: props.defaultContainerWidth,
  breakpoints: effectiveBreakpoints,
  sizes: props.sizes,
  interactive: hasLightbox,
})

maybeWarnApproximate()

const renderBranch = computed(() => {
  if (layoutType.value === 'rows') {
    return {
      kind: 'rows' as const,
      containerQueryCss: containerQueryCSS.value,
      wrapperStyle: ssrWrapperStyle.value,
      items: rowItems.value,
      containerQueriesActive: containerQueriesActive.value,
    }
  }

  if (isMounted.value || groups.value.length > 0) {
    return {
      kind: 'measured' as const,
      groups: groups.value,
    }
  }

  return {
    kind: 'fallback-grid' as const,
    wrapperStyle: ssrWrapperStyle.value,
    photos: photos.value,
  }
})

const hasOwnLightbox =
  !parentAutoGroup.value &&
  props.lightbox !== false &&
  (parentGroup?.lightboxEnabled.value ?? true)
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? Lightbox
  return props.lightbox as Component
})

const ownCtx = hasOwnLightbox
  ? useLightboxProvider(photos, {
      transition: props.transition,
      imageAdapter: props.imageAdapter,
    })
  : null

const thumbElsMap: Record<number, HTMLElement | null> = {}

function setItemRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    thumbElsMap[index] = el as HTMLElement | null
  }
}

function syncOwnThumbRefs() {
  if (!ownCtx) return
  for (const [index, element] of Object.entries(thumbElsMap)) {
    ownCtx.setThumbRef(Number(index))(element)
  }
}

function openPhoto(photo: PhotoItem, index: number) {
  if (parentAutoGroup.value) {
    void parentAutoGroup.value.openPhoto(photo)
    return
  }

  if (!ownCtx) return
  syncOwnThumbRefs()
  void ownCtx.open(index)
}

function handleItemKeydown(
  event: KeyboardEvent,
  photo: PhotoItem,
  index: number,
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
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
    onKeydown: (event: KeyboardEvent) => handleItemKeydown(event, photo, index),
  }
}

function isHidden(photo: PhotoItem): boolean {
  if (parentAutoGroup.value) {
    return parentAutoGroup.value.hiddenPhoto.value === photo
  }
  if (ownCtx) {
    const index = ownCtx.hiddenThumbIndex.value
    if (index === null) return false
    return photos.value[index] === photo
  }
  return false
}

let registrationIds: symbol[] = []

if (parentAutoGroup.value) {
  function syncRegistrations(nextPhotos: PhotoItem[]) {
    for (const symbol of registrationIds) {
      parentAutoGroup.value?.unregister(symbol)
    }

    registrationIds = nextPhotos.map((photo, index) => {
      const symbol = Symbol(photoId(photo))
      parentAutoGroup.value?.register(
        symbol,
        photo,
        () => thumbElsMap[index] ?? null,
        null,
      )
      return symbol
    })
  }

  watch(
    photos,
    (nextPhotos) => {
      syncRegistrations(nextPhotos)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    for (const symbol of registrationIds) {
      parentAutoGroup.value?.unregister(symbol)
    }
    registrationIds = []
  })
}
</script>
