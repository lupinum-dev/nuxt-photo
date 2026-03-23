<!-- Standalone image component with optional caption handling and a local or grouped lightbox. -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref, watch } from 'vue'
import type {
  CaptionVisibilityMode,
  ImageConfig,
  LightboxConfig,
  LightboxControlsSlotProps,
  LightboxImageItem,
  PhotoItem,
} from '../../types'
import { getInitialPointerPos } from '../../utils/pointer'
import { buildImageProps } from '../../utils/imageProps'
import { useLightboxConfig } from '../composables/useLightboxConfig'
import { usePhotoGroup } from '../composables/usePhotoGroup'
import NuxtPhotoLightbox from './NuxtPhotoLightbox.vue'

interface PhotoImgProps {
  src: string
  alt?: string
  width: number
  height: number
  thumbnailSrc?: string
  caption?: string
  description?: string
  captionVisible?: CaptionVisibilityMode
  lightbox?: LightboxConfig
  group?: string
  image?: ImageConfig
  imageClass?: HTMLAttributes['class']
  captionClass?: HTMLAttributes['class']
  descriptionClass?: HTMLAttributes['class']
}

const props = withDefaults(
  defineProps<PhotoImgProps>(),
  {
    alt: '',
    captionVisible: undefined,
    description: undefined,
    lightbox: true,
    group: undefined,
  },
)

defineSlots<{
  caption?: (props: { caption?: string, description?: string }) => unknown
  controls?: (props: LightboxControlsSlotProps) => unknown
}>()

const lightboxRef = ref<InstanceType<typeof NuxtPhotoLightbox> | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const { lightboxEnabled, lightboxOptions } = useLightboxConfig(() => props.lightbox)

const resolvedCaptionVisible = computed<CaptionVisibilityMode>(() => {
  if (props.captionVisible) {
    return props.captionVisible
  }

  return props.caption || props.description ? 'both' : 'none'
})

const showCaptionBelow = computed(() =>
  ['below', 'both'].includes(resolvedCaptionVisible.value),
)

const showCaptionInLightbox = computed(() =>
  ['lightbox', 'both'].includes(resolvedCaptionVisible.value),
)

const item = computed<PhotoItem>(() => ({
  alt: props.alt,
  caption: showCaptionInLightbox.value ? props.caption : undefined,
  description: showCaptionInLightbox.value ? props.description : undefined,
  height: props.height,
  href: undefined,
  src: props.src,
  thumbnailSrc: props.thumbnailSrc,
  width: props.width,
}))

const lightboxItem = computed<LightboxImageItem>(() => ({
  ...item.value,
  id: item.value.key ?? item.value.src,
  msrc: item.value.thumbnailSrc ?? item.value.src,
  type: 'image',
}))

const standaloneLightboxItems = computed(() => [lightboxItem.value])

const groupState = props.group
  ? usePhotoGroup(props.group, lightboxItem, triggerRef)
  : null

const imageProps = computed(() => ({
  ...buildImageProps(
    {
      ...item.value,
      thumbnailSrc: props.thumbnailSrc ?? props.src,
    },
    props.image,
  ),
  class: ['photo-img__image', props.imageClass],
  style: {
    display: 'block',
    height: 'auto',
    width: '100%',
  },
}))

function openStandalone(event: MouseEvent) {
  return lightboxRef.value?.open(
    0,
    lightboxOptions.value,
    triggerRef.value,
    getInitialPointerPos(event),
  )
}

function getGroupThumbnailElement(index: number) {
  return groupState?.getThumbnailElement(index) ?? null
}

function getStandaloneThumbnailElement() {
  return triggerRef.value
}

function handleClick(event: MouseEvent) {
  if (!lightboxEnabled.value) {
    return
  }

  if (groupState) {
    groupState.open(lightboxOptions.value, triggerRef.value, getInitialPointerPos(event))
    return
  }

  openStandalone(event)
}

watch(
  () => groupState?.isHost.value,
  (isHost) => {
    if (!groupState || !isHost) {
      return
    }

    groupState.registerController({
      close: () => lightboxRef.value?.close(),
      open: (index, options, sourceElement, initialPointerPos) =>
        lightboxRef.value?.open(index, options, sourceElement, initialPointerPos) ?? false,
    })
  },
  { immediate: true },
)
</script>

<template>
  <figure
    class="photo-img"
    :class="{ 'photo-img--interactive': lightboxEnabled }"
    data-slot="photo-img"
  >
    <component
      :is="lightboxEnabled ? 'button' : 'div'"
      ref="triggerRef"
      class="photo-img__trigger"
      :type="lightboxEnabled ? 'button' : undefined"
      :aria-label="lightboxEnabled ? `Open image${alt ? `: ${alt}` : ''}` : undefined"
      data-slot="photo-trigger"
      @click="lightboxEnabled ? handleClick($event as MouseEvent) : undefined"
    >
      <PhotoImage v-bind="imageProps" />
    </component>

    <figcaption
      v-if="showCaptionBelow && (caption || alt || description)"
      class="photo-img__caption"
      :class="captionClass"
      data-slot="photo-caption"
    >
      <slot
        name="caption"
        :caption="caption"
        :description="description"
      >
        <span
          class="photo-img__caption-title"
          data-slot="photo-caption-title"
        >
          {{ caption || alt }}
        </span>
        <span
          v-if="description"
          class="photo-img__caption-description"
          :class="descriptionClass"
          data-slot="photo-caption-description"
        >
          {{ description }}
        </span>
      </slot>
    </figcaption>

    <NuxtPhotoLightbox
      v-if="lightboxEnabled && (!groupState || groupState.isHost.value)"
      ref="lightboxRef"
      :items="groupState ? groupState.items.value : standaloneLightboxItems"
      :options="lightboxOptions"
      :image="image"
      :get-thumbnail-element="groupState ? getGroupThumbnailElement : getStandaloneThumbnailElement"
      teleport-to="body"
    >
      <template #controls="controlProps">
        <slot
          name="controls"
          v-bind="controlProps"
        />
      </template>
    </NuxtPhotoLightbox>
  </figure>
</template>
