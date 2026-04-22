<template>
  <template v-if="containerQueryCss">
    <component :is="'style'">{{ containerQueryCss }}</component>
  </template>

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
        <AlbumItemContent
          :photo="entry.photo"
          :index="entry.index"
          :width="entry.width"
          :height="entry.height"
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
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type {
  ImageAdapter,
  LayoutEntry,
  LayoutGroup,
  PhotoItem,
} from '@nuxt-photo/core'
import type { BreakpointSnapshot } from '../../composables/usePhotoLayout'
import AlbumItemContent from './AlbumItemContent.vue'

defineProps<{
  containerQueryCss: string
  breakpointSnapshots: BreakpointSnapshot[]
  snapshotClass: string
  itemClass?: string
  imgClass?: string
  imageAdapter?: ImageAdapter
  itemBindings: (photo: PhotoItem, index: number) => Record<string, unknown>
  snapshotWrapperStyle: (
    snap: BreakpointSnapshot,
    multiSpan: boolean,
  ) => CSSProperties
  snapshotGroupStyle: (
    group: LayoutGroup,
    snap: BreakpointSnapshot,
  ) => CSSProperties
  snapshotItemStyle: (
    entry: LayoutEntry,
    group: LayoutGroup,
    snap: BreakpointSnapshot,
  ) => CSSProperties
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
