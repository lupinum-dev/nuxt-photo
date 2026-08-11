<template>
  <div
    :style="hidden && !$slots.thumbnail ? { opacity: 0 } : undefined"
    style="width: 100%; height: 100%"
  >
    <slot
      v-if="$slots.thumbnail"
      name="thumbnail"
      :photo="photo"
      :index="index"
      :width="width"
      :height="height"
      :hidden="hidden"
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
      :sizes="sizes"
    />
  </div>
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { PhotoImage } from '../../primitives/index'
import type { ImageAdapter, PhotoItem } from '../../core/index'

defineProps<{
  photo: PhotoItem<TMeta>
  index: number
  width: number
  height: number
  hidden: boolean
  imageAdapter?: ImageAdapter<TMeta>
  imgClass?: string
  sizes?: string
}>()

defineSlots<{
  thumbnail?: (props: {
    photo: PhotoItem<TMeta>
    index: number
    width: number
    height: number
    hidden: boolean
  }) => unknown
}>()
</script>
