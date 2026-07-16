import type { ImageAdapter, ImageContext, ImageSource, PhotoItem } from '@nuxt-photo/vue'
import type { NuxtPhotoImageAdapterConfig } from '../options'

export type { NuxtPhotoImageAdapterConfig } from '../options'

export type NuxtImageFunction = {
  (src: string, options: { width: number; quality: number }): string
  getSizes: (
    src: string,
    options: { sizes: string; quality: number },
  ) => {
    src: string
    srcset?: string
    sizes?: string
  }
}

export const DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG = {
  thumb: {
    sizes: 'sm:100vw md:50vw lg:400px',
    quality: 80,
  },
  slide: {
    widths: [640, 960, 1240, 1600, 2000],
    maxWidth: 1240,
    maxDensity: 1.5,
    sizes: 'min(1240px, calc(100vw - 72px))',
    quality: 85,
  },
} satisfies Required<NuxtPhotoImageAdapterConfig>

function resolveConfig(config?: NuxtPhotoImageAdapterConfig) {
  return {
    thumb: {
      ...DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.thumb,
      ...config?.thumb,
    },
    slide: {
      ...DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.slide,
      ...config?.slide,
    },
  }
}

function slideWidths(photo: PhotoItem, config: ReturnType<typeof resolveConfig>) {
  const maxSourceWidth = photo.width * config.slide.maxDensity
  const widths = config.slide.widths.filter((width) => width > 0 && width <= maxSourceWidth)

  return widths.length > 0 ? widths : [Math.min(config.slide.maxWidth, photo.width)]
}

export function createNuxtImageAdapter(
  image: NuxtImageFunction,
  config?: NuxtPhotoImageAdapterConfig,
): ImageAdapter {
  const resolvedConfig = resolveConfig(config)

  return (photo: PhotoItem, context: ImageContext): ImageSource => {
    const src = context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src

    if (context === 'slide') {
      const widths = slideWidths(photo, resolvedConfig)
      const quality = resolvedConfig.slide.quality
      const srcset = widths.map((width) => `${image(src, { width, quality })} ${width}w`).join(', ')

      return {
        src: image(src, {
          width: Math.min(resolvedConfig.slide.maxWidth, photo.width),
          quality,
        }),
        srcset,
        sizes: resolvedConfig.slide.sizes,
        width: photo.width,
        height: photo.height,
      }
    }

    const result = image.getSizes(src, {
      sizes: resolvedConfig.thumb.sizes,
      quality: resolvedConfig.thumb.quality,
    })

    return {
      src: result.src,
      srcset: result.srcset,
      sizes: result.sizes,
      width: photo.width,
      height: photo.height,
    }
  }
}
