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

<script setup lang="ts">
import { computed, inject } from 'vue'
import { createNativeImageAdapter, type PhotoItem, type ImageAdapter, type ImageContext } from '@nuxt-photo/core'
import { ImageAdapterKey } from '../provide/keys'

const props = withDefaults(defineProps<{
  photo: PhotoItem
  context?: ImageContext
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
  /** Override the adapter-computed sizes attribute with a layout-computed value. */
  sizes?: string
}>(), {
  context: 'thumb',
  loading: 'lazy',
})

const injectedAdapter = inject(ImageAdapterKey, null)

const resolveImage = computed((): ImageAdapter =>
  props.adapter ?? injectedAdapter ?? createNativeImageAdapter()
)

const resolved = computed(() => resolveImage.value(props.photo, props.context))
</script>
