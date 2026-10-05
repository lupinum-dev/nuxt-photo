// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test'
import { Photo, PhotoAlbum, PhotoCarousel } from '../../src'
import { makePhoto } from '@test-fixtures/photos'
import { installBrowserStubs, mountComponent } from '../support/runtime'

beforeEach(installBrowserStubs)
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

// Catch ui classes replacing built-in classes or landing on the wrong element.
it.each([
  [Photo, { root: 'np-photo', img: 'np-photo__img', caption: 'np-photo__caption' }],
  [PhotoAlbum, { root: 'np-album', item: 'np-album__item', img: 'np-album__img' }],
  [
    PhotoCarousel,
    {
      root: 'np-carousel',
      slide: 'np-carousel__slide',
      img: 'np-carousel__media',
      thumb: 'np-carousel__thumb',
      caption: 'np-carousel__caption',
      controls: 'np-carousel__controls',
    },
  ],
] as const)('merges the ui keys into recipe classes', async (component, classes) => {
  const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
  const ui = Object.fromEntries(Object.keys(classes).map((key) => [key, `custom-${key}`]))
  const mounted = await mountComponent(component, {
    props: {
      ...(component === Photo ? { photo: photos[0] } : { photos }),
      ui,
      lightbox: false,
      class: 'consumer-root',
    },
  })
  for (const [key, builtin] of Object.entries(classes)) {
    const element = mounted.container.querySelector(`.${builtin}`)
    expect(element, key).not.toBeNull()
    expect(element?.classList.contains(`custom-${key}`), key).toBe(true)
  }
  expect(
    mounted.container.querySelector(`.${classes.root}`)?.classList.contains('consumer-root'),
  ).toBe(true)
  mounted.unmount()
})
