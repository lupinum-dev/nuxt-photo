import { describe, expect, it } from 'vitest'
import * as api from '@nuxt-photo/recipes'

describe('@nuxt-photo/recipes public API', () => {
  it('exports the intended recipe components', () => {
    expect(api).toHaveProperty('Photo')
    expect(api).toHaveProperty('PhotoAlbum')
    expect(api).toHaveProperty('PhotoGroup')
    expect(api).toHaveProperty('PhotoCarousel')
    expect(api).toHaveProperty('Lightbox')
  })
})
