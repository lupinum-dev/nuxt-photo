// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref, type Component } from 'vue'
import { Photo, PhotoAlbum, PhotoGroup, PhotoCarousel, type GalleryHandle } from '../src'
import { makePhoto } from '@test-fixtures/photos'
import { flushUi, installBrowserStubs } from './support/runtime'

beforeEach(installBrowserStubs)
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const recipes: Array<{ name: string; recipe: Component }> = [
  { name: 'Photo', recipe: Photo },
  { name: 'PhotoAlbum', recipe: PhotoAlbum },
  { name: 'PhotoGroup', recipe: PhotoGroup },
  { name: 'PhotoCarousel', recipe: PhotoCarousel },
]

async function settleImages() {
  await flushUi()
  document.body
    .querySelectorAll('.np-lightbox img')
    .forEach((image) => image.dispatchEvent(new Event('load')))
  await flushUi()
}

it.each(recipes)(
  'supports the gallery handle and bidirectional active model on $name',
  async ({ recipe }) => {
    const photos = [makePhoto({ id: 'A' }), makePhoto({ id: 'X' })]
    const active = ref<string | null>(null)
    const handle = ref<GalleryHandle | null>(null)
    const updates: Array<string | null> = []
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(
      defineComponent({
        render: () =>
          h(recipe, {
            ref: handle,
            ...(recipe === Photo ? { photo: photos[0]! } : { photos }),
            active: active.value,
            lightbox: recipe === PhotoCarousel ? { transition: 'none' } : true,
            transition: 'none',
            'onUpdate:active': (id: string | null) => {
              updates.push(id)
              active.value = id
            },
          }),
      }),
    )
    app.mount(host)
    try {
      await flushUi()
      expect(Object.keys(handle.value!).sort()).toEqual(
        (recipe === PhotoCarousel
          ? [
              'open',
              'openById',
              'close',
              'isOpen',
              'activeId',
              'activePhoto',
              'scrollTo',
              'next',
              'prev',
            ]
          : ['open', 'openById', 'close', 'isOpen', 'activeId', 'activePhoto']
        ).sort(),
      )
      expect(handle.value!.activeId).toBeNull()
      expect(handle.value!.activePhoto).toBeNull()
      active.value = 'A'
      await settleImages()
      expect(handle.value!.isOpen).toBe(true)
      expect(handle.value!.activeId).toBe('A')
      expect(handle.value!.activePhoto?.id).toBe('A')
      if (recipe !== Photo) {
        active.value = 'X'
        await settleImages()
        expect(handle.value!.activeId).toBe('X')
        ;(document.body.querySelector('.np-lightbox__btn--prev') as HTMLElement).click()
        await flushUi()
        expect(active.value).toBe('A')
        expect(updates).toContain('A')
      }
      active.value = null
      await flushUi()
      expect(handle.value!.isOpen).toBe(false)
      expect(handle.value!.activePhoto).toBeNull()
      const opening = handle.value!.openById('A')
      await settleImages()
      await opening
      expect(active.value).toBe('A')
      ;(document.body.querySelector('.np-lightbox__btn--close') as HTMLElement).click()
      await flushUi()
      expect(active.value).toBeNull()
      await expect(handle.value!.openById('missing')).rejects.toThrow(/No photo found/)
    } finally {
      app.unmount()
      host.remove()
    }
  },
)

it('ignores unknown parent ids with one development warning', async () => {
  const active = ref<string | null>('A')
  const handle = ref<GalleryHandle | null>(null)
  const warn = vi.spyOn(console, 'warn')
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(PhotoAlbum, {
        ref: handle,
        photos: [makePhoto({ id: 'A' })],
        active: active.value,
        transition: 'none',
      }),
  })
  app.mount(host)
  try {
    await flushUi()
    active.value = 'unknown'
    await flushUi()
    active.value = 'also-unknown'
    await flushUi()
    expect(handle.value!.activeId).toBe('A')
    expect(
      warn.mock.calls.filter(([text]) => String(text).includes('ignored unknown active photo id')),
    ).toHaveLength(1)
  } finally {
    app.unmount()
    host.remove()
  }
})

it('retains album identity through reorder and insertion, and closes when that id is removed', async () => {
  const photos = ref(['A', 'X', 'B'].map((id) => makePhoto({ id })))
  const active = ref<string | null>('X')
  const handle = ref<GalleryHandle | null>(null)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(PhotoAlbum, {
        ref: handle,
        photos: photos.value,
        active: active.value,
        transition: 'none',
        'onUpdate:active': (id: string | null) => {
          active.value = id
        },
      }),
  })
  app.mount(host)
  try {
    await flushUi()
    photos.value = [photos.value[2]!, makePhoto({ id: 'new' }), photos.value[1]!, photos.value[0]!]
    await flushUi()
    expect(handle.value!.activeId).toBe('X')
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('3 / 4')
    photos.value = photos.value.filter((photo) => photo.id !== 'X')
    await flushUi()
    expect(active.value).toBeNull()
    expect(handle.value!.isOpen).toBe(false)
  } finally {
    app.unmount()
    host.remove()
  }
})

it('honors a parent close while its open request is still pending', async () => {
  const active = ref<string | null>(null)
  const handle = ref<GalleryHandle | null>(null)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp({
    render: () =>
      h(PhotoAlbum, {
        ref: handle,
        photos: [makePhoto({ id: 'A' })],
        active: active.value,
        transition: 'none',
      }),
  })
  app.mount(host)
  try {
    await flushUi()
    active.value = 'A'
    await nextTick()
    active.value = null
    await settleImages()
    expect(handle.value!.isOpen).toBe(false)
    expect(handle.value!.activeId).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  } finally {
    app.unmount()
    host.remove()
  }
})
