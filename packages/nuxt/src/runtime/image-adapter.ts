import type { ImageAdapter, ImageContext, ImageSource, PhotoItem } from '@lupinum/vue-photo'
import type { NuxtPhotoImageAdapterConfig } from '../options'

export type { NuxtPhotoImageAdapterConfig } from '../options'

export type NuxtImageFunction = (
  src: string,
  modifiers: { width: number; quality: number; format?: 'webp' | 'avif' },
) => string

export const DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG = {
  format: 'webp',
  thumb: {
    widths: [256, 384, 512, 640, 828, 1080, 1280, 1640, 1920, 2560],
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px',
    quality: 80,
  },
  slide: {
    widths: [640, 960, 1240, 1600, 2000],
    maxWidth: 1240,
    sizes: 'min(1240px, calc(100vw - 72px))',
    quality: 85,
  },
} satisfies NuxtPhotoImageAdapterConfig

function decodeLocalPath(src: string) {
  if (src.startsWith('/') && !src.startsWith('//') && src.includes('%')) {
    try {
      return decodeURI(src)
    } catch {
      // Malformed escapes must not prevent an otherwise usable source from rendering.
    }
  }
  return src
}

export function createNuxtImageAdapter(
  image: NuxtImageFunction,
  config?: NuxtPhotoImageAdapterConfig,
  provider?: string,
): ImageAdapter {
  const ipx = provider === 'ipx' || provider === 'ipxStatic'
  const format = config?.format ?? DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.format
  const formatModifiers = ipx && format !== 'auto' ? { format } : {}
  const placeholder = config?.placeholder ?? ipx
  const thumb = {
    ...DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.thumb,
    ...config?.thumb,
    widths: config?.thumb?.widths ?? DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.thumb.widths,
  }
  const slide = {
    ...DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.slide,
    ...config?.slide,
    widths: config?.slide?.widths ?? DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.slide.widths,
  }

  return (photo: PhotoItem, context: ImageContext): ImageSource => {
    const src = decodeLocalPath(context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src)
    const options = context === 'thumb' ? thumb : slide
    const configuredWidths = [...new Set(options.widths)].sort((a, b) => a - b)
    const widths = configuredWidths.filter((width) => width < photo.width)
    if (configuredWidths.some((width) => width >= photo.width)) widths.push(photo.width)

    const candidates: { width: number; url: string }[] = []
    for (const width of widths) {
      const url = image(src, { width, quality: options.quality, ...formatModifiers })
      const previous = candidates.at(-1)
      // Rounded URLs share one entry with the largest requested width.
      if (previous?.url === url) previous.width = width
      else candidates.push({ width, url })
    }

    const thumbSource =
      candidates.filter((candidate) => candidate.width <= 1080).at(-1) ?? candidates[0]!
    return {
      src:
        context === 'thumb'
          ? thumbSource.url
          : image(src, {
              width: Math.min(slide.maxWidth, photo.width),
              quality: slide.quality,
              ...formatModifiers,
            }),
      srcset: candidates.map(({ width, url }) => `${url} ${width}w`).join(', '),
      sizes: options.sizes,
      placeholderSrc:
        photo.placeholderSrc ??
        (placeholder ? image(src, { width: 24, quality: 30, ...formatModifiers }) : undefined),
      width: photo.width,
      height: photo.height,
    }
  }
}
