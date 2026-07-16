import { describe, expect, it, vi } from 'vite-plus/test'
import type { PhotoItem } from '@nuxt-photo/vue'
import {
  createNuxtImageAdapter,
  DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG,
  type NuxtImageFunction,
} from '../src/runtime/image-adapter'

function createImageMock() {
  const image = vi.fn(
    (src: string, options: { width: number; quality: number }) =>
      `/_ipx/w_${options.width},q_${options.quality}${src}`,
  ) as NuxtImageFunction & ReturnType<typeof vi.fn>

  image.getSizes = vi.fn((src: string, options: { sizes: string; quality: number }) => ({
    src: `/_ipx/thumb,q_${options.quality}${src}`,
    srcset: `/_ipx/thumb-400,q_${options.quality}${src} 400w`,
    sizes: options.sizes,
  }))

  return image
}

const photo: PhotoItem = {
  id: 'nuxt-image',
  src: '/photos/full.jpg',
  thumbSrc: '/photos/thumb.jpg',
  width: 1600,
  height: 1000,
}

describe('nuxt image adapter', () => {
  it('uses thumbSrc for thumbnails and configurable thumb options', () => {
    const image = createImageMock()
    const adapter = createNuxtImageAdapter(image, {
      thumb: {
        sizes: 'sm:100vw lg:360px',
        quality: 72,
      },
    })

    const thumb = adapter(photo, 'thumb')

    expect(image.getSizes).toHaveBeenCalledWith('/photos/thumb.jpg', {
      sizes: 'sm:100vw lg:360px',
      quality: 72,
    })
    expect(thumb).toMatchObject({
      src: '/_ipx/thumb,q_72/photos/thumb.jpg',
      sizes: 'sm:100vw lg:360px',
      width: 1600,
      height: 1000,
    })
  })

  it('uses src for slides and honors configured widths, caps, density, sizes, and quality', () => {
    const image = createImageMock()
    const adapter = createNuxtImageAdapter(image, {
      slide: {
        widths: [400, 800, 1200, 1800],
        maxWidth: 900,
        maxDensity: 1,
        sizes: '90vw',
        quality: 77,
      },
    })

    const slide = adapter(photo, 'slide')

    expect(slide.src).toBe('/_ipx/w_900,q_77/photos/full.jpg')
    expect(slide.srcset).toContain('/_ipx/w_400,q_77/photos/full.jpg 400w')
    expect(slide.srcset).toContain('/_ipx/w_800,q_77/photos/full.jpg 800w')
    expect(slide.srcset).toContain('/_ipx/w_1200,q_77/photos/full.jpg 1200w')
    expect(slide.srcset).not.toContain('1800w')
    expect(slide.sizes).toBe('90vw')
  })

  it('keeps the existing default slide cap and fallback width behavior', () => {
    const image = createImageMock()
    const adapter = createNuxtImageAdapter(image)
    const tiny = { ...photo, width: 300 }

    const slide = adapter(tiny, 'slide')

    expect(slide.src).toBe('/_ipx/w_300,q_85/photos/full.jpg')
    expect(slide.srcset).toBe('/_ipx/w_300,q_85/photos/full.jpg 300w')
    expect(slide.sizes).toBe(DEFAULT_NUXT_IMAGE_ADAPTER_CONFIG.slide.sizes)
  })
})
