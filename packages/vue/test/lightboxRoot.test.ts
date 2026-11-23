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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  // The browser supplies inertness and the focus trap (checked in Playwright). Here: the root
  // becomes a modal dialog, Escape and a forced close end in the closed state, focus returns.
  it.each(['cancel', 'forced close'] as const)(
    'opens as a modal dialog and closes cleanly after %s',
    async (request) => {
      const photo = makePhoto({ id: 'focus-photo' })
      let controller: ReturnType<typeof provideLightbox> | null = null
      const host = document.createElement('main')
      document.body.appendChild(host)
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
      const App = defineComponent({
        setup() {
          controller = provideLightbox([photo], { transition: 'none' })
          return () =>
            h('div', [
              h('button', { id: 'trigger' }, 'Open'),
              h(LightboxRoot, { 'aria-label': 'Viewer' }, { default: () => h('button', 'Inside') }),
            ])
        },
      })
      const app = createApp(App)
      app.mount(host)
      const trigger = host.querySelector('#trigger') as HTMLButtonElement
      trigger.focus()

      await controller!.open(0)
      await flushUi()
      const dialog = document.querySelector('dialog')!
      expect(dialog.getAttribute('aria-label')).toBe('Viewer')
      expect(showModal).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(dialog)

      if (request === 'cancel') {
        const cancel = new Event('cancel', { cancelable: true })
        dialog.dispatchEvent(cancel)
        expect(cancel.defaultPrevented).toBe(true)
      } else {
        // The browser closed the dialog itself; it is shown again until the close finishes.
        dialog.close()
        expect(showModal).toHaveBeenCalledTimes(2)
      }
      await flushUi()
      expect(controller!.isOpen.value).toBe(false)
      expect(document.querySelector('dialog')).toBeNull()
      expect(document.body.style.overflow).toBe('')
      expect(document.activeElement).toBe(trigger)

      app.unmount()
    },
  )

  it('returns focus to the thumbnail of the photo being viewed on close', async () => {
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    let controller: ReturnType<typeof provideLightbox> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const App = defineComponent({
      setup() {
        controller = provideLightbox(
          photos,
          { transition: 'none' },
          { thumbnailFor: (id) => document.getElementById(id) },
        )
        return () =>
          h('div', [
            ...photos.map((photo) => h('button', { id: photo.id }, photo.id)),
            h(LightboxRoot, null, { default: () => h('button', 'Inside') }),
          ])
      },
    })
    const app = createApp(App)
    app.mount(host)
    ;(host.querySelector('#first') as HTMLButtonElement).focus()

    await controller!.open(0)
    await controller!.open(1)
    await controller!.close()
    await flushUi()

    expect(document.activeElement?.id).toBe('second')
    app.unmount()
  })
})
