// @vitest-environment jsdom

import { createApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { provideLightbox } from '../src/composables/provideLightbox'
import LightboxRoot from '../src/primitives/LightboxRoot.vue'
import { flushUi, installBrowserStubs } from './support/runtime'

describe('LightboxRoot modal ownership', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('isolates late page siblings and restores focus and page state', async () => {
    const photo = makePhoto({ id: 'focus-photo' })
    let controller: ReturnType<typeof provideLightbox> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const App = defineComponent({
      setup() {
        controller = provideLightbox([photo], { transition: 'none' })
        return () =>
          h('div', [
            h('button', { id: 'trigger', ref: controller!.setThumbnailRef(0) }, 'Open'),
            h(
              LightboxRoot,
              { 'data-testid': 'lightbox-root' },
              { default: () => h('button', { id: 'inside' }, 'Inside') },
            ),
          ])
      },
    })
    const app = createApp(App)
    app.mount(host)
    const trigger = host.querySelector('#trigger') as HTMLButtonElement
    trigger.focus()
    trigger.blur()
    expect(document.activeElement).toBe(document.body)

    await controller!.open(0)
    await flushUi()
    expect(host.inert).toBe(true)
    expect(host.getAttribute('aria-hidden')).toBe('true')
    expect(document.activeElement?.getAttribute('data-testid')).toBe('lightbox-root')
    const root = document.querySelector('[data-testid="lightbox-root"]') as HTMLElement
    root.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    )
    expect(document.activeElement?.id).toBe('inside')
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    )
    expect(document.activeElement?.id).toBe('inside')

    const lateSibling = document.createElement('aside')
    document.body.appendChild(lateSibling)
    await flushUi()
    expect(lateSibling.inert).toBe(true)
    expect(lateSibling.getAttribute('aria-hidden')).toBe('true')

    await controller!.close()
    await flushUi()
    expect(host.inert).toBeFalsy()
    expect(host.hasAttribute('aria-hidden')).toBe(false)
    expect(lateSibling.inert).toBeFalsy()
    expect(lateSibling.hasAttribute('aria-hidden')).toBe(false)
    expect(document.activeElement).toBe(trigger)

    app.unmount()
  })
})
