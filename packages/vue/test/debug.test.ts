// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { createDebug } from '../src/core/debug/logger'

describe('debug state ownership', () => {
  it('shares one flag object across every provider logger', () => {
    const first = createDebug()
    const second = createDebug()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    expect(first.flags).toBe(second.flags)
    expect(window.__NUXT_PHOTO_DEBUG__).toBe(first.flags)

    first.flags.images = true
    second.log('images', 'shared')
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('[lightbox:images]'),
      expect.any(String),
      'shared',
    )

    first.flags.images = false
    log.mockRestore()
  })
})
