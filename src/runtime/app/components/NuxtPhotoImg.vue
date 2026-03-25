<!-- Standalone image component with optional caption handling and an opt-in interactive trigger. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  CaptionVisibilityMode,
  PhotoImgEmits,
  PhotoImgProps,
  PhotoItem,
} from '../../types'
import { buildImageProps } from '../../utils/imageProps'

const props = withDefaults(
  defineProps<PhotoImgProps>(),
  {
    alt: '',
    captionVisible: undefined,
    description: undefined,
    interactive: false,
  },
)

const emit = defineEmits<PhotoImgEmits>()

defineSlots<{
  caption?: (props: { caption?: string, description?: string }) => unknown
}>()

const triggerRef = ref<HTMLElement | null>(null)

const resolvedCaptionVisible = computed<CaptionVisibilityMode>(() => {
  if (props.captionVisible) {
    return props.captionVisible
  }

  return props.caption || props.description ? 'both' : 'none'
})

const showCaptionBelow = computed(() =>
  ['below', 'both'].includes(resolvedCaptionVisible.value),
)

const item = computed<PhotoItem>(() => ({
  alt: props.alt,
  caption: props.caption,
  description: props.description,
  height: props.height,
  href: undefined,
  src: props.src,
  thumbnailSrc: props.thumbnailSrc,
  width: props.width,
}))

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

function handleClick(event: MouseEvent) {
  if (!props.interactive) {
    return
  }

  emit('click', event)
}

defineExpose({
  triggerElement: triggerRef,
})
</script>

<template>
  <figure
    class="photo-img"
    :class="{ 'photo-img--interactive': interactive }"
    data-slot="photo-img"
  >
    <component
      :is="interactive ? 'button' : 'div'"
      ref="triggerRef"
      class="photo-img__trigger"
      :type="interactive ? 'button' : undefined"
      :aria-label="interactive ? `Open image${alt ? `: ${alt}` : ''}` : undefined"
      data-slot="photo-trigger"
      @click="interactive ? handleClick($event as MouseEvent) : undefined"
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
  </figure>
</template>
