import type { ImageAdapter, ImageSource, PhotoItem } from '../types'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 */
export function createNativeImageAdapter(): ImageAdapter {
  return (photo: PhotoItem, context): ImageSource => {
    if (context === 'thumb' && photo.thumbSrc) {
      return {
        src: photo.thumbSrc,
        width: photo.width,
        height: photo.height,
      }
    }

    return {
      src: photo.src,
      srcset: photo.srcset,
      width: photo.width,
      height: photo.height,
    }
  }
}
