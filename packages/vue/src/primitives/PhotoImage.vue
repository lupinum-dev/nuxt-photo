<template>
  <!-- Set loading and sizes before srcset so new lazy images defer source selection. -->
  <img
    ref="imageRef"
    :loading="effectiveLoading"
    :decoding="priority ? undefined : 'async'"
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
const effectiveSizes = computed(() => {
  const sizes = props.sizes ?? '100vw'
  return !props.priority && !sizes?.startsWith('auto') ? `auto, ${sizes ?? '100vw'}` : sizes
})
if (props.priority) {
  const preload = inject(ImagePreloadKey, undefined)
  preload?.({ ...resolved.value, sizes: effectiveSizes.value })
}
const imageRef = ref<HTMLImageElement | null>(null)
const { loaded, failed, handleLoad, handleError, resetRequestState } = useImagePaint(imageRef)
const requestKey = computed(() =>
  JSON.stringify([resolved.value.src, resolved.value.srcset ?? '', effectiveSizes.value ?? '']),
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
