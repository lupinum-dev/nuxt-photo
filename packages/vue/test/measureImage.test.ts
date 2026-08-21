// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { measureImage } from '../src/core/image/measure'

function stubImage(naturalWidth: number, naturalHeight: number) {
  const instances: Array<{ src: string; onload: null | (() => void); onerror: null | (() => void) }> = []
  vi.stubGlobal(
    'Image',
    class {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      naturalWidth = naturalWidth
      naturalHeight = naturalHeight
      src = ''
      constructor() {
        instances.push(this)
      }
    },
  )
  return instances
}

describe('measureImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves intrinsic dimensions and caches by URL', async () => {
    const instances = stubImage(1600, 1000)
    const pending = measureImage('/photos/a.jpg')
    const image = instances[0]!
    image.src = '/photos/a.jpg'
    image.onload!()

    await expect(pending).resolves.toEqual({ width: 1600, height: 1000 })

    // Second call resolves from cache without constructing an Image.
    await expect(measureImage('/photos/a.jpg')).resolves.toEqual({ width: 1600, height: 1000 })
    expect(instances).toHaveLength(1)
  })

  it('rejects when the source fails to load', async () => {
    const instances = stubImage(0, 0)
    const pending = measureImage('/photos/missing.jpg')
    const image = instances[0]!
    image.src = '/photos/missing.jpg'
    image.onerror!()

    await expect(pending).rejects.toThrow(/could not load/)
  })
})
