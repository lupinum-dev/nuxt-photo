<template>
  <slot />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, provide } from 'vue'
import type { LightboxNavigationMode, LightboxTransitionOption, PhotoItem } from '../core/index'
import type { LightboxOptions } from '../config'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
import { provideLightbox } from '../composables/provideLightbox'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { LightboxThumbnailRegistryKey } from '../provide/keys'

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
  component?: LightboxOptions['component']
  validation?: InvalidPhotoPolicy
  history?: boolean
  deepLink?: boolean | string
  tools?: LightboxOptions['tools']
}>()

warnOnSetupOptionChanges('LightboxProvider', {
  minZoom: () => props.minZoom,
})

// PhotoTrigger fills this map; the lightbox reads it only when it needs a thumbnail.
const thumbnails = new Map<string, HTMLElement>()
provide(LightboxThumbnailRegistryKey, thumbnails)

provideLightbox(
  computed(() => props.photos),
  () => ({
    transition: props.transition,
    navigation: props.navigation,
    minZoom: props.minZoom,
    component: props.component,
    validation: props.validation,
    history: props.history,
    deepLink: props.deepLink,
    tools: props.tools,
  }),
  { thumbnailFor: (id) => (thumbnails.get(id)?.isConnected ? thumbnails.get(id)! : null) },
)
</script>
