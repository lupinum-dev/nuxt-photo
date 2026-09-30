// @vitest-environment jsdom

import { createApp, defineComponent, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { provideLightbox } from '../src/composables/provideLightbox'
import LightboxRoot from '../src/primitives/LightboxRoot.vue'
import LightboxSlide from '../src/primitives/LightboxSlide.vue'
import LightboxViewport from '../src/primitives/LightboxViewport.vue'
import { flushUi, installBrowserStubs } from './support/runtime'
import { createNavigationMotion } from '../src/lightbox/transitions/navigation'
import { createMotionVisualState } from '../src/lightbox/transitions/visual-state'
import type { LightboxNavigationMode } from '../src/core/index'

function setup(mode: LightboxNavigationMode) {
  const visual = createMotionVisualState()
  const viewport = document.createElement('div')
  Object.defineProperty(viewport, 'clientWidth', { value: 1000 })
  visual.setViewportRef(viewport)
  const finish: Array<() => void> = []
  const frames = [0, 1, 2].map((index) => {
    const frame = document.createElement('div')
    frame.animate = vi.fn(() => {
      let done!: () => void
      const finished = new Promise<void>((resolve) => (done = resolve))
      finish.push(() => done())
      return { finished, cancel: vi.fn() } as unknown as Animation
    })
    visual.setSlideFrameRef(index)(frame)
    return frame
  })
  const activeIndex = ref(0)
  const navigation = createNavigationMotion(
    visual,
    activeIndex,
    () => mode,
    () => false,
  )
  return { navigation, frames, activeIndex, finishAll: () => finish.splice(0).forEach((f) => f()) }
}

describe('lightbox fade navigation', () => {
  it('keeps the leaving photo mounted until its fade ends', async () => {
    const { navigation, frames, activeIndex, finishAll } = setup('crossfade')
    frames[0]!.style.opacity = '1'

    activeIndex.value = 2
    navigation.play(0, 2)
    expect(navigation.leavingSlides.value).toEqual([0])
    expect(frames[2]!.animate).toHaveBeenCalled()

    finishAll()
    await vi.waitFor(() => expect(navigation.leavingSlides.value).toEqual([]))
  })

  it('continues a quick return from the opacity the photo still shows', () => {
    const { navigation, frames, activeIndex } = setup('crossfade')
    // Photo 0 was just left and is still fully visible when the reader goes back.
    frames[0]!.style.opacity = '1'

    activeIndex.value = 0
    navigation.play(1, 0)

    const [keyframes] = vi.mocked(frames[0]!.animate).mock.calls.at(-1)!
    expect((keyframes as Keyframe[])[0]!.opacity).toBe(1)
  })

  it.each([
    { deltaX: -40, velocityX: 0, changes: false },
    { deltaX: -200, velocityX: 0, changes: true },
    { deltaX: -40, velocityX: -0.8, changes: true },
    { deltaX: -40, velocityX: 0.8, changes: false },
  ])(
    'a drag of $deltaX px at $velocityX px/ms changes photo: $changes',
    ({ deltaX, velocityX, changes }) => {
      const { navigation, frames } = setup('fade')
      navigation.drag(deltaX)
      expect(frames[0]!.style.transform).toBe(`translateX(${deltaX * 0.35}px)`)

      expect(navigation.release(deltaX, velocityX)).toBe(changes)
      // A drag that stays hands the photo back to its resting style and settles it.
      if (!changes) {
        expect(frames[0]!.style.transform).toBe('')
        expect(frames[0]!.animate).toHaveBeenCalled()
      }
    },
  )
})

describe('fade navigation with custom slides', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    document.body.innerHTML = ''
  })

  it('keeps custom content on the photo that is fading out', async () => {
    // Hold every fade open so the outgoing slide is still on screen.
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: () => ({ finished: new Promise<void>(() => {}), cancel: () => {} }),
    })
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    let controller: ReturnType<typeof provideLightbox> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          controller = provideLightbox(photos, { transition: 'none', navigation: 'crossfade' })
          return () =>
            h(LightboxRoot, null, {
              default: () =>
                h(LightboxViewport, null, {
                  default: () =>
                    photos.map((photo, index) =>
                      h(
                        LightboxSlide,
                        { key: photo.id, photo, index },
                        { default: () => h('p', { class: 'custom' }, photo.id) },
                      ),
                    ),
                }),
            })
        },
      }),
    )
    app.mount(host)

    await controller!.open(0)
    await flushUi()
    controller!.next()
    await flushUi()

    const shown = [...document.querySelectorAll('.custom')].map((element) => element.textContent)
    expect(shown.sort()).toEqual(['first', 'second'])
    app.unmount()
  })
})
