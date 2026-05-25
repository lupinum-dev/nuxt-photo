import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadImage } from '../src/image/loader'
import { IMAGE_LOAD_TIMEOUT_MS } from '../src/image/constants'

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decode?: () => Promise<void>
  complete = false
  naturalWidth = 0
  naturalHeight = 0
  private _src = ''

  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value
    // Simulate async load
    queueMicrotask(() => {
      if (value.includes('broken')) {
        this.onerror?.()
      } else {
        this.complete = true
        this.naturalWidth = 1
        this.naturalHeight = 1
        this.onload?.()
      }
    })
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage)
  // We can't clear the module-level cache between tests,
  // so each test uses a unique URL via Date.now() to avoid cache collisions
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loadImage', () => {
  it('returns ok for a valid image', async () => {
    await expect(loadImage(`/valid-${Date.now()}.jpg`)).resolves.toEqual({
      ok: true,
    })
  })

  it('returns failure for a broken image', async () => {
    await expect(loadImage(`/broken-${Date.now()}.jpg`)).resolves.toMatchObject(
      {
        ok: false,
      },
    )
  })

  it('does not cache failed loads so retries can succeed', async () => {
    const src = `/broken-retry-${Date.now()}.jpg`

    // First call: broken image
    await loadImage(src)

    // Simulate fix: next load of same src should create a new Image
    // (not return a cached resolved promise from the failed load)
    let imageCreated = false
    const OrigImage = MockImage
    vi.stubGlobal(
      'Image',
      class extends OrigImage {
        constructor() {
          super()
          imageCreated = true
        }
      },
    )

    await loadImage(src)
    expect(imageCreated).toBe(true)
  })

  it('resolves when image.decode() succeeds', async () => {
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        decode = () => Promise.resolve()
      },
    )
    await expect(loadImage(`/decode-ok-${Date.now()}.jpg`)).resolves.toEqual({
      ok: true,
    })
  })

  it('returns failure when image.decode() rejects and evicts from cache', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        decode = () => Promise.reject(new Error('decode failed'))
      },
    )

    const src = `/decode-fail-${Date.now()}.jpg`
    await expect(loadImage(src)).resolves.toMatchObject({ ok: false })
    expect(warnSpy).toHaveBeenCalled()

    // Should not be cached — next call should create a new Image
    let imageCreated = false
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        decode = () => Promise.resolve()
        constructor() {
          super()
          imageCreated = true
        }
      },
    )

    await loadImage(src)
    expect(imageCreated).toBe(true)
    warnSpy.mockRestore()
  })

  it('deduplicates concurrent loads for the same src', async () => {
    let imageCount = 0
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        constructor() {
          super()
          imageCount++
        }
      },
    )

    const src = `/dedup-${Date.now()}.jpg`
    const p1 = loadImage(src)
    const p2 = loadImage(src)

    // Same promise reference (cache hit on second call)
    expect(p1).toBe(p2)
    expect(imageCount).toBe(1)

    await Promise.all([p1, p2])
  })

  it('returns failure and evicts the cache when image decode never settles', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        decode = () => new Promise<void>(() => {})
      },
    )

    const src = `/decode-timeout-${Date.now()}.jpg`
    const promise = loadImage(src)
    await vi.advanceTimersByTimeAsync(IMAGE_LOAD_TIMEOUT_MS)

    await expect(promise).resolves.toMatchObject({ ok: false })

    let imageCreated = false
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        decode = () => Promise.resolve()
        constructor() {
          super()
          imageCreated = true
        }
      },
    )

    await loadImage(src)
    expect(imageCreated).toBe(true)
  })

  it('treats complete cached images without natural dimensions as failed loads', async () => {
    vi.stubGlobal(
      'Image',
      class extends MockImage {
        complete = true
        naturalWidth = 0
        naturalHeight = 0
      },
    )

    await expect(
      loadImage(`/cached-broken-${Date.now()}.jpg`),
    ).resolves.toMatchObject({
      ok: false,
    })
  })
})
