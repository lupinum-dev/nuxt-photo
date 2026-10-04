import type { PhotoItem } from '../core/types'
import type { PhotoProvider, ResolvedPhotoConfig } from '../config'

/** Keep provider-specific inference without changing the provider. */
export function definePhotoProvider<T extends PhotoProvider>(provider: T): T {
  return provider
}
export type PhotoRenderContext = 'thumb' | 'slide'
export type ResolvedPhotoImage = {
  src: string
  srcset?: string
  placeholderSrc?: string
  width: number
  height: number
}

/** Providers resolve URLs; the core caps, de-duplicates, and labels all candidates. */
export function resolvePhotoImage(
  photo: PhotoItem,
  context: PhotoRenderContext,
  config: ResolvedPhotoConfig,
): ResolvedPhotoImage {
  const src = context === 'thumb' ? (photo.thumbSrc ?? photo.src) : photo.src
  const base = { width: photo.width, height: photo.height, placeholderSrc: photo.placeholderSrc }
  if (/\.svg$/i.test(src.split(/[?#]/, 1)[0]!)) return { ...base, src }
  const provider = config.provider
  const placeholderSrc = photo.placeholderSrc ?? provider.placeholder?.(src)
  const ladder = [...new Set(config.providers.widths(provider))]
    .filter((width) => Number.isFinite(width) && width > 0)
    .sort((a, b) => a - b)
  const widths = ladder.filter((width) => width <= photo.width)
  if (
    config.providers.allowSourceWidth(provider) &&
    ladder.some((width) => width >= photo.width) &&
    !widths.includes(photo.width)
  )
    widths.push(photo.width)
  if (provider.srcset) {
    return {
      ...base,
      src: provider.url(src, { width: widths.at(-1) ?? photo.width }),
      srcset: provider.srcset(photo, context),
      placeholderSrc,
    }
  }
  // A strict allowlist can have no rendition small enough: keep the original, without upscaling.
  if (!widths.length) return { ...base, src, placeholderSrc }
  const candidates = new Map<string, number>()
  for (const width of widths) {
    const url = provider.url(src, { width })
    candidates.set(url, Math.max(width, candidates.get(url) ?? 0))
  }
  const ordered = [...candidates].sort((a, b) => a[1] - b[1])
  return {
    ...base,
    src: (ordered.find(([, width]) => width >= 1080) ?? ordered.at(-1))![0],
    srcset: ordered.map(([url, width]) => `${url} ${width}w`).join(', '),
    placeholderSrc,
  }
}
