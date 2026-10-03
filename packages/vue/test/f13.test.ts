// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, ref } from 'vue'
import PhotoCarousel from '../src/components/PhotoCarousel.vue'
import { makePhoto } from '@test-fixtures/photos'
import { flushUi, installBrowserStubs } from './support/runtime'

beforeEach(() => {
  installBrowserStubs()
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains('np-carousel__slide') ? 300 : 600
    },
  )
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
    function (this: HTMLElement) {
      const index = Array.from(this.parentElement?.children ?? []).indexOf(this)
      return this.classList.contains('np-carousel__slide')
        ? Math.max(0, index) * 300
        : this.classList.contains('np-lightbox__slide')
          ? Math.max(0, index) * 600
          : 0
    },
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

// F13: real Embla and MutationObserver must not replace photo identity with an old numeric snap.
it('keeps photo X in both the open lightbox and inline carousel after removing an earlier photo', async () => {
  const photos = ref(['before', 'middle', 'X', 'after'].map((id) => makePhoto({ id, caption: id })))
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(
    defineComponent({
      render: () => h(PhotoCarousel, { photos: photos.value, lightbox: true, transition: 'none' }),
    }),
  )
  app.mount(host)
  try {
    await flushUi()
    ;(host.querySelectorAll('.np-carousel__thumb')[2] as HTMLElement).click()
    await flushUi()
    expect(host.querySelector('.np-carousel__caption')?.textContent?.trim()).toBe('X')
    ;(host.querySelectorAll('.np-carousel__slide')[2] as HTMLElement).click()
    await flushUi()
    document.body
      .querySelectorAll('.np-lightbox img')
      .forEach((image) => image.dispatchEvent(new Event('load')))
    await flushUi()
    expect(document.body.querySelector('[data-np-active] img')?.getAttribute('src')).toBe(
      photos.value[2]!.src,
    )
    photos.value = photos.value.slice(1)
    await flushUi(12)
    expect(document.body.querySelector('[data-np-active] img')?.getAttribute('src')).toBe(
      photos.value[1]!.src,
    )
    expect(host.querySelector('.np-carousel__caption')?.textContent?.trim()).toBe('X')
    expect(host.querySelector('.np-carousel__counter')?.textContent).toContain('2 / 3')
  } finally {
    app.unmount()
    host.remove()
  }
})

it('exposes inline scrollTo, next, and prev without opening the lightbox', async () => {
  const photos = ['A', 'X', 'B'].map((id) => makePhoto({ id, caption: id }))
  const handle = ref<{
    scrollTo(index: number): void
    next(): void
    prev(): void
    isOpen: boolean
    activeId: string | null
  } | null>(null)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({ render: () => h(PhotoCarousel, { ref: handle, photos }) })
  app.mount(host)
  try {
    await flushUi()
    handle.value!.scrollTo(1)
    await flushUi()
    expect(host.querySelector('.np-carousel__caption')?.textContent?.trim()).toBe('X')
    handle.value!.next()
    await flushUi()
    expect(host.querySelector('.np-carousel__caption')?.textContent?.trim()).toBe('B')
    handle.value!.prev()
    await flushUi()
    expect(host.querySelector('.np-carousel__caption')?.textContent?.trim()).toBe('X')
    expect(handle.value!.isOpen).toBe(false)
    expect(handle.value!.activeId).toBeNull()
  } finally {
    app.unmount()
    host.remove()
  }
})
