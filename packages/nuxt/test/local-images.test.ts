import { mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vite-plus/test'
import { readLocalImages } from '../src/local-images'
import { createLocalImageDimensionsResolver } from '../src/runtime/local-image-dimensions'

async function dimensions(dir: string, logger: { warn: (message: string) => void }) {
  const records = await readLocalImages(dir, logger, { previews: false, clientManifest: true })
  return Object.fromEntries(
    Object.entries(records).map(([src, value]) => [src, [value.width, value.height]]),
  )
}
const fixtureDir = new URL('./fixtures/local-images/public/', import.meta.url).pathname

describe('local image dimensions', () => {
  it('reads real public files and swaps EXIF orientation dimensions', async () => {
    const warn = vi.fn()
    expect(await dimensions(fixtureDir, { warn })).toEqual({
      '/photo.jpg': [32, 24],
      '/nested/photo.png': [18, 12],
      '/nested/constructor.png': [18, 12],
      '/photo.svg': [26, 16],
      '/with space.png': [14, 10],
      '/oriented.jpg': [20, 40],
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('follows public symlinks without recursing through directory cycles', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nuxt-photo-links-'))
    try {
      await symlink(join(fixtureDir, 'nested'), join(dir, 'linked'), 'dir')
      await symlink(dir, join(dir, 'cycle'), 'dir')
      expect(await dimensions(dir, { warn: vi.fn() })).toEqual({
        '/linked/photo.png': [18, 12],
        '/linked/constructor.png': [18, 12],
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('creates small WebP previews, reuses the cache and refreshes a changed file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nuxt-photo-preview-'))
    const cacheDir = join(dir, 'cache')
    const warn = vi.fn()
    try {
      const file = join(dir, 'image.png')
      await writeFile(file, await readFile(join(fixtureDir, 'nested/photo.png')))
      const options = {
        rootDir: new URL('../../../playground', import.meta.url).pathname,
        cacheDir,
      }
      const first = await readLocalImages(dir, { warn }, options)
      expect(first['/image.png']?.placeholderSrc).toMatch(/^data:image\/webp;base64,/)
      const { imageSize } = await import('image-size')
      const preview = Buffer.from(first['/image.png']!.placeholderSrc!.split(',')[1]!, 'base64')
      expect(imageSize(preview)).toMatchObject({ width: 18, height: 12, type: 'webp' })
      expect(await readLocalImages(dir, { warn }, options)).toEqual(first)
      await writeFile(file, await readFile(join(fixtureDir, 'with space.png')))
      const changed = await readLocalImages(dir, { warn }, options)
      expect(changed['/image.png']).toMatchObject({ width: 14, height: 10 })
      expect(changed['/image.png']?.placeholderSrc).not.toBe(first['/image.png']?.placeholderSrc)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('applies EXIF orientations 5–8 from JPEGs created deterministically at setup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nuxt-photo-exif-'))
    const jpeg = await readFile(join(fixtureDir, 'photo.jpg'))
    // APP1 Exif: little-endian TIFF, one SHORT orientation entry, no next IFD.
    const app1 = Buffer.from(
      'ffe1002245786966000049492a0008000000010012010300010000000100000000000000',
      'hex',
    )
    try {
      for (const orientation of [1, 4, 5, 6, 7, 8]) {
        app1.writeUInt16LE(orientation, 28)
        await writeFile(
          join(dir, `${orientation}.jpg`),
          Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]),
        )
      }
      expect(await dimensions(dir, { warn: vi.fn() })).toEqual({
        '/1.jpg': [32, 24],
        '/4.jpg': [32, 24],
        '/5.jpg': [24, 32],
        '/6.jpg': [24, 32],
        '/7.jpg': [24, 32],
        '/8.jpg': [24, 32],
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('skips unreadable files in one warning and handles additions, changes and removals', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nuxt-photo-local-'))
    const warn = vi.fn()
    try {
      await writeFile(join(dir, 'bad.jpg'), 'not an image')
      await writeFile(join(dir, 'bad.png'), '')
      const image = join(dir, 'new.svg')
      await writeFile(image, '<svg width="8" height="4"/>')
      expect(await dimensions(dir, { warn })).toEqual({ '/new.svg': [8, 4] })
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('/bad.jpg, /bad.png'))
      await writeFile(image, '<svg width="12" height="6"/>')
      expect(await dimensions(dir, { warn })).toEqual({ '/new.svg': [12, 6] })
      await rm(image)
      expect(await dimensions(dir, { warn })).toEqual({})
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('warns about client size only for opted-in manifests above 2,000 entries', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nuxt-photo-local-'))
    const warn = vi.fn()
    try {
      await Promise.all(
        Array.from({ length: 2000 }, (_, index) =>
          writeFile(join(dir, `${index}.svg`), '<svg width="8" height="4"/>'),
        ),
      )
      expect(Object.keys(await dimensions(dir, { warn }))).toHaveLength(2000)
      expect(warn).not.toHaveBeenCalled()
      await writeFile(join(dir, 'extra.svg'), '<svg width="8" height="4"/>')
      expect(Object.keys(await dimensions(dir, { warn }))).toHaveLength(2001)
      expect(warn).toHaveBeenCalledOnce()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('more than 2,000'))
      warn.mockClear()
      await readLocalImages(dir, { warn }, { previews: false })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }, 30_000)

  it.each([
    ['/photo.jpg', { width: 32, height: 24 }],
    ['/gallery/photo.jpg?x=1#photo', { width: 32, height: 24 }],
    ['/gallery/with%20space.png', { width: 14, height: 10 }],
    ['/with space.png', { width: 14, height: 10 }],
    ['/gallery-other/photo.jpg', undefined],
    ['/bad%ZZ.png', undefined],
    ['https://host/photo.jpg', undefined],
    ['http://host/photo.jpg', undefined],
    ['//host/photo.jpg', undefined],
    ['toString', undefined],
  ])('resolves %s', (src, expected) => {
    const resolve = createLocalImageDimensionsResolver(
      {
        '/photo.jpg': { width: 32, height: 24 },
        '/with space.png': { width: 14, height: 10 },
      },
      '/gallery/',
    )
    expect(resolve(src)).toEqual(expected)
  })
})
