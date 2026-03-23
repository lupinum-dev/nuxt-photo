<!-- Custom-thumbnail gallery component backed by the shared headless lightbox runtime. -->
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type {
  ImageConfig,
  LightboxControlsSlotProps,
  LightboxItem,
  LightboxOptions,
} from '../../types'
import { specialKeyUsed } from '../../lightbox/utils/dom'
import { getInitialPointerPos } from '../../utils/pointer'
import NuxtPhotoLightbox from './NuxtPhotoLightbox.vue'

interface PhotoGalleryProps {
  items: readonly LightboxItem[]
  options?: LightboxOptions
  image?: ImageConfig
  teleportTo?: string | HTMLElement
}

const props = withDefaults(defineProps<PhotoGalleryProps>(), {
  teleportTo: 'body',
})

const emit = defineEmits<{
  open: []
  close: []
  change: [index: number]
  destroy: []
}>()

defineSlots<{
  thumbnail?: (props: {
    item: LightboxItem
    index: number
    open: (event?: MouseEvent) => void
    bindThumbnail: (target: Element | ComponentPublicInstance | null) => void
  }) => unknown
  controls?: (props: LightboxControlsSlotProps) => unknown
  slide?: (props: {
    item: LightboxItem
    index: number
    slide: unknown
    isActive: boolean
  }) => unknown
}>()

const thumbnailElements = new Map<number, HTMLElement>()
const lightboxRef = ref<InstanceType<typeof NuxtPhotoLightbox>>()

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

function getThumbnailElement(index: number): HTMLElement | null | undefined {
  return thumbnailElements.get(index)
}

function open(index: number, event?: MouseEvent): void {
  if (event && specialKeyUsed(event)) {
    return
  }

  event?.preventDefault()

  const sourceElement = getThumbnailElement(index)
    ?? (event?.currentTarget instanceof HTMLElement ? event.currentTarget : null)

  lightboxRef.value?.open(
    index,
    props.options,
    sourceElement,
    getInitialPointerPos(event),
  )
}

onBeforeUnmount(() => {
  lightboxRef.value?.close()
})

defineExpose({
  open,
  close: () => lightboxRef.value?.close(),
  controller: lightboxRef,
})
</script>

<template>
  <template
    v-for="(item, index) in items"
    :key="item.id ?? index"
  >
    <slot
      name="thumbnail"
      :item="item"
      :index="index"
      :open="(event?: MouseEvent) => open(index, event)"
      :bind-thumbnail="bindThumbnail(index)"
    />
  </template>

  <NuxtPhotoLightbox
    ref="lightboxRef"
    :items="items"
    :options="options"
    :image="image"
    :teleport-to="teleportTo"
    :get-thumbnail-element="(index) => getThumbnailElement(index)"
    @open="emit('open')"
    @close="emit('close')"
    @change="idx => emit('change', idx)"
    @destroy="emit('destroy')"
  >
    <template #controls="controlProps">
      <slot
        name="controls"
        v-bind="controlProps"
      />
    </template>
    <template #slide="slotProps">
      <slot
        name="slide"
        v-bind="slotProps"
      />
    </template>
  </NuxtPhotoLightbox>
</template>
