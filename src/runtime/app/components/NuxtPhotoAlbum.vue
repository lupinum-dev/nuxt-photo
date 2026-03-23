<!-- Layout-driven album component that combines album rendering with an optional local lightbox. -->
<script setup lang="ts">
import type {
  LightboxControlsSlotProps,
  LightboxImageItem,
  PhotoAlbumEmits,
  PhotoAlbumProps,
  PhotoSlotContext,
} from '../../types'
import { computed, ref, watch } from 'vue'
import { useLightboxConfig } from '../composables/useLightboxConfig'
import { usePhotoAlbumLayout } from '../composables/usePhotoAlbumLayout'
import { getInitialPointerPos } from '../../utils/pointer'
import NuxtPhotoAlbumPhoto from './NuxtPhotoAlbumPhoto.vue'
import NuxtPhotoLightbox from './NuxtPhotoLightbox.vue'

const props = withDefaults(defineProps<PhotoAlbumProps>(), {
  defaultContainerWidth: 1024,
  layout: 'masonry',
  lightbox: true,
  lightboxIndex: null,
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
  controls?: (props: LightboxControlsSlotProps) => unknown
}>()

const lightboxRef = ref<InstanceType<typeof NuxtPhotoLightbox> | null>(null)
const activeLightboxIndex = ref<number | null>(null)
const isLightboxOpen = ref(false)

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

const { lightboxEnabled, lightboxOptions } = useLightboxConfig(() => props.lightbox)

const items = computed(() =>
  props.items.filter(
    item =>
      Number.isFinite(item.width)
      && Number.isFinite(item.height)
      && item.width > 0
      && item.height > 0,
  ),
)

const lightboxItems = computed<LightboxImageItem[]>(() =>
  items.value.map(item => ({
    ...item,
    id: item.key ?? item.src,
    msrc: item.thumbnailSrc ?? item.src,
    type: 'image',
  })),
)

function closeLightbox() {
  lightboxRef.value?.close()
}

async function openAtIndex(index: number, event?: MouseEvent) {
  if (!lightboxEnabled.value) {
    return
  }

  const opened = lightboxRef.value?.open(
    index,
    lightboxOptions.value,
    event?.currentTarget instanceof HTMLElement ? event.currentTarget : null,
    getInitialPointerPos(event),
  )

  if (opened !== false) {
    activeLightboxIndex.value = index
  }

  return opened
}

function createSlotContext(
  entry: { item: typeof props.items[number], index: number, layout: PhotoSlotContext['layout'], imageProps: PhotoSlotContext['imageProps'] },
): PhotoSlotContext {
  const selected = isLightboxOpen.value && activeLightboxIndex.value === entry.index

  return {
    imageProps: entry.imageProps,
    index: entry.index,
    item: entry.item,
    layout: entry.layout,
    open: (event?: MouseEvent) => openAtIndex(entry.index, event),
    selected,
  }
}

const className = computed(() => ['photo-album', `photo-album--${props.layout}`])

async function handlePhotoClick(context: PhotoSlotContext, event: MouseEvent) {
  const payload = {
    index: context.index,
    item: context.item,
    layout: context.layout,
  } as const

  emit('click', payload)

  if (!lightboxEnabled.value) {
    return
  }

  const opened = await context.open(event)
  if (opened === false) {
    return
  }

  emit('update:lightbox-index', context.index)
  emit('lightbox-open', { item: context.item, index: context.index })
}

function handleLightboxOpen() {
  isLightboxOpen.value = true
}

function handleLightboxClose() {
  isLightboxOpen.value = false
  activeLightboxIndex.value = null
}

function handleLightboxChange(index: number) {
  activeLightboxIndex.value = index
}

watch(
  () => props.lightboxIndex,
  (nextValue: number | null | undefined) => {
    if (!lightboxEnabled.value) {
      return
    }

    if (nextValue === null) {
      if (isLightboxOpen.value) {
        closeLightbox()
      }
      return
    }

    if (!Number.isInteger(nextValue)) {
      return
    }

    if (
      isLightboxOpen.value
      && activeLightboxIndex.value === nextValue
    ) {
      return
    }

    void openAtIndex(nextValue as number)
  },
  { immediate: true },
)

watch(
  [isLightboxOpen, activeLightboxIndex],
  ([nextIsOpen, nextIndex]: [boolean, number | null]) => {
    if (!nextIsOpen) {
      emit('update:lightbox-index', null)
      emit('lightbox-close')
      return
    }

    emit('update:lightbox-index', nextIndex ?? 0)
  },
)
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
              :interactive="lightboxEnabled"
              :item="entry.item"
              :layout="entry.layout"
              :layout-options="definedLayoutOptions"
              :photo-class="photoClass"
              :selected="isLightboxOpen && activeLightboxIndex === entry.index"
              @click="(event: MouseEvent) => handlePhotoClick(createSlotContext(entry), event)"
            />
          </slot>
        </template>
      </div>
    </div>

    <NuxtPhotoLightbox
      v-if="lightboxEnabled"
      ref="lightboxRef"
      :items="lightboxItems"
      :options="lightboxOptions"
      :image="image"
      teleport-to="body"
      @open="handleLightboxOpen"
      @close="handleLightboxClose"
      @change="handleLightboxChange"
    >
      <template #controls="controlProps">
        <slot
          name="controls"
          v-bind="controlProps"
        />
      </template>
    </NuxtPhotoLightbox>
  </div>
</template>
