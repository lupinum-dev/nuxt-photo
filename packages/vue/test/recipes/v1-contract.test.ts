// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../../src/components/Photo.vue'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
import PhotoImage from '../../src/primitives/PhotoImage.vue'
import { providePhotoLabels } from '../../src/provide/labels'
import { flushUi, installBrowserStubs, mountComponent } from '../support/runtime'

type ExposedRecipe = {
  open(index?: number): Promise<void>
  openById(id: string): Promise<void>
  close(): Promise<void>
  isOpen: boolean
}

function mountWithRef(component: object, props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const handle = ref<ExposedRecipe | null>(null)
  const app = createApp(defineComponent(() => () => h(component, { ...props, ref: handle })))
  app.mount(host)
  return { app, host, handle }
}

describe('Vue 1.0 recipe contract', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it.each([
    ['Photo', Photo, { photo: makePhoto({ id: 'photo' }) }],
    ['PhotoAlbum', PhotoAlbum, { photos: [makePhoto({ id: 'album' })] }],
    ['PhotoCarousel', PhotoCarousel, { photos: [makePhoto({ id: 'carousel' })] }],
    ['PhotoGroup', PhotoGroup, { photos: [makePhoto({ id: 'group' })] }],
  ])('exposes the common lightbox controller from %s', async (_, component, props) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mounted = mountWithRef(component, { ...props, lightbox: false })
    await nextTick()

    expect(mounted.handle.value?.open).toBeTypeOf('function')
    expect(mounted.handle.value?.openById).toBeTypeOf('function')
    expect(mounted.handle.value?.close).toBeTypeOf('function')
    expect(mounted.handle.value?.isOpen).toBe(false)
    await expect(mounted.handle.value?.open(99)).resolves.toBeUndefined()
    await expect(mounted.handle.value?.openById('missing')).resolves.toBeUndefined()
    await expect(mounted.handle.value?.close()).resolves.toBeUndefined()
    expect(warn).not.toHaveBeenCalled()

    mounted.app.unmount()
    mounted.host.remove()
  })

  it('exposes explicitly named carousel navigation', async () => {
    const mounted = mountWithRef(PhotoCarousel, {
      photos: [makePhoto({ id: 'one' }), makePhoto({ id: 'two' })],
      lightbox: false,
    })
    await nextTick()

    const carousel = mounted.handle.value as ExposedRecipe & {
      goToSlide(index: number): void
      goToNextSlide(): void
      goToPreviousSlide(): void
      selectedIndex: number
    }
    expect(carousel.goToSlide).toBeTypeOf('function')
    expect(carousel.goToNextSlide).toBeTypeOf('function')
    expect(carousel.goToPreviousSlide).toBeTypeOf('function')
    expect(carousel.selectedIndex).toBe(0)

    mounted.app.unmount()
    mounted.host.remove()
  })

  it('recovers a dropped standalone Photo when its data becomes valid', async () => {
    const current = ref({ id: '', src: '/bad.jpg', width: 0, height: 10 })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent(
        () => () => h(Photo, { photo: current.value, validation: 'drop', transition: 'none' }),
      ),
    )
    app.mount(host)
    await flushUi()
    expect(host.querySelector('figure')).toBeNull()

    current.value = makePhoto({ id: 'recovered' })
    await flushUi()
    const trigger = host.querySelector('button.np-photo') as HTMLElement
    expect(trigger).not.toBeNull()
    trigger.click()
    await flushUi()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()

    current.value = { id: '', src: '/bad-again.jpg', width: 0, height: 10 }
    await flushUi()
    expect(host.querySelector('figure')).toBeNull()

    app.unmount()
    host.remove()
  })

  it('revalidates reactive Photo data under throw policy', async () => {
    const current = ref(makePhoto({ id: 'valid-first' }))
    const errorHandler = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent(() => () => h(Photo, { photo: current.value, validation: 'throw' })),
    )
    app.config.errorHandler = errorHandler
    app.mount(host)

    current.value = { id: '', src: '/invalid.jpg', width: 10, height: 10 }
    await flushUi()
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'PhotoValidationError' }),
      expect.anything(),
      expect.any(String),
    )

    app.unmount()
    host.remove()
  })
})

describe('reactive labels and placeholders', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('updates indexed labels from one reactive provider', async () => {
    const locale = ref<'en' | 'de'>('en')
    const mounted = await mountComponent(
      defineComponent({
        setup() {
          providePhotoLabels(() =>
            locale.value === 'de'
              ? { viewPhoto: (index) => `Foto ${index}` }
              : { viewPhoto: (index) => `View ${index}` },
          )
          return () => h(PhotoAlbum, { photos: [makePhoto({ id: 'localized', alt: undefined })] })
        },
      }),
    )

    expect(
      mounted.container.querySelector('button.np-album__item')?.getAttribute('aria-label'),
    ).toBe('View 1')
    locale.value = 'de'
    await flushUi()
    expect(
      mounted.container.querySelector('button.np-album__item')?.getAttribute('aria-label'),
    ).toBe('Foto 1')
    mounted.unmount()
  })

  it('uses the resolved counter label for visible and announced text', async () => {
    const locale = ref<'en' | 'de'>('en')
    const mounted = await mountComponent(
      defineComponent({
        setup() {
          providePhotoLabels(() => ({
            counter: (index, count) =>
              locale.value === 'de' ? `Bild ${index} von ${count}` : `${index} of ${count}`,
          }))
          return () =>
            h(PhotoAlbum, {
              photos: [makePhoto({ id: 'one' }), makePhoto({ id: 'two' })],
              transition: 'none',
            })
        },
      }),
    )

    ;(mounted.container.querySelector('button.np-album__item') as HTMLElement).click()
    await flushUi()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('1 of 2')
    expect(document.body.querySelector('[data-np-sr-only]')?.textContent).toContain('1 of 2')

    locale.value = 'de'
    await flushUi()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain(
      'Bild 1 von 2',
    )
    expect(document.body.querySelector('[data-np-sr-only]')?.textContent).toContain('Bild 1 von 2')
    mounted.unmount()
  })

  it('resets the placeholder when a custom adapter source changes and retains it on failure', async () => {
    const source = ref('/full-a.jpg')
    const mounted = await mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(PhotoImage, {
              photo: makePhoto({ id: 'placeholder', placeholder: '/preview.jpg' }),
              imageAdapter: () => ({ src: source.value, placeholder: '/preview.jpg' }),
            })
        },
      }),
    )
    const image = mounted.container.querySelector('img') as HTMLImageElement
    expect(image.style.backgroundImage).toContain('/preview.jpg')

    image.dispatchEvent(new Event('load'))
    await flushUi()
    expect(image.style.backgroundImage).toBe('')

    source.value = '/full-b.jpg'
    await flushUi()
    expect(image.getAttribute('src')).toBe('/full-b.jpg')
    expect(image.style.backgroundImage).toContain('/preview.jpg')

    image.dispatchEvent(new Event('error'))
    await flushUi()
    expect(image.style.backgroundImage).toContain('/preview.jpg')
    mounted.unmount()
  })
})
