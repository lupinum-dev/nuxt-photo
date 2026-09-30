// @vitest-environment jsdom

import { ref } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'
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
