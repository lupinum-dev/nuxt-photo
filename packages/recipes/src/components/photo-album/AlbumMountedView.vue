<template>
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
        <AlbumItemContent
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
        </AlbumItemContent>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type {
  ImageAdapter,
  LayoutEntry,
  LayoutGroup,
  PhotoItem,
} from '@nuxt-photo/core'
import AlbumItemContent from './AlbumItemContent.vue'

defineProps<{
  photos: PhotoItem[]
  groups: LayoutGroup[]
  itemClass?: string
  imgClass?: string
  imageAdapter?: ImageAdapter
  itemBindings: (photo: PhotoItem, index: number) => Record<string, unknown>
  isHidden: (photo: PhotoItem) => boolean
  groupStyle: (group: LayoutGroup) => CSSProperties
  itemStyle: (entry: LayoutEntry, group: LayoutGroup) => CSSProperties
}>()

defineSlots<{
  thumbnail?: (props: {
    photo: PhotoItem
    index: number
    width: number
    height: number
    hidden: boolean
  }) => unknown
}>()
</script>
