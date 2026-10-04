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
import type { PhotoItem } from '../core/index'
import { normalizePhotos } from '../core/photo/normalize'
import { usePhotoConfig, type PhotoProvider } from '../config'
import { resolvePhotoImage, type PhotoRenderContext } from '../providers/resolve'

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
  const photo = normalizePhotos<TMeta>([props.photo], {
    owner: 'PhotoImage',
    resolveDimensions: config.value.dimensions,
  }).photos[0]!
  return resolvePhotoImage(photo, props.context, config.value)
})
const effectiveLoading = computed(() => (props.priority ? 'eager' : 'lazy'))
const effectiveSizes = computed(() => {
  const sizes = props.sizes ?? '100vw'
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
