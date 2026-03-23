import type {
  ImageConfig,
  ImageModifiers,
  PhotoImageProps,
  PhotoItem,
} from '../types'

export function buildImageProps(
  item: PhotoItem,
  image: ImageConfig | undefined,
): PhotoImageProps {
  const modifiers: ImageModifiers = {
    ...(image?.modifiers ?? {}),
  }

  if (image?.fit !== undefined && modifiers.fit === undefined) {
    modifiers.fit = image.fit
  }

  return {
    alt: item.alt,
    class: ['photo-image'],
    decoding: image?.decoding ?? 'async',
    densities: image?.densities,
    fetchpriority: image?.fetchpriority,
    height: item.height,
    loading: image?.loading ?? 'lazy',
    modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
    placeholder: image?.placeholder,
    preset: image?.preset,
    provider: image?.provider,
    sizes: image?.sizes,
    src: item.thumbnailSrc ?? item.src,
    style: {
      boxSizing: 'content-box',
      display: 'block',
      height: '100%',
      width: '100%',
    },
    width: item.width,
  }
}
