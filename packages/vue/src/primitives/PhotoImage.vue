<template>
  <img
    ref="imgRef"
    :src="resolved.src"
    :srcset="resolved.srcset"
    :sizes="props.sizes ?? resolved.sizes"
    :width="resolved.width"
    :height="resolved.height"
    :alt="photo.alt || ''"
    :loading="loading"
    :style="placeholderStyle"
    draggable="false"
    v-bind="$attrs"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import {
  createNativeImageAdapter,
  type PhotoItem,
  type ImageAdapter,
  type ImageContext,
  type ImageSource,
} from '../core/index'
import { ImageAdapterKey } from '../provide/keys'

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

type ImageResolution = { source: ImageSource } | { error: unknown }

const imageResolution = computed<ImageResolution>(() => {
  try {
    return { source: resolveImage.value(props.photo, props.context) }
  } catch (error) {
    return { error }
  }
})

const resolved = computed<ImageSource>(() => {
  const result = imageResolution.value
  if ('error' in result) throw result.error
  return result.source
})

const imgRef = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

function handleLoad() {
  loaded.value = true
}

function handleError() {
  // Keep the placeholder visible when the full source fails.
  loaded.value = false
}

function syncCachedState() {
  if (!imgRef.value?.complete) return
  if (imgRef.value.naturalWidth > 0) handleLoad()
  else handleError()
}

onMounted(syncCachedState)

watch(
  () => {
    const result = imageResolution.value
    return 'source' in result ? result.source.src : undefined
  },
  async () => {
    loaded.value = false
    await nextTick()
    syncCachedState()
  },
  { flush: 'post' },
)

const placeholderStyle = computed(() => {
  const placeholder = resolved.value.placeholder
  if (!placeholder || loaded.value) return undefined
  return {
    backgroundImage: `url(${JSON.stringify(placeholder)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
})
</script>
