<template>
  <img
    :src="resolved.src"
    :srcset="resolved.srcset"
    :sizes="props.sizes ?? resolved.sizes"
    :width="resolved.width"
    :height="resolved.height"
    :alt="photo.alt || ''"
    :loading="loading"
    draggable="false"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject } from 'vue'
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
</script>
