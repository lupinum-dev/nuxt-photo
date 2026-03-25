<!-- Layout-driven album component focused on rendering and click interactions only. -->
<script setup lang="ts">
import type {
  PhotoAlbumEmits,
  PhotoAlbumProps,
  PhotoSlotContext,
} from '../../types'
import { computed } from 'vue'
import { usePhotoAlbumLayout } from '../composables/usePhotoAlbumLayout'
import NuxtPhotoAlbumPhoto from './NuxtPhotoAlbumPhoto.vue'

const props = withDefaults(defineProps<PhotoAlbumProps>(), {
  defaultContainerWidth: 1024,
  layout: 'masonry',
  columns: undefined,
  spacing: undefined,
  padding: undefined,
  targetRowHeight: undefined,
  rowConstraints: undefined,
  photoClass: undefined,
  imageClass: undefined,
})

const emit = defineEmits<PhotoAlbumEmits>()

defineSlots<{
  photo?: (context: PhotoSlotContext) => unknown
}>()

const {
  measureRef,
  shouldMeasure,
  layoutOptions,
  groups,
  containerStyle,
  groupStyle,
} = usePhotoAlbumLayout({
  items: () => props.items,
  layout: () => props.layout,
  columns: () => props.columns,
  spacing: () => props.spacing,
  padding: () => props.padding,
  targetRowHeight: () => props.targetRowHeight,
  rowConstraints: () => props.rowConstraints,
  containerWidth: () => props.containerWidth,
  defaultContainerWidth: () => props.defaultContainerWidth,
  image: () => props.image,
  imageClass: () => props.imageClass,
})

const definedLayoutOptions = computed(() => layoutOptions.value as NonNullable<typeof layoutOptions.value>)
const className = computed(() => ['photo-album', `photo-album--${props.layout}`])

function createSlotContext(
  entry: {
    item: typeof props.items[number]
    index: number
    layout: PhotoSlotContext['layout']
    imageProps: PhotoSlotContext['imageProps']
  },
): PhotoSlotContext {
  return {
    imageProps: entry.imageProps,
    index: entry.index,
    item: entry.item,
    layout: entry.layout,
    layoutOptions: definedLayoutOptions.value,
  }
}

function handlePhotoClick(context: PhotoSlotContext) {
  emit('click', {
    index: context.index,
    item: context.item,
    layout: context.layout,
  })
}
</script>

<template>
  <div
    class="photo-album__root relative w-full"
    data-slot="album"
  >
    <div
      v-if="shouldMeasure"
      ref="measureRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-0 opacity-0"
    />

    <div
      :class="className"
      :style="containerStyle"
    >
      <div
        v-for="group in groups"
        :key="`${group.type}-${group.index}`"
        :class="group.type === 'row' ? 'photo-album__row' : 'photo-album__column'"
        :data-slot="group.type === 'row' ? 'album-row' : 'album-column'"
        :style="groupStyle(group)"
      >
        <template
          v-for="entry in group.entries"
          :key="entry.item.key ?? `${entry.item.src}-${entry.index}`"
        >
          <slot
            name="photo"
            v-bind="createSlotContext(entry)"
          >
            <NuxtPhotoAlbumPhoto
              :image-props="entry.imageProps"
              :interactive="true"
              :item="entry.item"
              :layout="entry.layout"
              :layout-options="definedLayoutOptions"
              :photo-class="photoClass"
              :selected="false"
              @click="handlePhotoClick(createSlotContext(entry))"
            />
          </slot>
        </template>
      </div>
    </div>
  </div>
</template>
