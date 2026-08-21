import {
  computed,
  nextTick,
  ref,
  watch,
  type ComponentPublicInstance,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  toValue,
} from 'vue'
import {
  chooseCloseTransition,
  DEFAULT_TRANSITION_CONFIG,
  isUsableRect,
  shouldUseFlip,
  type AreaMetrics,
  type PhotoItem,
  type RectLike,
  type TransitionModeConfig,
} from '../../core/index'
import { IMAGE_LOAD_TIMEOUT_MS } from '../../core/image/constants'
import { flipTransform } from '../../core/geometry/rect'
import { nextFrame, throwIfAborted, wait } from './animation'

const OPEN_DURATION_MS = 420
const CLOSE_DURATION_MS = 360
const FADE_DURATION_MS = 220
const REDUCED_MOTION_DURATION_MS = 160
const HANDOFF_DURATION_MS = 100
const INTERRUPTED_HANDOFF_MS = 80
const DRAG_SETTLE_MS = 180
const TRANSITION_IMAGE_PREPARE_MS = 800
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

type MotionElements = {
  overlay: HTMLElement | null
  viewport: HTMLElement | null
  controls: Set<HTMLElement>
  captions: Set<HTMLElement>
  transitionFrame: HTMLElement | null
  transitionImage: HTMLImageElement | null
  transitionShadow: HTMLElement | null
}

type CapturedOpen = {
  index: number
  rect: DOMRect | null
  src: string
}

type MotionCallbacks = {
  prepareActiveSlide: (reset: boolean) => Promise<void>
  resetGestureState: () => void
  cancelTapTimer: () => void
  getThumbSrc: (photo: PhotoItem) => string
  setImageLoadFailed: (failed: boolean, error?: unknown) => void
  syncGeometry: () => void
  setPanzoomImmediate: (scale: number, pan: { x: number; y: number }) => void
  isZoomedIn: ComputedRef<boolean>
}

type RunningAnimation = {
  animation: Animation
  element: HTMLElement
  properties: readonly ('opacity' | 'transform')[]
}

