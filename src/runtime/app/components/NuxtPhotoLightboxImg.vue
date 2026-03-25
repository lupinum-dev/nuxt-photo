<!-- Convenience wrapper that pairs a standalone image thumbnail with the shared lightbox runtime. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  CaptionVisibilityMode,
  LightboxControlsSlotProps,
  LightboxImageItem,
  PhotoItem,
  PhotoLightboxImgProps,
} from '../../types'
import { getInitialPointerPos } from '../../utils/pointer'
import { useLightboxConfig } from '../composables/useLightboxConfig'
import { usePhotoGroup } from '../composables/usePhotoGroup'
import NuxtPhotoImg from './NuxtPhotoImg.vue'
import NuxtPhotoLightbox from './NuxtPhotoLightbox.vue'

const props = withDefaults(
  defineProps<PhotoLightboxImgProps>(),
  {
    alt: '',
    captionVisible: undefined,
    description: undefined,
    lightbox: true,
    group: undefined,
  },
)

const emit = defineEmits<{
  click: [MouseEvent]
  open: []
  close: []
  change: [index: number]
  destroy: []
}>()

defineSlots<{
  caption?: (props: { caption?: string, description?: string }) => unknown
  controls?: (props: LightboxControlsSlotProps) => unknown
}>()

const photoRef = ref<InstanceType<typeof NuxtPhotoImg> | null>(null)
const lightboxRef = ref<InstanceType<typeof NuxtPhotoLightbox> | null>(null)
const triggerRef = computed<HTMLElement | null>(() => photoRef.value?.triggerElement ?? null)

const { lightboxEnabled, lightboxOptions } = useLightboxConfig(() => props.lightbox)

const resolvedCaptionVisible = computed<CaptionVisibilityMode>(() => {
  if (props.captionVisible) {
    return props.captionVisible
  }

  return props.caption || props.description ? 'both' : 'none'
})

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
  emit('click', event)

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
  <NuxtPhotoImg
    ref="photoRef"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :thumbnail-src="thumbnailSrc"
    :caption="caption"
    :description="description"
    :caption-visible="captionVisible"
    :image="image"
    :image-class="imageClass"
    :caption-class="captionClass"
    :description-class="descriptionClass"
    :interactive="lightboxEnabled"
    @click="handleClick"
  >
    <template #caption="captionProps">
      <slot
        name="caption"
        v-bind="captionProps"
      />
    </template>
  </NuxtPhotoImg>

  <NuxtPhotoLightbox
    v-if="lightboxEnabled && (!groupState || groupState.isHost.value)"
    ref="lightboxRef"
    :items="groupState ? groupState.items.value : standaloneLightboxItems"
    :options="lightboxOptions"
    :image="image"
    :get-thumbnail-element="groupState ? getGroupThumbnailElement : getStandaloneThumbnailElement"
    teleport-to="body"
    @open="emit('open')"
    @close="emit('close')"
    @change="(index) => emit('change', index)"
    @destroy="emit('destroy')"
  >
    <template #controls="controlProps">
      <slot
        name="controls"
        v-bind="controlProps"
      />
    </template>
  </NuxtPhotoLightbox>
</template>
