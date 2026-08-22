<template>
  <div
    ref="containerRef"
    v-bind="$attrs"
    class="np-album"
    :class="[scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <template v-if="renderBranch.kind === 'rows'">
      <template v-if="renderBranch.containerQueryCss">
        <component :is="'style'" v-bind="{ innerHTML: renderBranch.containerQueryCss }" />
      </template>

      <div :style="renderBranch.wrapperStyle">
        <component
          v-for="item in renderBranch.items"
          :key="item.photo.id"
          :is="isPhotoInteractive(metadataPhoto(item.photo)) ? 'button' : 'div'"
          class="np-album__item"
          :class="[
            renderBranch.containerQueriesActive ? `np-item-${item.index}` : undefined,
            itemClass,
          ]"
          :style="item.style"
          v-bind="itemBindings(metadataPhoto(item.photo), item.index)"
        >
          <AlbumThumbnail
            :photo="metadataPhoto(item.photo)"
            :index="item.index"
            :width="item.width"
            :height="item.height"
            :hidden="isHidden(metadataPhoto(item.photo))"
            :image-adapter="imageAdapter"
            :img-class="imgClass"
            :sizes="item.computedSizes"
          >
            <template v-if="$slots.thumbnail" #thumbnail="slotProps">
              <slot name="thumbnail" v-bind="slotProps" />
            </template>
          </AlbumThumbnail>
        </component>

        <span
          style="flex-grow: 9999; flex-basis: 0; height: 0; margin: 0; padding: 0"
          aria-hidden="true"
        />
      </div>
    </template>

    <template v-else-if="renderBranch.kind === 'measured'">
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
          <component
            v-for="entry in group.entries"
            :key="entry.photo.id"
            :is="isPhotoInteractive(metadataPhoto(entry.photo)) ? 'button' : 'div'"
            class="np-album__item"
            :class="itemClass"
            :style="itemStyle(entry, group)"
            v-bind="itemBindings(metadataPhoto(entry.photo), entry.index)"
          >
            <AlbumThumbnail
              :photo="metadataPhoto(entry.photo)"
              :index="entry.index"
              :width="entry.width"
              :height="entry.height"
              :hidden="isHidden(metadataPhoto(entry.photo))"
              :image-adapter="imageAdapter"
              :img-class="imgClass"
            >
              <template v-if="$slots.thumbnail" #thumbnail="slotProps">
                <slot name="thumbnail" v-bind="slotProps" />
              </template>
            </AlbumThumbnail>
          </component>
        </div>
      </template>
    </template>

    <div v-else :style="renderBranch.wrapperStyle">
      <component
        v-for="(photo, index) in renderBranch.photos"
        :key="photo.id"
        :is="isPhotoInteractive(photo) ? 'button' : 'div'"
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
      </component>
    </div>
  </div>

  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import {
  mergeResponsiveBreakpoints,
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  type AlbumLayout,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
  type ResponsiveParameter,
  type InvalidPhotoPolicy,
  type InvalidPhotosEvent,
  type ResponsivePhotoSizes,
} from '../core/index'
import AlbumThumbnail from './photo-album/AlbumThumbnail.vue'
import { usePhotoAlbumLayoutState } from './photo-album/layoutState'
import { resolveRecipePhotos } from '../core/photo/resolve'
import { devWarn } from '../core/env'
import { useAlbumLightbox } from './photo-album/lightbox'

defineOptions({ inheritAttrs: false })

defineSlots<{
  thumbnail?: (props: {
    photo: PhotoItem<TMeta>
    index: number
    width: number
    height: number
    hidden: boolean
  }) => unknown
}>()

const props = withDefaults(
  defineProps<{
    photos: readonly PhotoItem<TMeta>[]
    validation?: InvalidPhotoPolicy
    layout?: AlbumLayout | AlbumLayout['type']
    spacing?: ResponsiveParameter<number>
    padding?: ResponsiveParameter<number>
    defaultContainerWidth?: number
    breakpoints?: readonly number[]
    sizes?: string | ResponsivePhotoSizes
    imageAdapter?: ImageAdapter<TMeta>
    lightbox?: boolean | Component
    transition?: LightboxTransitionOption
    itemClass?: string
    imgClass?: string
  }>(),
  {
    layout: 'rows',
    spacing: DEFAULT_SPACING,
    padding: DEFAULT_PADDING,
    lightbox: true,
  },
)

const emit = defineEmits<{
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const normalizedLayout = computed<AlbumLayout>(() => {
  const raw = props.layout
  if (typeof raw === 'object') return raw

  switch (raw) {
    case 'rows':
      return { type: 'rows' }
    case 'columns':
      return { type: 'columns' }
    case 'masonry':
      return { type: 'masonry' }
    default:
      devWarn(`Unknown layout type "${raw}", falling back to "rows"`)
      return { type: 'rows' }
  }
})

function metadataPhoto(photo: PhotoItem): PhotoItem<TMeta> {
  return photo as PhotoItem<TMeta>
}

if (props.defaultContainerWidth === 0) {
  devWarn('defaultContainerWidth=0 has no effect; omit it or use a positive value')
}

const resolution = computed(() =>
  resolveRecipePhotos<TMeta>(props.photos, 'PhotoAlbum', {
    validation: props.validation,
  }),
)
const normalizedPhotos = computed<PhotoItem<TMeta>[]>(() => resolution.value.photos)
const reportingReady = ref(false)

onMounted(() => {
  reportingReady.value = true
})

watch(
  [() => resolution.value.invalidPhotos, reportingReady],
  ([event, ready]) => {
    if (ready && event) emit('invalidPhotos', event)
  },
  { flush: 'post' },
)

const {
  hasLightbox,
  hasOwnLightbox,
  LightboxComponent,
  itemBindings,
  isPhotoInteractive,
  isHidden,
  open,
  openById,
  close,
  isOpen,
} = useAlbumLightbox(normalizedPhotos, props)

const layoutType = computed(() => normalizedLayout.value.type)
const layoutColumns = computed(() => {
  const layout = normalizedLayout.value
  if (layout.type === 'columns' || layout.type === 'masonry') {
    return layout.columns ?? DEFAULT_COLUMNS
  }
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
  isMounted,
  scopeClass,
  containerStyle,
  containerQueryCSS,
  containerQueriesRender,
  containerQueriesActive,
  groups,
  rowItems,
  ssrWrapperStyle,
  ssrItemStyle,
  groupStyle,
  itemStyle,
  maybeWarnApproximate,
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
    photos: normalizedPhotos.value,
  }
})

defineExpose({ open, openById, close, isOpen })
</script>
