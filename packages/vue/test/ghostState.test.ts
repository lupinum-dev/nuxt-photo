// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
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
): GhostState {
  const photos = createPhotoSet()
  return createGhostState(
    ref(0),
    computed(() => photos[0]!),
    ref({ left: 0, top: 0, width: 1200, height: 800 }),
    getAbsoluteFrameRect,
  )
}

function makeTransitionCallbacks(): TransitionCallbacks {
  return {
    syncGeometry: () => {},
    refreshZoomState: () => {},
    resetGestureState: () => {},
    cancelTapTimer: () => {},
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
})
