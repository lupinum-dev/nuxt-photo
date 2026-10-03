<template>
  <!-- Set loading and sizes before srcset so new lazy images defer source selection. -->
  <img
    ref="imageRef"
    :loading="effectiveLoading"
    :fetchpriority="priority ? 'high' : undefined"
    :sizes="effectiveSizes"
    :srcset="resolved.srcset"
    :src="resolved.src"
    :width="resolved.width"
    :height="resolved.height"
    :alt="photo.alt || ''"
    draggable="false"
    v-bind="$attrs"
    :style="[placeholderStyle, $attrs.style]"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, onMounted, ref, watch } from 'vue'
import type { PhotoItem, ImageAdapter, ImageContext } from '../core/index'
import { usePhotoConfig } from '../config'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The photo to render through the image adapter. */
    photo: PhotoItem<TMeta>
    /**
     * `'thumb'` for grid images, `'slide'` for lightbox images. The adapter can return different
     * URLs for each.
     * @default 'thumb'
     */
    context?: ImageContext
    /** Image adapter for this component. Wins over the inherited config and the module default. */
    imageAdapter?: ImageAdapter<TMeta>
    /**
     * Native image `loading` hint. Use `'eager'` for images in the first screen.
     * @default 'lazy'
     */
    loading?: 'lazy' | 'eager'
    /** Load eagerly with high fetch priority. Explicit `loading` wins. @default false */
    priority?: boolean
    /** Override the adapter-computed sizes attribute with a layout-computed value. */
    sizes?: string
  }>(),
  {
    context: 'thumb',
  },
)

const config = usePhotoConfig()

const resolveImage = computed(
  (): ImageAdapter<TMeta> =>
    props.imageAdapter ?? (config.value.imageAdapter as ImageAdapter<TMeta>),
)

const resolved = computed(() => resolveImage.value(props.photo, props.context))
const effectiveLoading = computed(() => props.loading ?? (props.priority ? 'eager' : 'lazy'))
const effectiveSizes = computed(() => {
  const sizes = props.sizes ?? resolved.value.sizes
  return effectiveLoading.value === 'lazy' && !sizes?.startsWith('auto')
    ? `auto, ${sizes ?? '100vw'}`
    : sizes
})
const imageRef = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
const failed = ref(false)
const requestKey = computed(() =>
  JSON.stringify([resolved.value.src, resolved.value.srcset ?? '', effectiveSizes.value ?? '']),
)

const placeholderStyle = computed(() => {
  const placeholder = resolved.value.placeholderSrc
  if (!placeholder || (loaded.value && !failed.value)) return undefined
  return {
    backgroundImage: `url(${JSON.stringify(placeholder)})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  }
})

function handleLoad() {
  loaded.value = true
  failed.value = false
}

function handleError() {
  loaded.value = false
  failed.value = true
}

function resetRequestState() {
  const image = imageRef.value
  if (!image) return
  loaded.value = false
  failed.value = false
  if (image.complete && image.naturalWidth > 0) handleLoad()
}

onMounted(() => {
  watch(requestKey, resetRequestState, { immediate: true, flush: 'post' })
})
</script>
