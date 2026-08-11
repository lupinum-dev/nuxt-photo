// @vitest-environment jsdom

import { createApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { useLightboxProvider } from '../src/composables/useLightboxProvider'
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
    let controller: ReturnType<typeof useLightboxProvider> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const App = defineComponent({
      setup() {
        controller = useLightboxProvider([photo], { transition: 'none' })
        return () =>
          h('div', [
            h('button', { id: 'trigger' }, 'Open'),
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
