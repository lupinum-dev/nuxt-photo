import type { Inset, Pose, RectLike } from '../../core/index'
import { abortable, abortError, type StartGate } from './animation'
import { mixInset, mixPose, progressAt, writeInset, writePose } from './flight'

/**
 * Where the ghost is drawn: its layout box, and the pose and crop on top of it. A null crop is
 * none written: the image's own corners show.
 */
export type GhostPlace = { layout: RectLike; pose: Pose; clip: Inset | null }
export type GhostPose = { pose: Pose; clip: Inset }

const REST_POSE: Pose = { x: 0, y: 0, scale: 1 }

type RunningAnimation = {
  animation: Animation
  element: HTMLElement
  properties: readonly ('opacity' | 'transform' | 'clipPath')[]
}

/** A part that follows a flight: its keyframe at each share of the way, and what it animates. */
export type FlightTrack = [
  element: HTMLElement | null,
  frame: (share: number) => Keyframe,
  properties: RunningAnimation['properties'],
]

/** An opacity that rises from `from` to 1 as `curve` goes from 0 to 1 over the flight. */
export const rising = (
  element: HTMLElement | null,
  from: number,
  curve: (share: number) => number,
): FlightTrack => [element, (share) => ({ opacity: from + (1 - from) * curve(share) }), ['opacity']]

/** An opacity that falls from `from` to 0 as `curve` goes from 1 to 0 over the flight. */
export const falling = (
  element: HTMLElement | null,
  from: number,
  curve: (share: number) => number,
): FlightTrack => [element, (share) => ({ opacity: from * curve(share) }), ['opacity']]

function persistAnimation(running: RunningAnimation) {
  const style = getComputedStyle(running.element)
  for (const property of running.properties) running.element.style[property] = style[property]
  running.animation.cancel()
}

function finalFrame(keyframes: Keyframe[]) {
  return keyframes[keyframes.length - 1] ?? {}
}

/** Write inline styles, in the order given; nothing when there is no element. */
export function paint(
  element: HTMLElement | null | undefined,
  styles: Partial<CSSStyleDeclaration>,
) {
  if (element) Object.assign(element.style, styles)
}

function applyFrame(element: HTMLElement, frame: Keyframe) {
  if (frame.opacity != null) element.style.opacity = String(frame.opacity)
  if (frame.transform != null) element.style.transform = String(frame.transform)
  if (frame.clipPath != null) element.style.clipPath = String(frame.clipPath)
}

export function imageSource(element: HTMLElement | null, fallback: string) {
  if (element instanceof HTMLImageElement) return element.currentSrc || element.src || fallback
  const image = element?.querySelector('img')
  return image?.currentSrc || image?.src || fallback
}

