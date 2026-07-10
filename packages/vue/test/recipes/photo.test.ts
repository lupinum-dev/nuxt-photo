// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../../src/components/Photo.vue'
import {
  flushUi,
  installBrowserStubs,
  mountComponent,
} from '../support/runtime'

describe('Photo', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders thumb semantics and is inert by default', async () => {
    const mounted = await mountComponent(Photo, {
      props: { photo: makePhoto({ id: 'plain' }) },
    })
    const figure = mounted.container.querySelector('figure')
    const image = mounted.container.querySelector('img')
    expect(figure?.getAttribute('role')).toBeNull()
    expect(image?.getAttribute('loading')).toBe('lazy')
    mounted.unmount()
  })

  it('keeps setup-time lightbox capability stable and warns on changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const photo = makePhoto({ id: 'static-photo' })
    const { createApp, defineComponent, h, ref } = await import('vue')
    const lightbox = ref(false)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent(
        () => () => h(Photo, { photo, lightbox: lightbox.value }),
      ),
    )
    app.mount(host)
    lightbox.value = true
    await flushUi()
    expect(host.querySelector('figure')?.getAttribute('role')).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('setup-time'))
    app.unmount()
  })
})
