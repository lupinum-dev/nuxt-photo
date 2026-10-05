<template>
  <!-- Vue sets attributes in this order. sizes before loading: a promoted image must drop
       `auto` before it turns eager. Both before srcset: new lazy images defer selection. -->
  <img
    ref="imageRef"
    :sizes="effectiveSizes"
    :loading="effectiveLoading"
    :decoding="priority ? undefined : 'async'"
    :fetchpriority="priority ? 'high' : undefined"
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
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PhotoItem } from '../core/index'
import { normalizePhoto } from '../core/photo/normalize'
import { usePhotoConfig, type PhotoProvider } from '../config'
import { resolvePhotoImage, type PhotoRenderContext } from '../providers/resolve'

import { observeAhead } from './loadAhead'
import { useImagePaint } from './imagePaint'
import { ImagePreloadKey } from '../internal/imagePreload'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The photo to render through the image provider. */
    photo: PhotoItem<TMeta>
    /**
     * `'thumb'` for grid images, `'slide'` for lightbox images. The provider can return different
     * URLs for each.
     * @default 'thumb'
     */
    context?: PhotoRenderContext
    /** Image provider object, or a Nuxt Image provider name. Wins over inherited config. */
    provider?: PhotoProvider | string
    /** Load eagerly with high fetch priority. @default false */
    priority?: boolean
    /** Layout-computed sizes. Always wins; providers do not own sizes. */
    sizes?: string
  }>(),
  {
    context: 'thumb',
  },
)

const inheritedConfig = usePhotoConfig()
const config = computed(() => {
  const parent = inheritedConfig.value
  const provider =
    typeof props.provider === 'string' ? parent.providers.resolve(props.provider) : props.provider
  return provider ? { ...parent, provider } : parent
})
const resolved = computed(() => {
  const photo = normalizePhoto<TMeta>(props.photo, {
    owner: 'PhotoImage',
    resolveDimensions: config.value.dimensions,
  })
  return resolvePhotoImage(photo, props.context, config.value)
})
const ahead = ref(false)
const effectiveLoading = computed(() => (props.priority || ahead.value ? 'eager' : 'lazy'))
// `auto` is valid only on lazy images; an eager image with `auto` makes browsers pick the
// full viewport width. Promotion to eager therefore switches to the plain layout value.
const baseSizes = computed(() => {
  const sizes = (props.sizes ?? '100vw').replace(/^auto\s*(,\s*|$)/, '')
  return sizes || '100vw'
})
const effectiveSizes = computed(() =>
  effectiveLoading.value === 'lazy' ? `auto, ${baseSizes.value}` : baseSizes.value,
)
if (props.priority) {
  const preload = inject(ImagePreloadKey, undefined)
  preload?.({ ...resolved.value, sizes: effectiveSizes.value })
}
const imageRef = ref<HTMLImageElement | null>(null)
const { loaded, failed, handleLoad, handleError, resetRequestState } = useImagePaint(imageRef)
const requestKey = computed(() =>
  JSON.stringify([resolved.value.src, resolved.value.srcset ?? '', baseSizes.value]),
)

const placeholderStyle = computed(() => {
  const placeholder = resolved.value.placeholderSrc
  if (loaded.value && !failed.value) return undefined
  return {
    backgroundColor:
      props.photo._placeholderColor ??
      config.value.dimensions?.(props.photo.src)?._placeholderColor ??
      'var(--np-placeholder-bg, #e5e7eb)',
    ...(placeholder && {
      backgroundImage: `url(${JSON.stringify(placeholder)})`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    }),
  }
})

let stopAhead: (() => void) | undefined
onBeforeUnmount(() => {
  stopAhead?.()
})
onMounted(() => {
  watch(
    () => props.priority,
    (priority) => {
      stopAhead?.()
      stopAhead =
        !priority && imageRef.value
          ? observeAhead(imageRef.value, () => {
              ahead.value = true
            })
          : undefined
    },
    { immediate: true },
  )
  watch(requestKey, resetRequestState, { immediate: true, flush: 'post' })
})
</script>
