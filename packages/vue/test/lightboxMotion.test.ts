// @vitest-environment jsdom

import { computed, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'
import { useLightboxMotion } from '../src/lightbox/transitions/runtime'
import { createStartGate } from '../src/lightbox/transitions/animation'
import { createMotionVisualState } from '../src/lightbox/transitions/visual-state'
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

/** An animation that never finishes; the motion holds it at time zero and starts it later. */
const stalledAnimation = () =>
  ({
    finished: new Promise<void>(() => {}),
    cancel: vi.fn(),
    pause: vi.fn(),
    playState: 'paused',
    currentTime: 0,
    startTime: null,
  }) as unknown as Animation

function callbacks() {
  return {
    prepareActiveSlide: () => Promise.resolve(),
    glowReady: () => Promise.resolve(),
    resetGestureState: vi.fn(),
    cancelTapTimer: vi.fn(),
    getThumbSrc: () => '/thumb.jpg',
    setImageLoadFailed: vi.fn(),
    syncGeometry: vi.fn(),
    setPanzoomImmediate: vi.fn(),
    isZoomedIn: computed(() => false),
  }
}

function setup(mode: 'flip' | 'fade' | 'none' = 'flip', supportsDecode = true) {
  const photo = createPhotoSet()[0]!
  const thumbnails = new Map<string, HTMLElement>()
  const root = document.createElement('div')
  const motion = useLightboxMotion(
    ref(0),
    computed(() => photo),
    ref({ left: 0, top: 0, width: 1200, height: 800 }),
    () => rect(200, 100, 800, 500),
    () => ({ mode, autoThreshold: 0.55 }),
    () => false,
    () => 'slide',
    (id) => thumbnails.get(id) ?? null,
    () => root,
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
  if (supportsDecode) {
    slideImage.decode = vi.fn(() => Promise.resolve())
  } else {
    Object.defineProperty(slideImage, 'decode', {
      configurable: true,
      value: undefined,
    })
  }

  // The parts carry the attributes the primitives render; the motion finds them under root.
  overlay.dataset.npMotion = 'backdrop'
  viewport.dataset.npMotion = 'viewport'
  controls.dataset.npMotion = 'controls'
  caption.dataset.npMotion = 'caption'
  frame.setAttribute('data-np-transition-frame', '')
  // The stylesheet hides the ghost until a motion shows it.
  frame.style.display = 'none'
  shadow.setAttribute('data-np-transition-shadow', '')
  transitionImage.setAttribute('data-np-transition-image', '')
  const slide = document.createElement('div')
  slide.dataset.npSlide = '0'
  slideFrame.setAttribute('data-np-slide-frame', '')
  slideImage.setAttribute('data-np-slide-img', '')
  slideFrame.append(slideImage)
  slide.append(slideFrame)
  viewport.append(slide)
  frame.append(shadow, transitionImage)
  root.append(overlay, viewport, controls, caption, frame)
  document.body.appendChild(root)
  thumbnails.set(photo.id, thumb)

  return {
    motion,
    photo,
    thumbnails,
    slideImage,
    overlay,
    controls,
    viewport,
    caption,
    slideFrame,
    transitionImage,
    callbacks: callbacks(),
  }
}

describe('lightbox motion controller', () => {
  it('finds a slide part only under its own lightbox root', () => {
    const [first, second] = [0, 1].map(() => {
      const root = document.createElement('div')
      root.innerHTML = '<div data-np-slide="0"><div data-np-slide-frame></div></div>'
      return root
    })
    // The other lightbox comes first in the document.
    document.body.append(second!, first!)
    const frame = createMotionVisualState(() => first!).slideFrame(0)
    expect(frame).toBe(first!.querySelector('[data-np-slide-frame]'))
    first!.remove()
    second!.remove()
  })

  it('does not start a Web Animation for a pre-aborted signal', async () => {
    const visual = createMotionVisualState(() => null)
    const element = document.createElement('div')
    const animate = vi.fn()
    element.animate = animate
    const controller = new AbortController()
    controller.abort()

    await expect(
      visual.animate(
        element,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 100 },
        ['opacity'],
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(animate).not.toHaveBeenCalled()
  })

  it('observes an abort triggered while a Web Animation is created', async () => {
    const visual = createMotionVisualState(() => null)
    const element = document.createElement('div')
    const controller = new AbortController()
    const animation = {
      finished: new Promise<void>(() => {}),
      cancel: vi.fn(),
    } as unknown as Animation
    element.animate = vi.fn(() => {
      controller.abort()
      return animation
    })

    await expect(
      visual.animate(
        element,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 100 },
        ['opacity'],
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('keeps the pose an interrupted animation reached instead of snapping back', async () => {
    const visual = createMotionVisualState(() => null)
    const element = document.createElement('div')
    element.style.transform = 'scale(0.5)'
    const controller = new AbortController()
    const cancel = vi.fn()
    element.animate = vi.fn(
      () => ({ finished: new Promise<void>(() => {}), cancel }) as unknown as Animation,
    )
    // Mid-flight, the browser renders the animated value, not the inline start value.
    const computed = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ transform: 'matrix(0.8, 0, 0, 0.8, 0, 0)' } as CSSStyleDeclaration)

    const flight = visual.animate(
      element,
      [{ transform: 'scale(0.5)' }, { transform: 'none' }],
      { duration: 400 },
      ['transform'],
      controller.signal,
    )
    controller.abort()
    await expect(flight).rejects.toMatchObject({ name: 'AbortError' })
    computed.mockRestore()

    expect(element.style.transform).toBe('matrix(0.8, 0, 0, 0.8, 0, 0)')
    expect(cancel).toHaveBeenCalled()
  })

  it('decodes the mounted responsive image and lands on canonical open styles', async () => {
    const { motion, photo, slideImage, controls, callbacks } = setup()
    motion.captureOpen(photo.id, '/fallback-thumb.jpg')

    await expect(motion.open(0, callbacks, new AbortController().signal)).resolves.toBe(true)

    expect(slideImage.decode).toHaveBeenCalledOnce()
    expect(motion.stageMounted.value).toBe(true)
    expect(motion.transitionInProgress.value).toBe(false)
    expect(motion.hiddenThumbnailId.value).toBe(photo.id)
    expect(controls.style.pointerEvents).not.toBe('none')
    expect(controls.inert).toBe(false)
  })

  it('shows the ghost only once its image is decoded, and hides the thumbnail a frame later', async () => {
    const { motion, photo, transitionImage, callbacks } = setup()
    const ghost = transitionImage.parentElement!
    let decoded = () => {}
    transitionImage.decode = vi.fn(() => new Promise<void>((done) => (decoded = done)))
    // Frames run only when the test says so.
    const frames: FrameRequestCallback[] = []
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const settle = () => new Promise((done) => setTimeout(done, 0))
    const runFrame = async () => {
      for (const callback of frames.splice(0)) callback(performance.now())
      await settle()
    }
    const controller = new AbortController()
    motion.captureOpen(photo.id, '/thumb.jpg')
    const opening = motion.open(0, callbacks, controller.signal).catch(() => {})

    await vi.waitFor(() => expect(transitionImage.decode).toHaveBeenCalled())
    // Laid out at the thumbnail, but invisible: an undecoded ghost draws a blank box.
    expect(ghost.style.display).toBe('block')
    expect(ghost.style.opacity).toBe('0')
    decoded()
    await settle()
    expect(ghost.style.opacity).toBe('1')
    // The thumbnail stays until a frame has drawn the ghost over it.
    await runFrame()
    expect(motion.hiddenThumbnailId.value).toBeNull()
    await runFrame()
    expect(motion.hiddenThumbnailId.value).toBe(photo.id)
    controller.abort()
    frame.mockRestore()
    await opening
  })

  it('keeps the backdrop hidden when a drag reset is still waiting to paint', async () => {
    const { motion, photo, overlay, callbacks } = setup()
    // Hold the flight at its first frame so only inline styles decide what is painted.
    overlay.animate = vi.fn(stalledAnimation)
    const controller = new AbortController()
    motion.captureOpen(photo.id, '/fallback-thumb.jpg')
    motion.setCloseDragY(0)
    void motion.open(0, callbacks, controller.signal).catch(() => {})

    await vi.waitFor(() => expect(overlay.animate).toHaveBeenCalled())
    expect(overlay.style.opacity).toBe('0')
    controller.abort()
  })

  it('cleans every visual state after close', async () => {
    const { motion, photo, callbacks } = setup('none')
    motion.captureOpen(photo.id, '/fallback-thumb.jpg')
    await motion.open(0, callbacks, new AbortController().signal)
    await motion.close(callbacks, new AbortController().signal)

    expect(motion.stageMounted.value).toBe(false)
    expect(motion.hiddenThumbnailId.value).toBeNull()
    expect(motion.transitionInProgress.value).toBe(false)
  })

  it('aborts the load-event fallback without waiting for its timeout', async () => {
    const { motion, slideImage, callbacks } = setup('none', false)
    const addEventListener = vi.spyOn(slideImage, 'addEventListener')
    const controller = new AbortController()
    const opening = motion.open(0, callbacks, controller.signal)

    await vi.waitFor(() => {
      expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true })
    })
    controller.abort()

    await expect(opening).rejects.toMatchObject({ name: 'AbortError' })
    expect(motion.transitionInProgress.value).toBe(false)
  })

  it('finds the thumbnail at close time after its element was replaced', async () => {
    const { motion, photo, thumbnails, callbacks } = setup('fade')
    motion.captureOpen(photo.id, '/fallback-thumb.jpg')
    await motion.open(0, callbacks, new AbortController().signal)

    // Vue re-rendered the thumbnail while the lightbox was open.
    const stale = thumbnails.get(photo.id)!
    stale.getBoundingClientRect = vi.fn(() => rect(20, 30, 160, 100))
    const replacement = document.createElement('button')
    replacement.getBoundingClientRect = vi.fn(() => rect(40, 60, 160, 100))
    thumbnails.set(photo.id, replacement)
    await motion.close(callbacks, new AbortController().signal)

    expect(replacement.getBoundingClientRect).toHaveBeenCalled()
    expect(stale.getBoundingClientRect).not.toHaveBeenCalled()
  })

  it('shows the opened thumbnail again as soon as a fade close starts', async () => {
    const { motion, photo, thumbnails, viewport, callbacks } = setup('flip')
    motion.captureOpen(photo.id, '/thumb.jpg')
    await motion.open(0, callbacks, new AbortController().signal)
    expect(motion.hiddenThumbnailId.value).toBe(photo.id)

    // Without a thumbnail on screen the close fades out instead of flying home.
    thumbnails.clear()
    viewport.animate = vi.fn(stalledAnimation)
    const controller = new AbortController()
    const closing = motion.close(callbacks, controller.signal)
    await vi.waitFor(() => expect(viewport.animate).toHaveBeenCalled())

    expect(motion.hiddenThumbnailId.value).toBeNull()
    controller.abort()
    await closing.catch(() => {})
  })

  it('hides only the photo under a flying close, so its caption fades with the controls', async () => {
    const { motion, photo, viewport, caption, slideFrame, slideImage, transitionImage, callbacks } =
      setup('flip')
    // The slide as the primitives render it: the photo in its zoom layer, the caption beside it.
    const zoom = document.createElement('div')
    zoom.setAttribute('data-np-slide-zoom', '')
    zoom.append(slideImage)
    slideFrame.append(zoom, caption)
    motion.captureOpen(photo.id, '/thumb.jpg')
    await motion.open(0, callbacks, new AbortController().signal)

    transitionImage.decode = vi.fn(() => Promise.resolve())
    caption.animate = vi.fn(stalledAnimation)
    const controller = new AbortController()
    const closing = motion.close(callbacks, controller.signal)
    await vi.waitFor(() => expect(caption.animate).toHaveBeenCalled())

    expect(zoom.style.visibility).toBe('hidden')
    expect(viewport.style.opacity).not.toBe('0')
    controller.abort()
    await closing.catch(() => {})
  })

  it('opens without a thumbnail when the photo has none on the page', async () => {
    const { motion, photo, thumbnails, callbacks } = setup('none')
    thumbnails.clear()
    expect(() => motion.captureOpen(photo.id, '/fallback.jpg')).not.toThrow()
    await expect(motion.open(0, callbacks, new AbortController().signal)).resolves.toBe(true)
  })

  it('lets the latest chrome visibility request win', async () => {
    const { motion, controls } = setup('none')
    const completions: Array<() => void> = []
    controls.animate = vi.fn(() => {
      let complete!: () => void
      const finished = new Promise<void>((resolve) => {
        complete = resolve
      })
      completions.push(complete)
      return { finished, cancel: vi.fn() } as unknown as Animation
    })

    motion.uiVisible.value = false
    await nextTick()
    motion.uiVisible.value = true
    await nextTick()
    completions.at(-1)?.()
    await vi.waitFor(() => {
      expect(controls.style.opacity).toBe('1')
      expect(controls.style.pointerEvents).not.toBe('none')
      expect(controls.inert).toBe(false)
    })
  })

  it('cancels an owned gesture settle operation', async () => {
    const { motion, viewport } = setup('none')
    viewport.animate = vi.fn(
      () =>
        ({
          finished: new Promise<void>(() => {}),
          cancel: vi.fn(),
          pause: vi.fn(),
        }) as unknown as Animation,
    )

    motion.setCloseDragY(40)
    const settling = motion.settleDrag()
    motion.cancel()

    await expect(settling).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('createStartGate after a drag', () => {
  // A settle that relied on the browser to fix its start drew up to two frames of motion at
  // once in WebKit. Its start is set in the next frame callback, at most one frame back.
  it.each([
    { name: 'moved 5 ms before the frame', movedAt: 995, startTime: 995 },
    { name: 'moved 40 ms before the frame', movedAt: 960, startTime: 1000 - 1000 / 60 },
    { name: 'moved after the frame time stamp', movedAt: 1003, startTime: 1000 },
  ])('$name', ({ movedAt, startTime }) => {
    const animation = { playState: 'running', currentTime: 50, startTime: null as number | null }
    Object.assign(animation, { pause: () => (animation.playState = 'paused') })
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    )
    const gate = createStartGate()
    gate.hold(animation as unknown as Animation)
    gate.startNextFrame(movedAt)
    expect(animation).toMatchObject({ playState: 'paused', currentTime: 0 })
    frames[0]!(1000)
    expect(animation.startTime).toBeCloseTo(startTime)
    vi.unstubAllGlobals()
  })

  it('leaves a settle cancelled before the frame alone', () => {
    const animation = { playState: 'running', currentTime: 0, startTime: null as number | null }
    Object.assign(animation, { pause: () => (animation.playState = 'paused') })
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    )
    const gate = createStartGate()
    gate.hold(animation as unknown as Animation)
    gate.startNextFrame(990)
    animation.playState = 'idle'
    frames[0]!(1000)
    expect(animation.startTime).toBeNull()
    vi.unstubAllGlobals()
  })
})