function domElement(value: Element | ComponentPublicInstance | null) {
  if (value instanceof HTMLElement) return value
  const root = value ? (value as ComponentPublicInstance).$el : null
  if (root instanceof HTMLElement) {
    return root
  }
  return null
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
  for (const property of running.properties) {
    running.element.style[property] = style[property]
  }
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

function imageSource(element: HTMLElement | null, fallback: string) {
  if (element instanceof HTMLImageElement) return element.currentSrc || element.src || fallback
  const image = element?.querySelector('img')
  return image?.currentSrc || image?.src || fallback
}

function rectStyle(element: HTMLElement, rect: RectLike) {
  element.style.left = `${rect.left}px`
  element.style.top = `${rect.top}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

function visible(element: HTMLElement | null) {
  return (
    !!element && element.style.display !== 'none' && Number(getComputedStyle(element).opacity) > 0
  )
}

function opacityOf(element: HTMLElement | null, fallback: number) {
  return element ? Number(getComputedStyle(element).opacity) : fallback
}

function transformOf(element: HTMLElement | null) {
  return element ? getComputedStyle(element).transform : 'none'
}

function rectsMatch(a: RectLike, b: RectLike, tolerance = 1.5) {
  return (
    Math.abs(a.left - b.left) <= tolerance &&
    Math.abs(a.top - b.top) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  )
}

/** Own all lightbox transition DOM and run one compositor-only choreography. */
export function useLightboxMotion(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null,
  transitionConfig?: TransitionModeConfig,
  reducedMotion: MaybeRefOrGetter<boolean> = false,
) {
  const animating = ref(false)
  const hiddenThumbIndex = ref<number | null>(null)
  const uiVisible = ref(true)
  const closeDragY = ref(0)
  const stageMounted = ref(false)
  const activeImagePending = ref(false)
  const transitionInProgress = computed(() => animating.value || activeImagePending.value)

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
  let capturedOpen: CapturedOpen | null = null
  let dragFrame = 0

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
      const element = domElement(value)
      current = element
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

  function cancel() {
    if (dragFrame) cancelAnimationFrame(dragFrame)
    dragFrame = 0
    persistRunningAnimations()
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

  function resetClosedVisualState() {
    cancel()
    const e = elements()
    if (e.overlay) e.overlay.style.opacity = '0'
    if (e.viewport) {
      e.viewport.style.opacity = '0'
      e.viewport.style.transform = 'none'
    }
    if (e.transitionFrame) {
      e.transitionFrame.style.display = 'none'
      e.transitionFrame.style.opacity = '0'
      e.transitionFrame.style.transform = 'none'
    }
    setChromeOpacity(0)
    hiddenThumbIndex.value = null
    closeDragY.value = 0
    stageMounted.value = false
    activeImagePending.value = false
    animating.value = false
  }

  function captureOpen(index: number, fallbackSrc: string) {
    const thumb = thumbRefs.get(index) ?? null
    capturedOpen = {
      index,
      rect: thumb?.getBoundingClientRect() ?? null,
      src: imageSource(thumb, fallbackSrc),
    }
  }

  async function decodeActiveImage(index: number, signal: AbortSignal) {
    await nextTick()
    throwIfAborted(signal)
    const element = slideImageRefs.get(index)
    if (!(element instanceof HTMLImageElement)) {
      await nextFrame(signal)
      return { ok: true as const }
    }

    const decode = element.decode?.bind(element)
    if (!decode) {
      if (element.complete && element.naturalWidth > 0) return { ok: true as const }
      return new Promise<{ ok: true } | { ok: false; error: unknown }>((resolve, reject) => {
        let settled = false
        const cleanup = () => {
          clearTimeout(timeout)
          signal.removeEventListener('abort', abort)
          element.removeEventListener('load', loaded)
          element.removeEventListener('error', failed)
        }
        const finish = (result: { ok: true } | { ok: false; error: unknown }) => {
          if (settled) return
          settled = true
          cleanup()
          resolve(result)
        }
        const abort = () => {
          if (settled) return
          settled = true
          cleanup()
          reject(signal.reason ?? new DOMException('Operation aborted', 'AbortError'))
        }
        const loaded = () => finish({ ok: true })
        const failed = () => finish({ ok: false, error: new Error('Image failed to load') })
        const timeout = setTimeout(
          () => finish({ ok: false, error: new Error('Image load timed out') }),
          IMAGE_LOAD_TIMEOUT_MS,
        )
        signal.addEventListener('abort', abort, { once: true })
        element.addEventListener('load', loaded, { once: true })
        element.addEventListener('error', failed, { once: true })
        if (signal.aborted) abort()
      })
    }

    try {
      await Promise.race([
        decode(),
        wait(IMAGE_LOAD_TIMEOUT_MS, signal).then(() => {
          throw new Error(`Image decode timed out: ${element.currentSrc || element.src}`)
        }),
      ])
      return { ok: true as const }
    } catch (error) {
      throwIfAborted(signal)
      return { ok: false as const, error }
    }
  }

  async function prepareTransitionImage(signal: AbortSignal) {
    const image = elements().transitionImage
    if (!image) return false
    if (!image.decode) return true
    try {
      await Promise.race([
        image.decode(),
        wait(TRANSITION_IMAGE_PREPARE_MS, signal).then(() => {
          throw new Error('Transition image decode timed out')
        }),
      ])
      return true
    } catch {
      throwIfAborted(signal)
      return false
    }
  }

  function normalizeTransitionVisual(rect: RectLike, src: string) {
    const e = elements()
    if (!e.transitionFrame || !e.transitionImage) return false
    rectStyle(e.transitionFrame, rect)
    e.transitionFrame.style.display = 'block'
    e.transitionFrame.style.opacity = '1'
    e.transitionFrame.style.transform = 'none'
    e.transitionImage.src = src
    e.transitionImage.style.opacity = '1'
    if (e.transitionShadow) e.transitionShadow.style.opacity = '1'
    return true
  }

  async function normalizeToGhost(signal: AbortSignal) {
    const e = elements()
    if (!e.transitionFrame || !e.transitionImage) return
    const ghostOpacity = Number(getComputedStyle(e.transitionImage).opacity)
    const shadowOpacity = opacityOf(e.transitionShadow, 0)
    if (ghostOpacity >= 0.99 && shadowOpacity >= 0.99) {
      if (e.viewport) e.viewport.style.opacity = '0'
      return
    }
    await Promise.all([
      animate(
        e.transitionImage,
        [{ opacity: ghostOpacity }, { opacity: 1 }],
        { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
        ['opacity'],
        signal,
      ),
      animate(
        e.transitionShadow,
        [{ opacity: shadowOpacity }, { opacity: 1 }],
        { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
        ['opacity'],
        signal,
      ),
    ])
    if (e.viewport) e.viewport.style.opacity = '0'
  }

  async function handoffToMedia(signal: AbortSignal) {
    const e = elements()
    if (!e.transitionFrame) return
    if (e.viewport) e.viewport.style.opacity = '1'
    await animate(
      e.transitionImage,
      [{ opacity: Number(getComputedStyle(e.transitionImage!).opacity) }, { opacity: 0 }],
      { duration: HANDOFF_DURATION_MS, easing: 'linear' },
      ['opacity'],
      signal,
    )
    e.transitionFrame.style.display = 'none'
    e.transitionFrame.style.opacity = '0'
  }

  async function runFadeOpen(duration: number, callbacks: MotionCallbacks, signal: AbortSignal) {
    const e = elements()
    stageMounted.value = true
    const decodePromise = callbacks
      .prepareActiveSlide(true)
      .then(() => decodeActiveImage(activeIndex.value, signal))
    const shell = Promise.all([
      animate(
        e.overlay,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, easing: EASING },
        ['opacity'],
        signal,
      ),
      ...[...controls, ...captions].map((element) =>
        animate(
          element,
          [{ opacity: 0 }, { opacity: 1 }],
          { duration, easing: EASING },
          ['opacity'],
          signal,
        ),
      ),
    ])
    const media = decodePromise.then((decode) => {
      callbacks.setImageLoadFailed(!decode.ok, decode.ok ? undefined : decode.error)
      return animate(
        e.viewport,
        [{ opacity: 0 }, { opacity: decode.ok ? 1 : 0 }],
        { duration, easing: EASING },
        ['opacity'],
        signal,
      )
    })
    await Promise.all([shell, media])
  }

  async function open(index: number, callbacks: MotionCallbacks, signal: AbortSignal) {
    callbacks.resetGestureState()
    callbacks.cancelTapTimer()
    animating.value = true
    activeImagePending.value = true
    uiVisible.value = true
    activeIndex.value = index
    callbacks.setImageLoadFailed(false)

    await nextTick()
    throwIfAborted(signal)
    callbacks.syncGeometry()

    const photo = currentPhoto.value
    if (!photo) {
      resetClosedVisualState()
      return false
    }

    const config = transitionConfig ?? DEFAULT_TRANSITION_CONFIG
    const duration =
      config.mode === 'none'
        ? 0
        : toValue(reducedMotion)
          ? REDUCED_MOTION_DURATION_MS
          : config.mode === 'fade'
            ? FADE_DURATION_MS
            : OPEN_DURATION_MS
    const captured = capturedOpen?.index === index ? capturedOpen : null
    const interruptedRect = visible(transitionFrameRef.value)
      ? transitionFrameRef.value!.getBoundingClientRect()
      : null
    const fromRect =
      interruptedRect ?? captured?.rect ?? thumbRefs.get(index)?.getBoundingClientRect() ?? null
    const toRect = getAbsoluteFrameRect(photo)
    const useFlip =
      config.mode !== 'none' &&
      fromRect &&
      toRect &&
      (config.mode === 'flip' || (isUsableRect(fromRect) && shouldUseFlip(fromRect, config)))

    try {
      if (!useFlip || !fromRect || !toRect) {
        await runFadeOpen(duration, callbacks, signal)
      } else {
        const e = elements()
        const src = captured?.src || callbacks.getThumbSrc(photo)

        if (
          interruptedRect &&
          rectsMatch(interruptedRect, toRect) &&
          opacityOf(e.viewport, 0) > 0.01
        ) {
          stageMounted.value = true
          if (e.viewport) e.viewport.style.opacity = '1'
          await animate(
            e.transitionImage,
            [{ opacity: opacityOf(e.transitionImage, 1) }, { opacity: 0 }],
            { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
            ['opacity'],
            signal,
          )
          if (e.transitionFrame) {
            e.transitionFrame.style.display = 'none'
            e.transitionFrame.style.opacity = '0'
          }
          if (e.overlay) e.overlay.style.opacity = '1'
          setChromeOpacity(1)
          activeImagePending.value = false
          animating.value = false
          capturedOpen = null
          return true
        }

        normalizeTransitionVisual(toRect, src)
        if (e.transitionFrame) {
          e.transitionFrame.style.transform = flipTransform(fromRect, toRect)
        }
        if (e.overlay) e.overlay.style.opacity = '0'
        if (e.viewport) e.viewport.style.opacity = '0'
        setChromeOpacity(0)

        await nextFrame(signal)
        hiddenThumbIndex.value = index

        const flight = Promise.all([
          animate(
            e.transitionFrame,
            [{ transform: e.transitionFrame?.style.transform || 'none' }, { transform: 'none' }],
            { duration: OPEN_DURATION_MS, easing: EASING },
            ['transform'],
            signal,
          ),
          animate(
            e.overlay,
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: OPEN_DURATION_MS * 0.7, easing: EASING },
            ['opacity'],
            signal,
          ),
          animate(
            e.transitionShadow,
            [{ opacity: 0 }, { opacity: 1 }],
            {
              duration: OPEN_DURATION_MS * 0.5,
              delay: OPEN_DURATION_MS * 0.35,
              easing: EASING,
            },
            ['opacity'],
            signal,
          ),
          ...[...controls].map((element) =>
            animate(
              element,
              [{ opacity: 0 }, { opacity: 1 }],
              {
                duration: OPEN_DURATION_MS * 0.35,
                delay: OPEN_DURATION_MS * 0.55,
                easing: EASING,
              },
              ['opacity'],
              signal,
            ),
          ),
          ...[...captions].map((element) =>
            animate(
              element,
              [
                { opacity: 0, transform: 'translateY(8px)' },
                { opacity: 1, transform: 'none' },
              ],
              {
                duration: OPEN_DURATION_MS * 0.33,
                delay: OPEN_DURATION_MS * 0.62,
                easing: EASING,
              },
              ['opacity', 'transform'],
              signal,
            ),
          ),
        ])
        void flight.catch(() => {})

        const handoffWindow =
          typeof e.transitionFrame?.animate === 'function'
            ? wait(OPEN_DURATION_MS - HANDOFF_DURATION_MS, signal)
            : null
        void handoffWindow?.catch(() => {})

        await nextFrame(signal)
        stageMounted.value = true
        const decodeState: {
          result: { ok: true } | { ok: false; error: unknown } | null
        } = { result: null }
        const decode = callbacks
          .prepareActiveSlide(true)
          .then(() => decodeActiveImage(index, signal))
          .then((result) => {
            decodeState.result = result
            callbacks.setImageLoadFailed(!result.ok, result.ok ? undefined : result.error)
            return result
          })
        void decode.catch(() => {})

        if (handoffWindow) {
          await handoffWindow
        } else {
          await decode
        }
        const earlyDecode = decodeState.result

        if (earlyDecode?.ok) {
          await Promise.all([flight, handoffToMedia(signal)])
        } else {
          await flight
          const result = earlyDecode ?? (await decode)
          if (result.ok) await handoffToMedia(signal)
          else if (e.transitionFrame) e.transitionFrame.style.display = 'none'
        }
      }

      activeImagePending.value = false
      animating.value = false
      capturedOpen = null
      return true
    } catch (error) {
      persistRunningAnimations()
      animating.value = false
      activeImagePending.value = false
      throw error
    }
  }

  async function runFadeClose(duration: number, signal: AbortSignal) {
    const e = elements()
    await Promise.all([
      animate(
        e.overlay,
        [{ opacity: opacityOf(e.overlay, 1) }, { opacity: 0 }],
        { duration, easing: EASING },
        ['opacity'],
        signal,
      ),
      animate(
        e.viewport,
        [{ opacity: opacityOf(e.viewport, 1) }, { opacity: 0 }],
        { duration, easing: EASING },
        ['opacity'],
        signal,
      ),
      ...[...controls, ...captions].map((element) =>
        animate(
          element,
          [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: 0 }],
          { duration, easing: EASING },
          ['opacity'],
          signal,
        ),
      ),
    ])
  }

  async function close(callbacks: MotionCallbacks, signal: AbortSignal) {
    callbacks.cancelTapTimer()
    callbacks.resetGestureState()
    animating.value = true
    activeImagePending.value = false

    if (callbacks.isZoomedIn.value) callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
    callbacks.syncGeometry()
    const photo = currentPhoto.value
    if (!photo) {
      resetClosedVisualState()
      return
    }

    const config = transitionConfig ?? DEFAULT_TRANSITION_CONFIG
    const thumb = thumbRefs.get(activeIndex.value) ?? null
    const toRect = thumb?.getBoundingClientRect() ?? null
    const activeFrame = slideFrameRefs.get(activeIndex.value)
    const existingVisual = visible(transitionFrameRef.value)
    const fromRect = existingVisual
      ? transitionFrameRef.value!.getBoundingClientRect()
      : (activeFrame?.getBoundingClientRect() ?? getAbsoluteFrameRect(photo))
    const plan = chooseCloseTransition({
      fromRect,
      toRect,
      thumbRefExists: !!thumb,
      config,
    })
    const dragProgress = Math.min(1, Math.abs(closeDragY.value) / (areaMetrics.value?.height || 1))
    const closeDuration = Math.max(180, CLOSE_DURATION_MS * (1 - dragProgress))

    try {
      if (plan.mode !== 'flip' || !fromRect || !toRect) {
        const duration =
          plan.mode === 'instant'
            ? 0
            : toValue(reducedMotion)
              ? REDUCED_MOTION_DURATION_MS
              : FADE_DURATION_MS
        await runFadeClose(duration, signal)
      } else {
        const e = elements()
        const slideImage = slideImageRefs.get(activeIndex.value) ?? null
        const src = imageSource(slideImage, '') || callbacks.getThumbSrc(photo)
        if (!existingVisual) {
          normalizeTransitionVisual(fromRect, src)
          if (e.transitionImage) e.transitionImage.style.opacity = '0'
          if (e.transitionShadow) e.transitionShadow.style.opacity = '0'
        } else {
          rectStyle(e.transitionFrame!, fromRect)
          e.transitionFrame!.style.transform = 'none'
          e.transitionFrame!.style.display = 'block'
        }
        if (!(await prepareTransitionImage(signal))) {
          if (e.transitionFrame) e.transitionFrame.style.display = 'none'
          await runFadeClose(
            toValue(reducedMotion) ? REDUCED_MOTION_DURATION_MS : FADE_DURATION_MS,
            signal,
          )
          resetClosedVisualState()
          return
        }
        hiddenThumbIndex.value = activeIndex.value
        await normalizeToGhost(signal)

        const targetTransform = `translate3d(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px, 0) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`
        await Promise.all([
          animate(
            e.transitionFrame,
            [{ transform: 'none' }, { transform: targetTransform }],
            { duration: closeDuration, easing: EASING },
            ['transform'],
            signal,
          ),
          animate(
            e.overlay,
            [{ opacity: opacityOf(e.overlay, 1) }, { opacity: 0 }],
            {
              duration: closeDuration * 0.9,
              delay: closeDuration * 0.1,
              easing: EASING,
            },
            ['opacity'],
            signal,
          ),
          animate(
            e.transitionShadow,
            [{ opacity: 1 }, { opacity: 0 }],
            {
              duration: closeDuration * 0.55,
              delay: closeDuration * 0.45,
              easing: EASING,
            },
            ['opacity'],
            signal,
          ),
          ...[...controls, ...captions].map((element) =>
            animate(
              element,
              [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: 0 }],
              { duration: closeDuration * 0.35, easing: EASING },
              ['opacity'],
              signal,
            ),
          ),
        ])
      }
      resetClosedVisualState()
    } catch (error) {
      persistRunningAnimations()
      animating.value = false
      throw error
    }
  }

  function applyDrag(value: number) {
    closeDragY.value = value
    if (dragFrame) return
    dragFrame = requestAnimationFrame(() => {
      dragFrame = 0
      const height = areaMetrics.value?.height || 1
      const progress = Math.min(1, Math.abs(closeDragY.value) / height)
      const scale = 1 - progress * 0.05
      const e = elements()
      if (e.viewport)
        e.viewport.style.transform = `translate3d(0, ${closeDragY.value}px, 0) scale(${scale})`
      if (e.overlay) e.overlay.style.opacity = String(1 - progress)
      setChromeOpacity(uiVisible.value ? 1 - progress : 0)
    })
  }

  async function settleDrag(signal?: AbortSignal) {
    const controller = signal ? null : new AbortController()
    const activeSignal = signal ?? controller!.signal
    const e = elements()
    await Promise.all([
      animate(
        e.viewport,
        [{ transform: transformOf(e.viewport) }, { transform: 'none' }],
        { duration: DRAG_SETTLE_MS, easing: EASING },
        ['transform'],
        activeSignal,
      ),
      animate(
        e.overlay,
        [{ opacity: opacityOf(e.overlay, 1) }, { opacity: 1 }],
        { duration: DRAG_SETTLE_MS, easing: EASING },
        ['opacity'],
        activeSignal,
      ),
      ...[...controls, ...captions].map((element) =>
        animate(
          element,
          [
            { opacity: Number(getComputedStyle(element).opacity) },
            { opacity: uiVisible.value ? 1 : 0 },
          ],
          { duration: DRAG_SETTLE_MS, easing: EASING },
          ['opacity'],
          activeSignal,
        ),
      ),
    ])
    closeDragY.value = 0
  }

  async function handleCloseGesture(
    deltaY: number,
    velocityY: number,
    closeFn: () => Promise<void>,
  ) {
    const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)
    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      await closeFn()
      return
    }
    animating.value = true
    try {
      await settleDrag()
    } finally {
      animating.value = false
    }
  }

  function setChromeVisible(show: boolean) {
    if (animating.value) return
    const target = show ? 1 : 0
    const controller = new AbortController()
    for (const element of [...controls, ...captions]) {
      void animate(
        element,
        [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: target }],
        { duration: REDUCED_MOTION_DURATION_MS, easing: EASING },
        ['opacity'],
        controller.signal,
      )
    }
  }

  watch(uiVisible, setChromeVisible)

  return {
    animating,
    hiddenThumbIndex,
    uiVisible,
    closeDragY,
    stageMounted,
    activeImagePending,
    transitionInProgress,
    captureOpen,
    open,
    close,
    cancel,
    resetClosedVisualState,
    setCloseDragY: applyDrag,
    settleDrag,
    handleCloseGesture,
    handleBackdropClick: (closeFn: () => Promise<void>) => closeFn(),
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
