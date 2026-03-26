// Runtime-only — this file is only bundled when @nuxt/image is present.
// The Nuxt module conditionally registers this via addPlugin only when
// hasNuxtModule('@nuxt/image') is true.
import { useImage } from '#image'
import type { ImageAdapter, ImageSource, PhotoItem, ImageContext } from '@nuxt-photo/core'

export function createNuxtImageAdapter(): ImageAdapter {
  const img = useImage()

  return (photo: PhotoItem, context: ImageContext): ImageSource => {
    const src = (context === 'thumb' && photo.thumbSrc) ? photo.thumbSrc : photo.src

    if (context === 'preload') {
      return {
        src: img(src, { width: 1600, quality: 85 }),
        width: photo.width,
        height: photo.height,
      }
    }

    // 'slide': full-viewport srcset for lightbox
    // 'thumb': responsive srcset for grid thumbnails (mobile → desktop)
    const sizes = context === 'slide'
      ? '100vw'
      : '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px'
    const quality = context === 'slide' ? 85 : 80

    const result = img.getSizes(src, { sizes, quality })
    return {
      src: result.src,
      srcset: result.srcset,
      sizes: result.sizes,
      width: photo.width,
      height: photo.height,
    }
  }
}
