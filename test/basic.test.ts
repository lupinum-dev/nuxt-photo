import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the album and standalone image', async () => {
    const html = await $fetch('/')
    expect(html).toContain('photo-img')
    expect(html).toContain('photo-album')
    expect(html).toContain('Standalone test image')
  })
})
