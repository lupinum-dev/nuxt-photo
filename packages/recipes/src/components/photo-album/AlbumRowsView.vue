<template>
  <template v-if="containerQueryCss">
    <component :is="'style'">{{ containerQueryCss }}</component>
  </template>

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
      <AlbumItemContent
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
      </AlbumItemContent>
    </div>

    <span
      style="flex-grow: 9999; flex-basis: 0; height: 0; margin: 0; padding: 0"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import type { RowItem } from '../../composables/usePhotoLayout'
import AlbumItemContent from './AlbumItemContent.vue'

defineProps<{
  containerQueryCss: string
  ssrWrapperStyle: CSSProperties
  rowItems: RowItem[]
  containerQueriesActive: boolean
  itemClass?: string
  imgClass?: string
  imageAdapter?: ImageAdapter
  itemBindings: (photo: PhotoItem, index: number) => Record<string, unknown>
  isHidden: (photo: PhotoItem) => boolean
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
