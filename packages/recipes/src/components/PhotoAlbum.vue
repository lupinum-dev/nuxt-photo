<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="[scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <AlbumRowsView
      v-if="layoutType === 'rows'"
      :container-query-css="containerQueryCSS"
      :ssr-wrapper-style="ssrWrapperStyle"
      :row-items="rowItems"
      :container-queries-active="containerQueriesActive"
      :item-class="itemClass"
      :img-class="imgClass"
      :image-adapter="imageAdapter"
      :item-bindings="itemBindings"
      :is-hidden="isHidden"
      :photo-id="photoId"
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </AlbumRowsView>

    <AlbumSnapshotsView
      v-else-if="!isMounted && breakpointSnapshots.length > 0"
      :container-query-css="containerQueryCSS"
      :breakpoint-snapshots="breakpointSnapshots"
      :snapshot-class="snapshotClass"
      :item-class="itemClass"
      :img-class="imgClass"
      :image-adapter="imageAdapter"
      :item-bindings="itemBindings"
      :snapshot-wrapper-style="snapshotWrapperStyle"
      :snapshot-group-style="snapshotGroupStyle"
      :snapshot-item-style="snapshotItemStyle"
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </AlbumSnapshotsView>

    <AlbumApproximateView
      v-else-if="!isMounted"
      :photos="photos"
      :ssr-wrapper-style="ssrWrapperStyle"
      :item-class="itemClass"
      :img-class="imgClass"
      :image-adapter="imageAdapter"
      :item-bindings="itemBindings"
      :ssr-item-style="ssrItemStyle"
      :photo-id="photoId"
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </AlbumApproximateView>

    <AlbumMountedView
      v-else
      :photos="photos"
      :groups="groups"
      :item-class="itemClass"
      :img-class="imgClass"
      :image-adapter="imageAdapter"
      :item-bindings="itemBindings"
      :is-hidden="isHidden"
      :group-style="groupStyle"
      :item-style="itemStyle"
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </AlbumMountedView>
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
import {
  LightboxComponentKey,
  PhotoGroupContextKey,
  type LightboxTransitionOption,
  useLightboxProvider,
} from '@nuxt-photo/vue'
import {
  devWarn,
  mergeResponsiveBreakpoints,
  photoId,
  type AlbumLayout,
  type ImageAdapter,
  type PhotoAdapter,
  type PhotoItem,
  type ResponsiveParameter,
} from '@nuxt-photo/core'
import Lightbox from './Lightbox.vue'
import AlbumApproximateView from './photo-album/AlbumApproximateView.vue'
import AlbumMountedView from './photo-album/AlbumMountedView.vue'
import AlbumRowsView from './photo-album/AlbumRowsView.vue'
import AlbumSnapshotsView from './photo-album/AlbumSnapshotsView.vue'
import { usePhotoLayout } from '../composables/usePhotoLayout'

const props = withDefaults(
  defineProps<{
    photos: PhotoItem[] | any[]
    itemAdapter?: PhotoAdapter
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
  props.itemAdapter
    ? props.photos.map(props.itemAdapter)
    : (props.photos as PhotoItem[]),
)

const hasLightbox = computed(() => props.lightbox !== false)

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

const parentGroup = inject(PhotoGroupContextKey, null)
const injectedLightbox = inject(LightboxComponentKey, null)

const hasOwnLightbox = !parentGroup && props.lightbox !== false
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? Lightbox
  return props.lightbox as Component
})

const ownCtx = !parentGroup
  ? useLightboxProvider(photos, { transition: props.transition })
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
  if (parentGroup) {
    void parentGroup.openPhoto(photo)
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
  if (parentGroup) return parentGroup.hiddenPhoto.value === photo
  if (ownCtx) {
    const index = ownCtx.hiddenThumbIndex.value
    if (index === null) return false
    return photos.value[index] === photo
  }
  return false
}

const idToSymbol = new Map<string, symbol>()
let registrationIds: symbol[] = []

if (parentGroup) {
  function syncRegistrations(nextPhotos: PhotoItem[]) {
    const newIds = new Set(nextPhotos.map(photoId))
    const oldIds = new Set(idToSymbol.keys())

    for (const pid of oldIds) {
      if (!newIds.has(pid)) {
        const symbol = idToSymbol.get(pid)!
        parentGroup.unregister(symbol)
        idToSymbol.delete(pid)
      }
    }

    registrationIds = nextPhotos.map((photo, index) => {
      const pid = photoId(photo)
      let symbol = idToSymbol.get(pid)
      if (!symbol) {
        symbol = Symbol()
        idToSymbol.set(pid, symbol)
        parentGroup.register(
          symbol,
          photo,
          () => thumbElsMap[index] ?? null,
          null,
        )
      }
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
      parentGroup.unregister(symbol)
    }
    idToSymbol.clear()
    registrationIds = []
  })
}
</script>
