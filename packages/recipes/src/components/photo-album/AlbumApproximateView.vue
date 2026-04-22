<template>
  <div :style="ssrWrapperStyle">
    <div
      v-for="(photo, index) in photos"
      :key="photoId(photo)"
      class="np-album__item"
      :class="itemClass"
      :style="ssrItemStyle(photo)"
      v-bind="itemBindings(photo, index)"
    >
      <AlbumItemContent
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
      </AlbumItemContent>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import AlbumItemContent from './AlbumItemContent.vue'

defineProps<{
  photos: PhotoItem[]
  ssrWrapperStyle: CSSProperties
  itemClass?: string
  imgClass?: string
  imageAdapter?: ImageAdapter
  itemBindings: (photo: PhotoItem, index: number) => Record<string, unknown>
  ssrItemStyle: (photo: PhotoItem) => CSSProperties
  photoId: (photo: PhotoItem) => string
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
