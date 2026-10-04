import type { PhotoProvider } from '@lupinum/vue-photo'
export interface ProviderRuntime {
  resolve(name: string): PhotoProvider
  widths(provider: PhotoProvider): readonly number[]
  allowSourceWidth(provider: PhotoProvider): boolean
}

export type NuxtImageFunction = (
  src: string,
  modifiers: { width: number; quality?: number; format?: string },
  options: { provider: string },
) => string
export interface NuxtImageOptions {
  provider: string
  screens: Record<string, number>
  densities: number[]
  quality?: number
  format?: string[]
}
function decodeLocalPath(src: string) {
  if (src.startsWith('/') && !src.startsWith('//') && src.includes('%')) {
    try {
      return decodeURI(src)
    } catch {
      /* Preserve malformed escapes, as Nuxt Image does. */
    }
  }
  return src
}
function isFile(src: string, extension: string) {
  return src.split(/[?#]/, 1)[0]!.toLowerCase().endsWith(extension)
}

/** Nuxt Image owns quality, format and transport. Core owns the candidate set. */
export function createNuxtPhotoProviders(image: NuxtImageFunction, options: NuxtImageOptions) {
  const names = new WeakMap<PhotoProvider, string>()
  const cache = new Map<string, PhotoProvider>()
  const screens = [...new Set(Object.values(options.screens))]
    .filter((width) => width > 0)
    .sort((a, b) => a - b)
  const ladder = [
    ...new Set(screens.flatMap((width) => options.densities.map((density) => width * density))),
  ].sort((a, b) => a - b)
  function resolve(name: string) {
    const existing = cache.get(name)
    if (existing) return existing
    const ipx = name === 'ipx' || name === 'ipxStatic'
    const format = options.format?.[0] ?? (ipx ? 'webp' : undefined)
    const modifiers = (src: string) => (!isFile(src, '.gif') && format ? { format } : {})
    const provider: PhotoProvider = {
      url(src, opts) {
        if (isFile(src, '.svg')) return src
        return image(
          decodeLocalPath(src),
          {
            width: opts.width,
            ...(options.quality !== undefined ? { quality: options.quality } : {}),
            ...modifiers(src),
          },
          { provider: name },
        )
      },
      ...(ipx
        ? {
            placeholder(src: string) {
              if (isFile(src, '.svg')) return undefined
              return image(
                decodeLocalPath(src),
                { width: 24, quality: 30, ...modifiers(src) },
                { provider: name },
              )
            },
          }
        : {}),
    }
    names.set(provider, name)
    cache.set(name, provider)
    return provider
  }
  // Nuxt Image builds Vercel's allowlist from screens only and rounds off-list widths up.
  // Keep terminal source widths disabled there so core requests never trigger rounding.
  const runtime: ProviderRuntime = {
    resolve,
    widths: (provider) => (names.get(provider) === 'vercel' ? screens : ladder),
    allowSourceWidth: (provider) => names.get(provider) !== 'vercel',
  }
  return { resolve, runtime }
}
