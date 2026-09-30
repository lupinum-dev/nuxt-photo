<template>
  <slot />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed } from 'vue'
import type {
  ImageAdapter,
  LightboxNavigationMode,
  LightboxTransitionOption,
  PhotoItem,
} from '../core/index'
import { provideLightbox } from '../composables/provideLightbox'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The photo collection in navigation order. One photo is also accepted. */
  photos: PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]
  /**
   * How the lightbox opens and closes. `'auto'` animates from the thumbnail when enough of it is
   * visible and fades otherwise. Also `'flip'`, `'fade'`, `'none'`, or an options object. Can
   * change while mounted.
   * @default 'auto'
   */
  transition?: LightboxTransitionOption
  /**
   * How the lightbox changes photos: `'slide'`, `'fade'`, or `'crossfade'`. Can change while
   * mounted.
   * @default 'slide'
   */
  navigation?: LightboxNavigationMode
  /**
   * Lowest zoom that a click or the `z` key applies, as a multiple of the fitted size. Read once at
   * mount.
   * @default 1.5
   */
  minZoom?: number
  /** Image adapter for this component. Wins over `ImageAdapterKey` and the module default. */
  imageAdapter?: ImageAdapter<TMeta>
}>()

warnOnSetupOptionChanges('LightboxProvider', {
  minZoom: () => props.minZoom,
})

provideLightbox(
  computed(() => props.photos),
  {
    transition: () => props.transition,
    navigation: () => props.navigation,
    minZoom: props.minZoom,
    imageAdapter: computed(() => props.imageAdapter),
  },
)
</script>