export function rectStyle(element: HTMLElement, rect: RectLike) {
  element.style.left = `${rect.left}px`
  element.style.top = `${rect.top}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

export function visible(element: HTMLElement | null) {
  return (
    !!element && element.style.display !== 'none' && Number(getComputedStyle(element).opacity) > 0
  )
}

/** Read an element's rendered corner radius. */
export function radiusOf(element: Element | null | undefined) {
  if (!element) return 0
  return Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0
}

/** A thumbnail's visible radius may sit on the trigger or on its image. */
export function thumbRadius(thumb: HTMLElement | null | undefined) {
  return Math.max(radiusOf(thumb), radiusOf(thumb?.querySelector('img')))
}

export function opacityOf(element: HTMLElement | null, fallback: number) {
  return element ? Number(getComputedStyle(element).opacity) : fallback
}

export function transformOf(element: HTMLElement | null) {
  return element ? getComputedStyle(element).transform : 'none'
}

/**
 * Whether part of `element` is outside the viewport or under the page's chrome, such as a sticky
 * header. A ghost flying from or to such a thumbnail would cross that chrome. The open lightbox
 * is a modal dialog, which makes the page inert, and inert elements take no part in hit testing:
 * so the chrome is found by position instead. Fixed and sticky elements outside `lightbox` paint
 * over the content that scrolls under them; those that let pointers through (decoration) do not
 * count.
 */
export function isPartlyHidden(element: HTMLElement, lightbox: Element | null) {
  const box = element.getBoundingClientRect()
  if (box.width <= 0 || box.height <= 0) return false
  const edge = 0.5
  if (
    box.left < -edge ||
    box.top < -edge ||
    box.right > innerWidth + edge ||
    box.bottom > innerHeight + edge
  )
    return true
  const skip = lightbox?.closest('[data-np-lightbox-root]') ?? lightbox
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) =>
      node === skip || node === element ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const chrome = node as Element
    const style = getComputedStyle(chrome)
    if (style.position !== 'fixed' && style.position !== 'sticky') continue
    if (style.pointerEvents === 'none' || style.visibility === 'hidden') continue
    if (chrome.contains(element) || Number(style.opacity) === 0) continue
    const over = chrome.getBoundingClientRect()
    const width = Math.min(over.right, box.right) - Math.max(over.left, box.left)
    const height = Math.min(over.bottom, box.bottom) - Math.max(over.top, box.top)
    if (width > edge && height > edge) return true
  }
  return false
}

export function rectsMatch(a: RectLike, b: RectLike, tolerance = 1.5) {
  return (
    Math.abs(a.left - b.left) <= tolerance &&
    Math.abs(a.top - b.top) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  )
}

/**
 * Own the lightbox's animations and direct visual-state writes. The parts are read from the
 * DOM under `root` by the attributes the primitives render, when a motion starts; per-frame
 * paths hold what they read.
 */
export function createMotionVisualState(root: () => HTMLElement | null) {
  const running = new Set<RunningAnimation>()
  /** The ghost as last placed. While a flight moves it, `flight.at` tells where it is drawn. */
  const ghost: GhostPlace = {
    layout: { left: 0, top: 0, width: 0, height: 0 },
    pose: REST_POSE,
    clip: null,
  }
  let flight: { animation: Animation; at: (time: number) => GhostPose } | null = null

  /** End a running animation; a flight first leaves the ghost's place where it got to. */
  function end(item: RunningAnimation, persist: boolean) {
    if (flight?.animation === item.animation) {
      Object.assign(ghost, flight.at(Number(item.animation.currentTime ?? 0)))
      flight = null
    }
    if (persist) persistAnimation(item)
    else item.animation.cancel()
  }
  const one = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root()?.querySelector<T>(selector) ?? null
  const all = (selector: string) => [...(root()?.querySelectorAll<HTMLElement>(selector) ?? [])]
  /** A part of the slide that shows photo `index`. */
  const slidePart = (index: number, part: string) => one(`[data-np-slide="${index}"] [${part}]`)

  const elements = () => ({
    overlay: one('[data-np-motion="backdrop"]'),
    viewport: one('[data-np-motion="viewport"]'),
    controls: all('[data-np-motion="controls"]'),
    captions: all('[data-np-motion="caption"]'),
    transitionFrame: one('[data-np-transition-frame]'),
    transitionImage: one<HTMLImageElement>('img[data-np-transition-image]'),
    transitionShadow: one('[data-np-transition-shadow]'),
  })

  /** `started` receives the animation as soon as it exists, for example to set its start time. */
  function animate(
    element: HTMLElement | null,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    properties: RunningAnimation['properties'],
    signal: AbortSignal,
    started?: (animation: Animation) => void,
  ) {
    if (signal.aborted) {
      return Promise.reject(abortError(signal))
    }
    if (!element) return Promise.resolve()
    const duration = Number(options.duration ?? 0)
    if (typeof element.animate !== 'function' || duration <= 0) {
      applyFrame(element, finalFrame(keyframes))
      return Promise.resolve()
    }

    const animation = element.animate(keyframes, { ...options, fill: 'both' })
    started?.(animation)
    const item: RunningAnimation = { animation, element, properties }
    running.add(item)
    return abortable<void>(
      signal,
      (resolve, reject) => void animation.finished.then(() => resolve(), reject),
    )
      .then(() => applyFrame(element, finalFrame(keyframes)))
      .finally(() => {
        if (!running.delete(item)) return
        // An interrupted animation keeps the pose it reached; cancelling alone would
        // snap the element back to its starting styles before the next motion begins.
        end(item, signal.aborted)
      })
  }

  /** A linear opacity change of `element` over `duration`, held by `gate` when given. */
  const fade = (
    element: HTMLElement | null,
    [from, to]: [number, number],
    duration: number,
    signal: AbortSignal,
    gate?: StartGate,
  ) =>
    animate(
      element,
      [{ opacity: from }, { opacity: to }],
      { duration, easing: 'linear' },
      ['opacity'],
      signal,
      gate?.hold,
    )

  function persistRunningAnimations() {
    for (const item of running) end(item, true)
    running.clear()
  }

  /** `chrome` is the controls and captions a per-frame caller already holds. */
  function setChromeOpacity(opacity: number, chrome = chromeOf(elements())) {
    const hidden = opacity <= 0.05
    for (const element of chrome) {
      // Invisible controls must not keep focus or stay in the Tab order.
      if (hidden && element.contains(document.activeElement)) {
        element.closest<HTMLElement>('[data-np-lightbox-root]')?.focus({ preventScroll: true })
      }
      element.style.opacity = String(opacity)
      element.inert = hidden
    }
    // Visible chrome returns to its stylesheet value: a full-screen controls layer must
    // stay click-through so clicks still reach the photo and the backdrop.
    for (const element of chrome) {
      element.style.pointerEvents = hidden ? 'none' : ''
    }
  }

  /**
   * Lay the ghost out over `rect` with image `src`. It stays invisible until `showGhost`: a ghost
   * shown before its image decodes draws a blank box.
   */
  function normalizeTransitionVisual(rect: RectLike, src: string) {
    // A DOMRect's sides are getters: spreading one copies nothing.
    const { left, top, width, height } = rect
    Object.assign(ghost, { layout: { left, top, width, height }, pose: REST_POSE, clip: null })
    const current = elements()
    if (!current.transitionFrame || !current.transitionImage) return false
    rectStyle(current.transitionFrame, rect)
    paint(current.transitionFrame, { display: 'block', opacity: '0', transform: 'none' })
    current.transitionImage.src = src
    paint(current.transitionImage, { opacity: '1', clipPath: '' })
    paint(current.transitionShadow, { opacity: '1' })
    return true
  }

  /** Pose and crop the ghost over its layout box. */
  function poseGhost({ pose, clip }: GhostPose) {
    const current = elements()
    Object.assign(ghost, { pose, clip })
    paint(current.transitionFrame, { transform: writePose(pose) })
    paint(current.transitionImage, { clipPath: writeInset(clip) })
  }

  /** Where the ghost is drawn now. */
  function ghostPlace(): GhostPlace {
    const time = flight?.animation.currentTime
    return { ...ghost, ...(flight && time != null ? flight.at(Number(time)) : {}) }
  }

  /**
   * Fly the ghost from `from` to `to` along `plan`'s progress samples, played linearly, with
   * `tracks` drawn by the same progress. `gate` holds every animation until it starts them.
   */
  function fly(
    plan: { duration: number; progress: number[] },
    from: GhostPose,
    to: GhostPose,
    tracks: FlightTrack[],
    signal: AbortSignal,
    gate: StartGate,
  ) {
    const { transitionFrame: frame, transitionImage: image } = elements()
    const at = (share: number) => ({
      pose: mixPose(from.pose, to.pose, share),
      clip: mixInset(from.clip, to.clip, share),
    })
    const all: FlightTrack[] = [
      [frame, (share) => ({ transform: writePose(at(share).pose) }), ['transform']],
      [image, (share) => ({ clipPath: writeInset(at(share).clip) }), ['clipPath']],
      ...tracks,
    ]
    const timing = { duration: plan.duration, easing: 'linear' }
    return Promise.all(
      all.map(([element, keyframe, properties], index) =>
        animate(element, plan.progress.map(keyframe), timing, properties, signal, (animation) => {
          gate.hold(animation)
          if (index === 0)
            flight = { animation, at: (time) => at(progressAt(plan.progress, plan.duration, time)) }
        }),
      ),
    )
  }

  function showGhost() {
    paint(elements().transitionFrame, { opacity: '1' })
  }

  function hideGhost() {
    paint(elements().transitionFrame, { display: 'none', opacity: '0' })
  }

  /**
   * Hide the photo of slide `index`, not the slide: its caption stays and fades with the
   * controls while a ghost of the photo flies home.
   */
  function hideSlidePhoto(index: number) {
    const zoom = slidePart(index, 'data-np-slide-zoom')
    if (zoom) zoom.style.visibility = 'hidden'
  }

  function showSlidePhotos() {
    for (const zoom of all('[data-np-slide-zoom]')) zoom.style.visibility = ''
  }

  return {
    root,
    elements,
    showGhost,
    hideGhost,
    poseGhost,
    ghostPlace,
    /** A flight moves the ghost: `at` gives its pose and crop `time` ms after the start. */
    fly,
    hideSlidePhoto,
    showSlidePhotos,
    slideFrame: (index: number) => slidePart(index, 'data-np-slide-frame'),
    slideImage: (index: number) => slidePart(index, 'data-np-slide-img'),
    slideFrames: () => all('[data-np-slide-frame]'),
    animate,
    fade,
    persistRunningAnimations,
    setChromeOpacity,
    normalizeTransitionVisual,
  }
}

export type MotionElements = ReturnType<MotionVisualState['elements']>

export const chromeOf = (parts: Pick<MotionElements, 'controls' | 'captions'>) => [
  ...parts.controls,
  ...parts.captions,
]

export type MotionVisualState = ReturnType<typeof createMotionVisualState>
