import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ensureImageLoaded } from '../src/image/loader'

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decode?: () => Promise<void>
  complete = false
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

describe('ensureImageLoaded', () => {
  it('resolves for a valid image', async () => {
    await expect(ensureImageLoaded(`/valid-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('resolves (does not reject) for a broken image', async () => {
    await expect(ensureImageLoaded(`/broken-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('does not cache failed loads so retries can succeed', async () => {
    const src = `/broken-retry-${Date.now()}.jpg`

    // First call: broken image
    await ensureImageLoaded(src)

    // Simulate fix: next load of same src should create a new Image
    // (not return a cached resolved promise from the failed load)
    let imageCreated = false
    const OrigImage = MockImage
    vi.stubGlobal('Image', class extends OrigImage {
      constructor() {
        super()
        imageCreated = true
      }
    })

    await ensureImageLoaded(src)
    expect(imageCreated).toBe(true)
  })

  it('resolves when image.decode() succeeds', async () => {
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.resolve()
    })
    await expect(ensureImageLoaded(`/decode-ok-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('resolves when image.decode() rejects and evicts from cache', async () => {
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.reject(new Error('decode failed'))
    })

    const src = `/decode-fail-${Date.now()}.jpg`
    await ensureImageLoaded(src)

    // Should not be cached — next call should create a new Image
    let imageCreated = false
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.resolve()
      constructor() {
        super()
        imageCreated = true
      }
    })

    await ensureImageLoaded(src)
    expect(imageCreated).toBe(true)
  })

  it('deduplicates concurrent loads for the same src', async () => {
    let imageCount = 0
    vi.stubGlobal('Image', class extends MockImage {
      constructor() {
        super()
        imageCount++
      }
    })

    const src = `/dedup-${Date.now()}.jpg`
    const p1 = ensureImageLoaded(src)
    const p2 = ensureImageLoaded(src)

    // Same promise reference (cache hit on second call)
    expect(p1).toBe(p2)
    expect(imageCount).toBe(1)

    await Promise.all([p1, p2])
  })
})
