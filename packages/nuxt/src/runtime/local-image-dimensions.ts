import type { PhotoProvider } from '@lupinum/vue-photo'
import type { LocalImage } from '../local-images'

/** Resolve public URL paths, including encoded filenames and an app base URL. */
export function createLocalImageDimensionsResolver(
  dimensions: Readonly<Record<string, LocalImage>>,
  baseURL: string,
) {
  return (src: string): LocalImage | undefined => {
    if (/^(?:https?:|\/\/)/i.test(src)) return undefined
    let path = src.split(/[?#]/, 1)[0]!
    const prefix = baseURL.endsWith('/') ? baseURL : baseURL + '/'
    if (prefix !== '/' && path.startsWith(prefix)) path = '/' + path.slice(prefix.length)
    let size = Object.hasOwn(dimensions, path) ? dimensions[path] : undefined
    if (!size) {
      try {
        const decoded = decodeURI(path)
        size = Object.hasOwn(dimensions, decoded) ? dimensions[decoded] : undefined
      } catch {
        /* Malformed URI escapes are unknown sources. */
      }
    }
    return size
  }
}

/** Keep local previews on the provider path, with the provider handling remote sources. */
export function withLocalPlaceholders(
  provider: PhotoProvider,
  lookup: (src: string) => LocalImage | undefined,
): PhotoProvider {
  return {
    ...provider,
    placeholder: (src) => lookup(src)?.placeholderSrc ?? provider.placeholder?.(src),
  }
}
