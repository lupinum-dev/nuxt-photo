// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useLightboxMotion } from '../src/lightbox/transitions/runtime'
import { createPhotoSet } from '@test-fixtures/photos'

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

function callbacks() {
  return {
    prepareActiveSlide: () => Promise.resolve(),
    resetGestureState: vi.fn(),
    cancelTapTimer: vi.fn(),
    getThumbSrc: () => '/thumb.jpg',
    setImageLoadFailed: vi.fn(),
    syncGeometry: vi.fn(),
    setPanzoomImmediate: vi.fn(),
    isZoomedIn: computed(() => false),
  }
}

function setup(mode: 'flip' | 'fade' | 'none' = 'flip') {
  const photo = createPhotoSet()[0]!
  const motion = useLightboxMotion(
    ref(0),
    computed(() => photo),
    ref({ left: 0, top: 0, width: 1200, height: 800 }),
    () => rect(200, 100, 800, 500),
    undefined,
    { mode, autoThreshold: 0.55 },
  )

  const overlay = document.createElement('div')
  const viewport = document.createElement('div')
  const controls = document.createElement('div')
  const caption = document.createElement('div')
  const frame = document.createElement('div')
  const transitionImage = document.createElement('img')
  const shadow = document.createElement('div')
  const slideFrame = document.createElement('div')
  const slideImage = document.createElement('img')
  const thumb = document.createElement('button')

  thumb.getBoundingClientRect = () => rect(20, 30, 160, 100)
  slideFrame.getBoundingClientRect = () => rect(200, 100, 800, 500)
  Object.defineProperty(slideImage, 'currentSrc', {
    value: '/selected-1600.jpg',
  })
  slideImage.decode = vi.fn(() => Promise.resolve())

  for (const element of [
    overlay,
    viewport,
    controls,
    caption,
    frame,
    transitionImage,
    shadow,
  ]) {
    document.body.appendChild(element)
  }

  motion.setOverlayRef(overlay)
  motion.setViewportRef(viewport)
  motion.setControlsRef(controls)
  motion.setCaptionRef(caption)
  motion.setTransitionFrameRef(frame)
  motion.setTransitionImageRef(transitionImage)
  motion.setTransitionShadowRef(shadow)
  motion.setSlideFrameRef(0)(slideFrame)
  motion.setSlideImageRef(0)(slideImage)
  motion.setThumbRef(0)(thumb)

  return { motion, slideImage, callbacks: callbacks() }
}

describe('lightbox motion controller', () => {
  it('decodes the mounted responsive image and lands on canonical open styles', async () => {
    const { motion, slideImage, callbacks } = setup()
    motion.captureOpen(0, '/fallback-thumb.jpg')

    await expect(
      motion.open(0, callbacks, new AbortController().signal),
    ).resolves.toBe(true)

    expect(slideImage.decode).toHaveBeenCalledOnce()
    expect(motion.stageMounted.value).toBe(true)
    expect(motion.transitionInProgress.value).toBe(false)
    expect(motion.hiddenThumbIndex.value).toBe(0)
  })

  it('cleans every visual state after close', async () => {
    const { motion, callbacks } = setup('none')
    motion.captureOpen(0, '/fallback-thumb.jpg')
    await motion.open(0, callbacks, new AbortController().signal)
    await motion.close(callbacks, new AbortController().signal)

    expect(motion.stageMounted.value).toBe(false)
    expect(motion.hiddenThumbIndex.value).toBeNull()
    expect(motion.transitionInProgress.value).toBe(false)
  })

  it('deduplicates component refs and clears thumbnail refs safely', () => {
    const { motion } = setup('none')
    const thumb = document.createElement('button')
    const setter = motion.setThumbRef(3)
    setter(thumb)
    setter(null)
    expect(() => motion.captureOpen(3, '/fallback.jpg')).not.toThrow()
  })
})
