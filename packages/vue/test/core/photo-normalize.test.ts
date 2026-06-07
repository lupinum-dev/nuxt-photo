import { describe, expect, it } from 'vitest'
import { normalizePhotos } from '../../src'

describe('photo normalization', () => {
  it('returns valid mapped photos without issues', () => {
    const result = normalizePhotos(
      [{ assetId: 'a', url: '/a.jpg', w: 1200, h: 800 }],
      {
        owner: 'PhotoAlbum',
        mapper: (item) => ({
          id: item.assetId,
          src: item.url,
          width: item.w,
          height: item.h,
        }),
      },
    )

    expect(result.issues).toEqual([])
    expect(result.photos).toEqual([
      { id: 'a', src: '/a.jpg', width: 1200, height: 800 },
    ])
  })

  it('throws for missing ids, empty src, invalid dimensions, and duplicate ids by default', () => {
    expect(() =>
      normalizePhotos(
        [
          { id: '', src: '', width: 0, height: Number.NaN },
          { id: 'dup', src: '/a.jpg', width: 100, height: 100 },
          { id: 'dup', src: '/b.jpg', width: 100, height: 100 },
        ],
        { owner: 'PhotoGroup' },
      ),
    ).toThrow(
      /missing a non-empty id[\s\S]*missing a non-empty src[\s\S]*invalid width[\s\S]*invalid height[\s\S]*duplicate photo id "dup"/,
    )
  })

  it('can drop invalid photos for production recipe rendering', () => {
    const result = normalizePhotos(
      [
        { id: 'good', src: '/good.jpg', width: 100, height: 100 },
        { id: 'bad', src: '', width: 100, height: 100 },
      ],
      { owner: 'PhotoAlbum', onInvalid: 'drop' },
    )

    expect(result.photos.map((photo) => photo.id)).toEqual(['good'])
    expect(result.issues.map((issue) => issue.code)).toEqual(['missing-src'])
  })
})
