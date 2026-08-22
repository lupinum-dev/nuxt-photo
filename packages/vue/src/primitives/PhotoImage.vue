<template>
  <img
    ref="imageRef"
    :src="resolved.src"
    :srcset="resolved.srcset"
    :sizes="effectiveSizes"
    :width="resolved.width"
    :height="resolved.height"
    :alt="photo.alt || ''"
    :loading="loading"
    draggable="false"
    v-bind="$attrs"
    :style="[placeholderStyle, $attrs.style]"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, onMounted, ref, watch } from 'vue'
import {
  createNativeImageAdapter,
  type PhotoItem,
  type ImageAdapter,
  type ImageContext,
} from '../core/index'
import { ImageAdapterKey } from '../provide/keys'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    photo: PhotoItem<TMeta>
    context?: ImageContext
    imageAdapter?: ImageAdapter<TMeta>
    loading?: 'lazy' | 'eager'
    /** Override the adapter-computed sizes attribute with a layout-computed value. */
    sizes?: string
  }>(),
  {
    context: 'thumb',
    loading: 'lazy',
  },
)

const injectedAdapter = inject(ImageAdapterKey, null)

const resolveImage = computed(
  (): ImageAdapter<TMeta> =>
    props.imageAdapter ??
    (injectedAdapter as ImageAdapter<TMeta> | null) ??
    createNativeImageAdapter<TMeta>(),
)

const resolved = computed(() => resolveImage.value(props.photo, props.context))
const effectiveSizes = computed(() => props.sizes ?? resolved.value.sizes)
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
