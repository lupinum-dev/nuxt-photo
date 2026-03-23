import { describe, expect, it } from 'vitest'
import * as publicApi from '../src/module'

describe('public api', () => {
  it('exports only the canonical NuxtPhoto surface', () => {
    expect(publicApi).toHaveProperty('default')
    expect(publicApi).toHaveProperty('PhotoImage')
    expect(publicApi).toHaveProperty('PhotoAlbum')
    expect(publicApi).toHaveProperty('PhotoImg')
    expect(publicApi).toHaveProperty('PhotoGallery')
    expect(publicApi).toHaveProperty('PhotoLightbox')
    expect(publicApi).toHaveProperty('usePhotoLightbox')
    expect(publicApi).toHaveProperty('usePhotoAlbumLayout')
    expect(publicApi).toHaveProperty('usePhotoGroup')

    expect(publicApi).not.toHaveProperty('NuxtMasonry')
    expect(publicApi).not.toHaveProperty('PhotoSwipe')
    expect(publicApi).not.toHaveProperty('PhotoSwipeGallery')
    expect(publicApi).not.toHaveProperty('usePhotoSwipe')
    expect(publicApi).not.toHaveProperty('useSharedPhotoLightbox')
    expect(publicApi).not.toHaveProperty('PhotoSwipeToolbar')
    expect(publicApi).not.toHaveProperty('PhotoSwipeButton')
  })
})
