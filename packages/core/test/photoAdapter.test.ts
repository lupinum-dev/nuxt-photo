import { describe, expect, it } from 'vitest'
import type { PhotoAdapter, PhotoItem } from '../src/types'

describe('PhotoAdapter type', () => {
  it('transforms external data into PhotoItem', () => {
    type UnsplashPhoto = {
      id: string
      urls: { regular: string; thumb: string }
      width: number
      height: number
      alt_description: string | null
    }

    const fromUnsplash: PhotoAdapter<UnsplashPhoto> = (item) => ({
      id: item.id,
      src: item.urls.regular,
      thumbSrc: item.urls.thumb,
      width: item.width,
      height: item.height,
      alt: item.alt_description ?? undefined,
    })

    const input: UnsplashPhoto = {
      id: 'abc123',
      urls: { regular: 'https://example.com/regular.jpg', thumb: 'https://example.com/thumb.jpg' },
      width: 1920,
      height: 1080,
      alt_description: 'A sunset',
    }

    const result: PhotoItem = fromUnsplash(input)

    expect(result).toEqual({
      id: 'abc123',
      src: 'https://example.com/regular.jpg',
      thumbSrc: 'https://example.com/thumb.jpg',
      width: 1920,
      height: 1080,
      alt: 'A sunset',
    })
  })

  it('works with array mapping', () => {
    const adapter: PhotoAdapter<{ url: string; w: number; h: number }> = (item) => ({
      id: item.url,
      src: item.url,
      width: item.w,
      height: item.h,
    })

    const items = [
      { url: '/a.jpg', w: 800, h: 600 },
      { url: '/b.jpg', w: 1200, h: 900 },
    ]

    const photos: PhotoItem[] = items.map(adapter)

    expect(photos).toHaveLength(2)
    expect(photos[0]!.id).toBe('/a.jpg')
    expect(photos[1]!.width).toBe(1200)
  })
})
