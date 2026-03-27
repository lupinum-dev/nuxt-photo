import type { ImageAdapter, ImageSource, PhotoItem } from '../types'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 * Returns the same singleton instance on every call.
 */
const _nativeAdapter: ImageAdapter = (photo: PhotoItem, context): ImageSource => {
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

export function createNativeImageAdapter(): ImageAdapter {
  return _nativeAdapter
}
