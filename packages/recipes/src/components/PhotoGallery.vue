<template>
  <div class="np-gallery">
    <PhotoAlbum
      :photos="photos"
      :layout="layout"
      :columns="columns"
      :spacing="spacing"
      :padding="padding"
      :target-row-height="targetRowHeight"
      :bento-row-height="bentoRowHeight"
      :bento-sizing="bentoSizing"
      :bento-pattern-interval="bentoPatternInterval"
      :adapter="adapter"
    >
      <template #item="{ photo, index, width, height }">
        <div
          :ref="ctx.setThumbRef(index)"
          class="np-gallery__trigger"
          role="button"
          tabindex="0"
          :aria-label="photo.alt || `View photo ${index + 1}`"
          :style="{
            opacity: ctx.hiddenThumbIndex.value === index ? 0 : 1,
            cursor: 'pointer',
          }"
          @click="ctx.open(index)"
          @keydown.enter="ctx.open(index)"
          @keydown.space.prevent="ctx.open(index)"
        >
          <slot name="thumbnail" :photo="photo" :index="index" :width="width" :height="height">
            <PhotoImage
              :photo="photo"
              context="thumb"
              loading="lazy"
              :style="{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: '12px', aspectRatio: `${photo.width} / ${photo.height}` }"
            />
          </slot>
        </div>
      </template>
    </PhotoAlbum>

    <Lightbox :ctx="ctx">
      <template v-if="$slots.slide" #slide="slideProps">
        <slot name="slide" v-bind="slideProps" />
      </template>
      <template v-if="$slots.caption" #caption="captionProps">
        <slot name="caption" v-bind="captionProps" />
      </template>
      <template v-if="$slots.actions" #actions="actionsProps">
        <slot name="actions" v-bind="actionsProps" />
      </template>
    </Lightbox>
  </div>
</template>

<script setup lang="ts">
import { useLightbox, PhotoImage } from '@nuxt-photo/vue'
import type { PhotoItem, ImageAdapter, BentoSizing } from '@nuxt-photo/core'
import PhotoAlbum from './PhotoAlbum.vue'
import Lightbox from './Lightbox.vue'

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  columns?: number
  /** Gap between images in pixels @default 8 */
  spacing?: number
  /** Outer padding around each image in pixels @default 0 */
  padding?: number
  /** Target row height in pixels (rows layout only) @default 300 */
  targetRowHeight?: number
  /** Row height in pixels (bento layout only) @default 280 */
  bentoRowHeight?: number
  bentoSizing?: BentoSizing
  bentoPatternInterval?: number
  adapter?: ImageAdapter
}>(), {
  layout: 'rows',
  columns: 3,
  spacing: 8,
  padding: 0,
  targetRowHeight: 300,
  bentoRowHeight: 280,
  bentoSizing: 'auto',
  bentoPatternInterval: 5,
})

const ctx = useLightbox(props.photos)
</script>
