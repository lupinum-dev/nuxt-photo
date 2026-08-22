import { ref, type ComponentPublicInstance, type Ref } from 'vue'
import type { RectLike } from '../../core/index'

type MotionElements = {
  overlay: HTMLElement | null
  viewport: HTMLElement | null
  controls: Set<HTMLElement>
  captions: Set<HTMLElement>
  transitionFrame: HTMLElement | null
  transitionImage: HTMLImageElement | null
  transitionShadow: HTMLElement | null
}

type RunningAnimation = {
  animation: Animation
  element: HTMLElement
  properties: readonly ('opacity' | 'transform')[]
}

function domElement(value: Element | ComponentPublicInstance | null) {
  if (value instanceof HTMLElement) return value
  const root = value ? (value as ComponentPublicInstance).$el : null
  return root instanceof HTMLElement ? root : null
}

function setRef(target: Ref<HTMLElement | null>) {
  return (value: Element | ComponentPublicInstance | null) => {
    target.value = domElement(value)
  }
}

function setMapRef(map: Map<number, HTMLElement>, index: number) {
  return (value: Element | ComponentPublicInstance | null) => {
    const element = domElement(value)
    if (element) map.set(index, element)
    else map.delete(index)
  }
}

function persistAnimation(running: RunningAnimation) {
  const style = getComputedStyle(running.element)
  for (const property of running.properties) running.element.style[property] = style[property]
  running.animation.cancel()
}

function finalFrame(keyframes: Keyframe[]) {
  return keyframes[keyframes.length - 1] ?? {}
}

function applyFrame(element: HTMLElement, frame: Keyframe) {
  if (frame.opacity != null) element.style.opacity = String(frame.opacity)
  if (frame.transform != null) element.style.transform = String(frame.transform)
}

function animationPromise(animation: Animation, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort)
      reject(signal.reason ?? new DOMException('Operation aborted', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      abort()
      return
    }
    animation.finished.then(
      () => {
        signal.removeEventListener('abort', abort)
        resolve()
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
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

export function opacityOf(element: HTMLElement | null, fallback: number) {
  return element ? Number(getComputedStyle(element).opacity) : fallback
}

export function transformOf(element: HTMLElement | null) {
  return element ? getComputedStyle(element).transform : 'none'
}

export function rectsMatch(a: RectLike, b: RectLike, tolerance = 1.5) {
  return (
    Math.abs(a.left - b.left) <= tolerance &&
    Math.abs(a.top - b.top) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  )
}

/** Own transition element refs, registrations, animations, and direct visual-state writes. */
export function createMotionVisualState() {
  const overlayRef = ref<HTMLElement | null>(null)
  const viewportRef = ref<HTMLElement | null>(null)
  const transitionFrameRef = ref<HTMLElement | null>(null)
  const transitionImageRef = ref<HTMLElement | null>(null)
  const transitionShadowRef = ref<HTMLElement | null>(null)
  const thumbRefs = new Map<number, HTMLElement>()
  const slideFrameRefs = new Map<number, HTMLElement>()
  const slideImageRefs = new Map<number, HTMLElement>()
  const controls = new Set<HTMLElement>()
  const captions = new Set<HTMLElement>()
  const running = new Set<RunningAnimation>()

  const elements = (): MotionElements => ({
    overlay: overlayRef.value,
    viewport: viewportRef.value,
    controls,
    captions,
    transitionFrame: transitionFrameRef.value,
    transitionImage:
      transitionImageRef.value instanceof HTMLImageElement ? transitionImageRef.value : null,
    transitionShadow: transitionShadowRef.value,
  })

  function registerSet(set: Set<HTMLElement>) {
    let current: HTMLElement | null = null
    return (value: Element | ComponentPublicInstance | null) => {
      if (current) set.delete(current)
      current = domElement(value)
      if (current) set.add(current)
    }
  }

  function animate(
    element: HTMLElement | null,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    properties: RunningAnimation['properties'],
    signal: AbortSignal,
  ) {
    if (signal.aborted) {
      return Promise.reject(signal.reason ?? new DOMException('Operation aborted', 'AbortError'))
    }
    if (!element) return Promise.resolve()
    const duration = Number(options.duration ?? 0)
    if (typeof element.animate !== 'function' || duration <= 0) {
      applyFrame(element, finalFrame(keyframes))
      return Promise.resolve()
    }

    const animation = element.animate(keyframes, { ...options, fill: 'both' })
    const item: RunningAnimation = { animation, element, properties }
    running.add(item)
    return animationPromise(animation, signal)
      .then(() => applyFrame(element, finalFrame(keyframes)))
      .finally(() => {
        if (running.delete(item)) animation.cancel()
      })
  }

  function persistRunningAnimations() {
    for (const item of running) persistAnimation(item)
    running.clear()
  }

  function setChromeOpacity(opacity: number) {
    for (const element of controls) {
      element.style.opacity = String(opacity)
      element.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none'
    }
    for (const element of captions) {
      element.style.opacity = String(opacity)
      element.style.pointerEvents = opacity > 0.05 ? '' : 'none'
    }
  }

  function normalizeTransitionVisual(rect: RectLike, src: string) {
    const current = elements()
    if (!current.transitionFrame || !current.transitionImage) return false
    rectStyle(current.transitionFrame, rect)
    current.transitionFrame.style.display = 'block'
    current.transitionFrame.style.opacity = '1'
    current.transitionFrame.style.transform = 'none'
    current.transitionImage.src = src
    current.transitionImage.style.opacity = '1'
    if (current.transitionShadow) current.transitionShadow.style.opacity = '1'
    return true
  }

  return {
    overlayRef,
    viewportRef,
    transitionFrameRef,
    transitionImageRef,
    transitionShadowRef,
    thumbRefs,
    slideFrameRefs,
    slideImageRefs,
    controls,
    captions,
    elements,
    animate,
    persistRunningAnimations,
    setChromeOpacity,
    normalizeTransitionVisual,
    setThumbRef: (index: number) => setMapRef(thumbRefs, index),
    setSlideFrameRef: (index: number) => setMapRef(slideFrameRefs, index),
    setSlideImageRef: (index: number) => setMapRef(slideImageRefs, index),
    setOverlayRef: setRef(overlayRef),
    setViewportRef: setRef(viewportRef),
    setControlsRef: registerSet(controls),
    setCaptionRef: registerSet(captions),
    setTransitionFrameRef: setRef(transitionFrameRef),
    setTransitionImageRef: setRef(transitionImageRef),
    setTransitionShadowRef: setRef(transitionShadowRef),
  }
}

export type MotionVisualState = ReturnType<typeof createMotionVisualState>
