// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useContainerWidth } from '../src/composables/useContainerWidth'

function mountWidthProbe(width: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 100,
      width,
      height: 100,
      toJSON: () => ({}),
    }),
  )

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe() {
        this.callback(
          [
            {
              contentRect: { width },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        )
      }

      disconnect() {}
    },
  )

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(
    defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        const { containerWidth } = useContainerWidth(el, {
          breakpoints: [600, 900],
        })

        return () =>
          h('div', {
            ref: el,
            'data-width': String(containerWidth.value),
          })
      },
    }),
  )

  app.mount(container)

  return { app, container }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useContainerWidth', () => {
  it('keeps real widths below the smallest breakpoint', async () => {
    const { app, container } = mountWidthProbe(500)
    await nextTick()

    expect(
      container.querySelector('[data-width]')?.getAttribute('data-width'),
    ).toBe('500')

    app.unmount()
  })

  it('snaps widths down to the largest matching breakpoint', async () => {
    const { app, container } = mountWidthProbe(650)
    await nextTick()

    expect(
      container.querySelector('[data-width]')?.getAttribute('data-width'),
    ).toBe('600')

    app.unmount()
  })
})
