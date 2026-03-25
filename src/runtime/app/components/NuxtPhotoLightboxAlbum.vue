<!-- Convenience wrapper that pairs album layouts with the shared lightbox runtime. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type {
  LightboxControlsSlotProps,
  LightboxImageItem,
  PhotoLightboxAlbumEmits,
  PhotoLightboxAlbumProps,
  PhotoLightboxSlotContext,
} from '../../types'
import { getInitialPointerPos } from '../../utils/pointer'
import { useLightboxConfig } from '../composables/useLightboxConfig'
import NuxtPhotoAlbum from './NuxtPhotoAlbum.vue'
import NuxtPhotoAlbumPhoto from './NuxtPhotoAlbumPhoto.vue'
import NuxtPhotoLightbox from './NuxtPhotoLightbox.vue'

const props = withDefaults(defineProps<PhotoLightboxAlbumProps>(), {
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

const emit = defineEmits<PhotoLightboxAlbumEmits>()

defineSlots<{
  photo?: (context: PhotoLightboxSlotContext) => unknown
  controls?: (props: LightboxControlsSlotProps) => unknown
}>()

const lightboxRef = ref<InstanceType<typeof NuxtPhotoLightbox> | null>(null)
const thumbnailElements = new Map<number, HTMLElement>()
const activeLightboxIndex = ref<number | null>(null)
const isLightboxOpen = ref(false)

const { lightboxEnabled, lightboxOptions } = useLightboxConfig(() => props.lightbox)

const lightboxItems = computed<LightboxImageItem[]>(() =>
  props.items
    .filter(
      item =>
        Number.isFinite(item.width)
        && Number.isFinite(item.height)
        && item.width > 0
        && item.height > 0,
    )
    .map(item => ({
      ...item,
      id: item.key ?? item.src,
      msrc: item.thumbnailSrc ?? item.src,
      type: 'image',
    })),
)

function resolveThumbnailElement(target: Element | ComponentPublicInstance | null): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target
  }

  const element = target && '$el' in target ? target.$el : null
  return element instanceof HTMLElement ? element : null
}

function bindThumbnail(index: number) {
  return (target: Element | ComponentPublicInstance | null) => {
    const element = resolveThumbnailElement(target)
    if (element) {
      thumbnailElements.set(index, element)
      return
    }

    thumbnailElements.delete(index)
  }
}

function getThumbnailElement(index: number) {
  return thumbnailElements.get(index) ?? null
}

function closeLightbox() {
  lightboxRef.value?.close()
}

async function openAtIndex(index: number, event?: MouseEvent) {
  if (!lightboxEnabled.value) {
    return
  }

  const sourceElement = getThumbnailElement(index)
    ?? (event?.currentTarget instanceof HTMLElement ? event.currentTarget : null)

  const opened = lightboxRef.value?.open(
    index,
    lightboxOptions.value,
    sourceElement,
    getInitialPointerPos(event),
  )

  if (opened !== false) {
    activeLightboxIndex.value = index
  }

  return opened
}

function createSlotContext(context: Omit<PhotoLightboxSlotContext, 'selected' | 'open'>): PhotoLightboxSlotContext {
  return {
    ...context,
    open: (event?: MouseEvent) => openAtIndex(context.index, event),
    selected: isLightboxOpen.value && activeLightboxIndex.value === context.index,
  }
}

async function handlePhotoClick(context: PhotoLightboxSlotContext, event: MouseEvent) {
  emit('click', {
    index: context.index,
    item: context.item,
    layout: context.layout,
  })

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
  <div data-slot="lightbox-album">
    <NuxtPhotoAlbum
      :items="items"
      :layout="layout"
      :columns="columns"
      :spacing="spacing"
      :padding="padding"
      :target-row-height="targetRowHeight"
      :row-constraints="rowConstraints"
      :container-width="containerWidth"
      :default-container-width="defaultContainerWidth"
      :image="image"
      :photo-class="photoClass"
      :image-class="imageClass"
    >
      <template #photo="slotContext">
        <slot
          v-if="$slots.photo"
          name="photo"
          v-bind="createSlotContext(slotContext)"
        />
        <NuxtPhotoAlbumPhoto
          v-else
          :ref="bindThumbnail(slotContext.index)"
          :image-props="slotContext.imageProps"
          :interactive="lightboxEnabled"
          :item="slotContext.item"
          :layout="slotContext.layout"
          :layout-options="slotContext.layoutOptions"
          :photo-class="photoClass"
          :selected="isLightboxOpen && activeLightboxIndex === slotContext.index"
          @click="(event: MouseEvent) => handlePhotoClick(createSlotContext(slotContext), event)"
        />
      </template>
    </NuxtPhotoAlbum>

    <NuxtPhotoLightbox
      v-if="lightboxEnabled"
      ref="lightboxRef"
      :items="lightboxItems"
      :options="lightboxOptions"
      :image="image"
      :get-thumbnail-element="getThumbnailElement"
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
