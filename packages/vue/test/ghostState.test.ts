// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  createGhostState,
  resetOpenState,
  resetCloseState,
  setThumbRef,
} from '../src/composables/ghost/state'
import { openTransition } from '../src/composables/ghost/openTransition'
import { createCloseTransition } from '../src/composables/ghost/closeTransition'
import type {
  CloseCallbacks,
  GhostState,
  TransitionCallbacks,
} from '../src/composables/ghost/types'
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
    syncGeometry: () => {},
    refreshZoomState: () => {},
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

  it('does not reset lightboxMounted (lightbox should stay open)', () => {
    const state = makeGhostState()
    state.lightboxMounted.value = true

    resetOpenState(state)

    expect(state.lightboxMounted.value).toBe(true)
  })
})

describe('resetCloseState', () => {
  it('resets all properties to the "lightbox is closed" state', () => {
    const state = makeGhostState()
    let guardCleared = false

    // Simulate a fully-open lightbox
    state.lightboxMounted.value = true
    state.ghostVisible.value = true
    state.ghostSrc.value = '/some-image.jpg'
    state.hiddenThumbIndex.value = 2
    state.overlayOpacity.value = 1
    state.mediaOpacity.value = 1
    state.chromeOpacity.value = 1
    state.animating.value = true
    state.closeDragY.value = 100
    state.disableBackdropTransition.value = true

    resetCloseState(state, () => {
      guardCleared = true
    })

    expect(guardCleared).toBe(true)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.closeDragY.value).toBe(0)
    expect(state.disableBackdropTransition.value).toBe(false)
    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(0)
    expect(state.animating.value).toBe(false)
    expect(state.lightboxMounted.value).toBe(false)
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
      openTransition(state, 0, makeTransitionCallbacks()),
    ).resolves.toBe(false)

    expect(state.lightboxMounted.value).toBe(false)
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
      openTransition(state, 0, makeTransitionCallbacks()),
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
    state.lightboxMounted.value = true

    const { close } = createCloseTransition(state)

    await expect(close(makeCloseCallbacks())).rejects.toBe(boom)

    expect(state.animating.value).toBe(false)
    expect(state.lightboxMounted.value).toBe(false)
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

    await expect(openTransition(state, 0, callbacks)).resolves.toBe(true)

    expect(state.lightboxMounted.value).toBe(true)
    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(1)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.animating.value).toBe(false)
  })

  it('uses fade fallback for an off-screen thumbnail without scrolling the page', async () => {
    const state = makeGhostState(() => usableRect())
    state.lightboxMounted.value = true
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

    await close(makeCloseCallbacks())

    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(state.lightboxMounted.value).toBe(false)
    expect(state.mediaOpacity.value).toBe(0)
  })
})
