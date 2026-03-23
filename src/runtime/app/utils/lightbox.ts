import { computed, getCurrentInstance, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type {
  ImageConfig,
  LightboxImageItem,
  LightboxItem,
  LightboxModuleConfig,
  LightboxOptions,
} from '../../types'
import type { LightboxOptions as InternalLightboxOptions } from '../../lightbox/types'

type RuntimePhotoConfig = {
  hasNuxtImage?: boolean
  lightbox?: LightboxModuleConfig
}

function getNuxtApp() {
  return getCurrentInstance()?.appContext.app.config.globalProperties.$nuxt as {
    $config?: {
      public?: {
        nuxtPhoto?: RuntimePhotoConfig
      }
    }
    $img?: ((src: string, options?: Record<string, unknown>) => string) & {
      getSizes?: (src: string, options?: Record<string, unknown>) => { srcset?: string }
    }
  } | undefined
}

export function usePhotoRuntimeConfig() {
  return computed<RuntimePhotoConfig>(() => getNuxtApp()?.$config?.public?.nuxtPhoto ?? {})
}

/**
 * Translate the public module lightbox options into the internal runtime option names.
 *
 * Public API examples:
 * - `openAnimation`
 * - `showDuration`
 *
 * Internal runtime equivalents:
 * - `openAnimationType`
 * - `showAnimationDuration`
 */
export function normalizeLightboxOptions(
  options: LightboxOptions | undefined,
): InternalLightboxOptions | undefined {
  if (!options) {
    return undefined
  }

  return {
    arrowKeys: options.arrowKeys,
    bgClickAction: options.bgClickAction,
    bgOpacity: options.bgOpacity,
    closeAnimationType: options.closeAnimation,
    closeOnVerticalDrag: options.closeOnVerticalDrag,
    debug: options.debug,
    doubleTapAction: options.doubleTapAction,
    escKey: options.escKey,
    getViewportSizeFn: options.getViewportSizeFn,
    hideAnimationDuration: options.hideDuration,
    imageClickAction: options.imageClickAction,
    loop: options.loop,
    openAnimationType: options.openAnimation,
    pinchToClose: options.pinchToClose,
    preload: options.preload,
    returnFocus: options.returnFocus,
    showAnimationDuration: options.showDuration,
    tapAction: options.tapAction,
    trapFocus: options.trapFocus,
    zoomAnimationDuration: options.zoomDuration,
  }
}

export function useResolvedLightboxItems(
  items: MaybeRefOrGetter<readonly LightboxItem[]>,
  options: MaybeRefOrGetter<LightboxOptions | undefined>,
  image: MaybeRefOrGetter<ImageConfig | undefined> = () => undefined,
): ComputedRef<readonly LightboxItem[]> {
  const runtimeConfig = usePhotoRuntimeConfig()

  return computed(() => {
    const resolvedItems = toValue(items)
    const resolvedOptions = toValue(options)
    const resolvedImage = toValue(image)
    const moduleLightbox = runtimeConfig.value.lightbox ?? {}
    const hasNuxtImage = runtimeConfig.value.hasNuxtImage === true
    const densities = moduleLightbox.densities
    const maxWidth = resolvedOptions?.maxImageWidth ?? moduleLightbox.maxWidth
    const preset = resolvedOptions?.imagePreset ?? moduleLightbox.preset ?? resolvedImage?.preset

    if (!hasNuxtImage) {
      return resolvedItems
    }

    const imageHelper = getNuxtApp()?.$img

    const getSizes = imageHelper?.getSizes

    if (!imageHelper || typeof getSizes !== 'function') {
      return resolvedItems
    }

    return resolvedItems.map((item) => {
      if (item.type === 'custom') {
        return item
      }

      const lightboxItem = item as LightboxImageItem
      const modifiers = {
        ...(resolvedImage?.modifiers ?? {}),
        width: maxWidth ? Math.min(lightboxItem.width, maxWidth) : undefined,
      }
      const src = imageHelper(lightboxItem.src, {
        densities,
        modifiers,
        preset,
        provider: resolvedImage?.provider,
      })
      const sizeWidth = maxWidth ? Math.min(lightboxItem.width, maxWidth) : lightboxItem.width
      const sizesResult = getSizes(lightboxItem.src, {
        densities,
        modifiers,
        preset,
        provider: resolvedImage?.provider,
        sizes: `${sizeWidth}px`,
      })

      return {
        ...lightboxItem,
        src,
        srcset: sizesResult.srcset,
      } satisfies LightboxImageItem
    })
  })
}
