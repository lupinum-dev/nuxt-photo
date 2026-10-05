import type { PhotoProvider } from '../config'

/** Fixed native renditions are supplied by the photo, never invented from its URL. */
export const nativeProvider: PhotoProvider = {
  url: (src) => src,
  srcset: (photo, context) => (context === 'thumb' && photo.thumbSrc ? undefined : photo.srcset),
}
