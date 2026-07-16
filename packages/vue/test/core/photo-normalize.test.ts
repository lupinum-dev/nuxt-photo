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

  it('can explicitly drop invalid photos', () => {
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

  it.each([
    { field: 'alt', value: 42 },
    { field: 'caption', value: {} },
    { field: 'description', value: false },
    { field: 'thumbSrc', value: [] },
    { field: 'srcset', value: 1 },
  ])('rejects malformed optional $field values', ({ field, value }) => {
    expect(() =>
      normalizePhotos(
        [
          {
            id: 'optional',
            src: '/optional.jpg',
            width: 10,
            height: 10,
            [field]: value,
          },
        ],
        { owner: 'Photo' },
      ),
    ).toThrow(`field "${field}" must be a string`)
  })

  it.each([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1])(
    'rejects non-finite or negative dimensions',
    (width) => {
      expect(() =>
        normalizePhotos(
          [{ id: 'bad-size', src: '/x.jpg', width, height: 10 }],
          { owner: 'PhotoAlbum' },
        ),
      ).toThrow(/invalid width/)
    },
  )

  it('rejects class instances instead of treating them as plain photo data', () => {
    class PhotoRecord {
      id = 'class-photo'
      src = '/class.jpg'
      width = 10
      height = 10
    }
    expect(() =>
      normalizePhotos([new PhotoRecord()], { owner: 'PhotoAlbum' }),
    ).toThrow(/plain object/)
  })

  it('preserves arbitrary non-null metadata objects', () => {
    const meta = new Date(0)
    const [photo] = normalizePhotos(
      [{ id: 'meta', src: '/meta.jpg', width: 10, height: 10, meta }],
      { owner: 'Photo' },
    ).photos
    expect(photo?.meta).toBe(meta)
  })

  it.each([null, 42, 'meta'])('rejects primitive metadata %j', (meta) => {
    expect(() =>
      normalizePhotos(
        [{ id: 'meta', src: '/meta.jpg', width: 10, height: 10, meta }],
        { owner: 'Photo' },
      ),
    ).toThrow(/field "meta" must be an object/)
  })
})
