import { describe, expect, it } from 'vitest'
import {
  normalizePhotos,
  PhotoValidationError,
} from '../../src/core/photo/normalize'

describe('photo normalization', () => {
  it('returns valid photos without transforming application data', () => {
    const result = normalizePhotos(
      [{ id: 'a', src: '/a.jpg', width: 1200, height: 800 }],
      { owner: 'PhotoAlbum' },
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
      /missing a non-empty string id[\s\S]*missing a non-empty src[\s\S]*invalid width[\s\S]*invalid height[\s\S]*duplicate photo id "dup"/,
    )
  })

  it.each([null, undefined, [], 42, 'photo'])(
    'reports non-object entry %j as a structured issue',
    (value) => {
      try {
        normalizePhotos([value], { owner: 'PhotoAlbum' })
        throw new Error('expected validation to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(PhotoValidationError)
        expect((error as PhotoValidationError).issues[0]?.code).toBe(
          'invalid-item',
        )
      }
    },
  )

  it('marks every duplicate entry invalid when dropping', () => {
    const result = normalizePhotos(
      [
        { id: 'dup', src: '/a.jpg', width: 1, height: 1 },
        { id: 'dup', src: '/b.jpg', width: 1, height: 1 },
      ],
      { owner: 'PhotoGroup', onInvalid: 'drop' },
    )
    expect(result.photos).toEqual([])
    expect(result.issues).toHaveLength(2)
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
