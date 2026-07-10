// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  createGhostState,
  resetOpenState,
  resetCloseState,
  setThumbRef,
} from '../src/lightbox/transitions/state'
import { openTransition } from '../src/lightbox/transitions/open'
import { createCloseTransition } from '../src/lightbox/transitions/close'
import type {
  CloseCallbacks,
  GhostState,
  TransitionCallbacks,
} from '../src/lightbox/transitions/types'
import { createPhotoSet } from '@test-fixtures/photos'

function makeGhostState(
  getAbsoluteFrameRect: GhostState['getAbsoluteFrameRect'] = () => null,
  currentPhoto = computed(() => createPhotoSet()[0] ?? null),
): GhostState {
  return createGhostState(
    ref(0),
    currentPhoto,
    ref({ left: 0, top: 0, width: 1200, height: 800 }),
    getAbsoluteFrameRect,
  )
}

function usableRect(): DOMRect {
  return {
    left: 10,
    top: 20,
    width: 640,
    height: 420,
    right: 650,
    bottom: 440,
    x: 10,
    y: 20,
    toJSON: () => ({}),
  } as DOMRect
}

function makeTransitionCallbacks(): TransitionCallbacks {
  return {
    prepareActiveSlide: () => Promise.resolve(),
    resetGestureState: () => {},
    cancelTapTimer: () => {},
    getThumbSrc: (photo) => photo.thumbSrc ?? photo.src,
    getSlideSrc: (photo) => photo.src,
    loadSlideImage: () => Promise.resolve({ ok: true }),
  }
}

function makeCloseCallbacks(): CloseCallbacks {
  return {
    ...makeTransitionCallbacks(),
    syncGeometry: () => {},
    setPanzoomImmediate: () => {},
    isZoomedIn: computed(() => false),
  }
}

describe('resetOpenState', () => {
  it('resets all properties to the "lightbox is open" state', () => {
    const state = makeGhostState()

    // Simulate a partially-completed open transition
    state.ghostVisible.value = true
    state.ghostSrc.value = '/some-image.jpg'
    state.hiddenThumbIndex.value = 3
    state.overlayOpacity.value = 0.5
    state.mediaOpacity.value = 0.5
    state.chromeOpacity.value = 0
    state.animating.value = true
    state.closeDragY.value = 42
    state.disableBackdropTransition.value = true

    resetOpenState(state)

    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(1)
    expect(state.chromeOpacity.value).toBe(1)
    expect(state.animating.value).toBe(false)
    expect(state.closeDragY.value).toBe(0)
    expect(state.disableBackdropTransition.value).toBe(false)
  })
})

describe('resetCloseState', () => {
  it('resets all properties to the "lightbox is closed" state', () => {
    const state = makeGhostState()
    // Simulate a fully-open lightbox
    state.ghostVisible.value = true
    state.ghostSrc.value = '/some-image.jpg'
    state.hiddenThumbIndex.value = 2
    state.overlayOpacity.value = 1
    state.mediaOpacity.value = 1
    state.chromeOpacity.value = 1
    state.animating.value = true
    state.closeDragY.value = 100
    state.disableBackdropTransition.value = true

    resetCloseState(state)

    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.closeDragY.value).toBe(0)
    expect(state.disableBackdropTransition.value).toBe(false)
    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(0)
    expect(state.animating.value).toBe(false)
  })
})

describe('setThumbRef', () => {
  it('stores an HTMLElement in thumbRefs', () => {
    const state = makeGhostState()
    const el = document.createElement('div')

    setThumbRef(state, 0)(el)

    expect(state.thumbRefs.get(0)).toBe(el)
  })

  it('unwraps $el from a ComponentPublicInstance', () => {
    const state = makeGhostState()
    const el = document.createElement('img')
    const component = { $el: el } as any

    setThumbRef(state, 1)(component)

    expect(state.thumbRefs.get(1)).toBe(el)
  })

  it('deletes the entry when passed null', () => {
    const state = makeGhostState()
    const el = document.createElement('div')

    setThumbRef(state, 2)(el)
    expect(state.thumbRefs.has(2)).toBe(true)

    setThumbRef(state, 2)(null)
    expect(state.thumbRefs.has(2)).toBe(false)
  })

  it('ignores non-HTMLElement values without crashing', () => {
    const state = makeGhostState()
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    setThumbRef(state, 3)(svgEl)

    expect(state.thumbRefs.has(3)).toBe(false)
  })
})

describe('error propagation', () => {
  it('openTransition reports when it aborts without an active photo', async () => {
    const state = makeGhostState(
      () => null,
      computed(() => null),
    )

    await expect(
      openTransition(
        state,
        0,
        makeTransitionCallbacks(),
        new AbortController().signal,
      ),
    ).resolves.toBe(false)

    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(0)
  })

  it('openTransition rethrows errors from getAbsoluteFrameRect and resets state', async () => {
    const boom = new Error('geometry-failure')
    const state = makeGhostState(() => {
      throw boom
    })

    await expect(
      openTransition(
        state,
        0,
        makeTransitionCallbacks(),
        new AbortController().signal,
      ),
    ).rejects.toBe(boom)

    expect(state.animating.value).toBe(false)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(1)
  })

  it('closeTransition rethrows errors from getAbsoluteFrameRect and resets state', async () => {
    const boom = new Error('geometry-failure')
    const state = makeGhostState(() => {
      throw boom
    })
    const { close } = createCloseTransition(state)

    await expect(
      close(makeCloseCallbacks(), new AbortController().signal),
    ).rejects.toBe(boom)

    expect(state.animating.value).toBe(false)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
  })

  it('keeps media hidden and opens the fallback when the slide image fails', async () => {
    const state = makeGhostState(() => usableRect())
    state.transitionConfig = { mode: 'none', autoThreshold: 0.55 }

    const callbacks = {
      ...makeTransitionCallbacks(),
      loadSlideImage: () =>
        Promise.resolve({ ok: false as const, error: new Error('broken') }),
    }

    await expect(
      openTransition(state, 0, callbacks, new AbortController().signal),
    ).resolves.toBe(true)

    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(1)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.animating.value).toBe(false)
  })

  it('uses fade fallback for an off-screen thumbnail without scrolling the page', async () => {
    const state = makeGhostState(() => usableRect())
    state.mediaOpacity.value = 1
    state.overlayOpacity.value = 1
    state.chromeOpacity.value = 1

    const thumb = document.createElement('button')
    const scrollIntoView = vi.fn()
    thumb.scrollIntoView = scrollIntoView
    thumb.getBoundingClientRect = () =>
      ({
        left: -900,
        top: 20,
        width: 120,
        height: 80,
        right: -780,
        bottom: 100,
        x: -900,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect
    state.thumbRefs.set(0, thumb)

    const { close } = createCloseTransition(state)

    await close(makeCloseCallbacks(), new AbortController().signal)

    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(state.mediaOpacity.value).toBe(0)
  })
})
