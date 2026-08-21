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
    @load="loaded = true"
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

// Placeholder is painted behind the image content until the source decodes.
const imgRef = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

onMounted(() => {
  if (imgRef.value?.complete) loaded.value = true
})

// Reset on source changes using raw photo fields so the adapter is never
// evaluated outside render; a cached source reports complete immediately.
watch(
  () => [props.photo.src, props.photo.thumbSrc] as const,
  () => {
    loaded.value = false
    if (imgRef.value?.complete) loaded.value = true
  },
)

const placeholderStyle = computed(() => {
  const placeholder = resolved.value.placeholder
  if (!placeholder || loaded.value) return undefined
  return {
    backgroundImage: `url("${placeholder}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
})
</script>
