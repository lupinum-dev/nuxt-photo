import { computed, inject } from 'vue'
import { useImage } from '#imports'
import {
  createNativeImageAdapter,
  responsive,
  type ImageAdapter,
  type ImageContext,
  type PhotoItem,
} from '@nuxt-photo/core'
import { ImageAdapterKey } from '@nuxt-photo/vue/extend'

type DemoMeta = {
  mood: string
  colSpan?: number
  rowSpan?: number
}

function seeded(seed: string, width: number, height: number) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

function createPhoto(
  id: string,
  width: number,
  height: number,
  caption: string,
  description: string,
  mood: string,
  meta: Partial<DemoMeta> = {},
): PhotoItem<DemoMeta> {
  return {
    id,
    src: seeded(`nuxt-photo-${id}`, width, height),
    thumbSrc: seeded(`nuxt-photo-${id}`, Math.max(480, Math.round(width / 2.8)), Math.max(360, Math.round(height / 2.8))),
    width,
    height,
    alt: caption,
    caption,
    description,
    meta: {
      mood,
      ...meta,
    },
  }
}

export const docsDemoPhotos: PhotoItem<DemoMeta>[] = [
  createPhoto('alpine-frame', 1600, 900, 'Alpine Frame', 'Wide ridge light with a generous horizon.', 'calm', { mood: 'calm', colSpan: 2 }),
  createPhoto('forest-haze', 1000, 1400, 'Forest Haze', 'Tall detail that works well in grouped or bento layouts.', 'quiet', { mood: 'quiet', rowSpan: 2 }),
  createPhoto('ocean-glass', 1200, 900, 'Ocean Glass', 'Balanced landscape for row and grid comparisons.', 'cool'),
  createPhoto('urban-glow', 1100, 1400, 'Urban Glow', 'Portrait frame with strong vertical emphasis.', 'electric', { mood: 'electric', rowSpan: 2 }),
  createPhoto('cascade', 1800, 1100, 'Cascade', 'Hero-style image with wide aspect ratio.', 'kinetic', { mood: 'kinetic', colSpan: 2 }),
  createPhoto('amber-detail', 900, 900, 'Amber Detail', 'Square crop for column balance and thumbnail demos.', 'warm'),
  createPhoto('winter-ridge', 1500, 1000, 'Winter Ridge', 'Classic landscape for transition and lightbox states.', 'crisp'),
  createPhoto('lavender-dreams', 1000, 1500, 'Lavender Dreams', 'Tall frame that exaggerates zoom and pan states.', 'soft', { mood: 'soft', rowSpan: 2 }),
]

export const docsHeroPhotos = docsDemoPhotos.slice(0, 5)
export const docsLightboxPhotos = docsDemoPhotos.slice(0, 6)
export const docsAlbumSetA = docsDemoPhotos.slice(0, 3)
export const docsAlbumSetB = docsDemoPhotos.slice(3, 6)
export const docsAlbumSetC = docsDemoPhotos.slice(5, 8)

export const docsBreakpoints = [360, 600, 840, 1120] as const

export const docsResponsiveSpacing = responsive({
  0: 4,
  600: 8,
  840: 12,
  1120: 16,
})

export const docsResponsivePadding = responsive({
  0: 0,
  600: 2,
  840: 4,
})

export const docsResponsiveColumns = responsive({
  0: 1,
  520: 2,
  840: 3,
  1120: 4,
})

export const docsResponsiveRowHeight = responsive({
  0: 170,
  600: 220,
  840: 270,
  1120: 310,
})

export function useDocsDemoAdapters() {
  const injectedAdapter = inject(ImageAdapterKey, null)
  const image = useImage()

  const nativeAdapter = createNativeImageAdapter()

  const nuxtImageAdapter: ImageAdapter = injectedAdapter ?? ((photo: PhotoItem, context: ImageContext) => {
    const src = context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src

    if (context === 'preload') {
      return {
        src: image(src, { width: 1600 }),
        width: photo.width,
        height: photo.height,
      }
    }

    if (context === 'slide') {
      const targetWidths = [640, 960, 1240, 1600, 2000]
      const widths = targetWidths.filter(width => width <= photo.width * 1.5)
      const srcsetWidths = widths.length > 0 ? widths : [Math.min(1240, photo.width)]

      return {
        src: image(src, { width: Math.min(1240, photo.width) }),
        srcset: srcsetWidths.map(width => `${image(src, { width })} ${width}w`).join(', '),
        sizes: 'min(1240px, calc(100vw - 72px))',
        width: photo.width,
        height: photo.height,
      }
    }

    const result = image.getSizes(src, { sizes: 'sm:100vw md:50vw lg:400px' })
    return {
      src: result.src || src,
      srcset: result.srcset,
      sizes: result.sizes || '100vw',
      width: photo.width,
      height: photo.height,
    }
  })

  const customAdapter: ImageAdapter = (photo: PhotoItem, context: ImageContext) => {
    const src = context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src
    const quality = context === 'thumb' ? 72 : 88
    const targetWidth = context === 'thumb'
      ? Math.min(720, photo.width)
      : context === 'slide'
        ? Math.min(1600, photo.width)
        : Math.min(1400, photo.width)

    return {
      src: `${src}?demo=custom&w=${targetWidth}&q=${quality}`,
      srcset: [0.75, 1, 1.5]
        .map(multiplier => {
          const width = Math.min(Math.round(targetWidth * multiplier), Math.max(photo.width, targetWidth))
          return `${src}?demo=custom&w=${width}&q=${quality} ${width}w`
        })
        .join(', '),
      sizes: context === 'thumb' ? '(max-width: 768px) 50vw, 280px' : 'min(1280px, 92vw)',
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    nativeAdapter,
    nuxtImageAdapter,
    customAdapter,
  }
}

export function useDocsAdapterPreview(mode: 'native' | 'nuxt-image' | 'custom') {
  const adapters = useDocsDemoAdapters()

  return computed<ImageAdapter>(() => {
    if (mode === 'custom') return adapters.customAdapter
    if (mode === 'nuxt-image') return adapters.nuxtImageAdapter
    return adapters.nativeAdapter
  })
}

export function resolveAdapterName(mode: 'native' | 'nuxt-image' | 'custom') {
  if (mode === 'nuxt-image') return '@nuxt/image'
  if (mode === 'custom') return 'Custom CDN'
  return 'Native'
}

export function formatImageSource(adapter: ImageAdapter, photo: PhotoItem, context: ImageContext) {
  const resolved = adapter(photo, context)

  return {
    src: resolved.src,
    srcset: resolved.srcset ?? 'none',
    sizes: resolved.sizes ?? 'none',
    width: resolved.width ?? photo.width,
    height: resolved.height ?? photo.height,
  }
}
