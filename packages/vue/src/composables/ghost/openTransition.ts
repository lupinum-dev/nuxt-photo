/**
 * Open-transition choreography for the lightbox ghost element.
 *
 * The public entry point is {@link openTransition}; it selects one of three
 * paths based on `transitionConfig.mode`, the thumbnail rect, and the
 * visibility heuristic in `shouldUseFlip` (from `@nuxt-photo/core`):
 *
 *   1. `doInstantOpen` — `mode: 'none'` (tests, reduced-motion). Overlay to 1,
 *      wait for the image. Successful loads reveal media + chrome. Failed
 *      loads keep media hidden and let the lightbox render its fallback.
 *
 *   2. `doFadeOpen` — either `mode: 'fade'` or auto fallback when the thumbnail
 *      is off-screen/too small.
 *        • with target rect: place ghost at the target (viewer) rect with
 *          opacity 0 + scale 0.92, then animate scale→1, opacity→1, and
 *          overlay→1 in parallel over 300ms (JS `animateNumber`).
 *        • without target rect: just ramp the overlay.
 *      After the ramp completes, wait for the full image, then reveal media
 *      and hide the ghost.
 *
 *   3. `doFlipOpen` — FLIP morph from thumbnail rect to viewer rect. Position
 *      the ghost at the destination with a `transform` that *inverts* it back
 *      onto the thumb rect, then on the next frame set transform to identity
 *      and let CSS transition (plus border-radius + shadow growth) run.
 *      Image load races the wait in `Promise.all`, then media is revealed.
 *
 * Invariant: `mediaOpacity.value = 1` is only set after
 * `callbacks.loadSlideImage(photo)` returns `{ ok: true }`. Failed loads keep
 * the media layer hidden so broken images are not treated as ready.
 *
 * State mutated (all refs live on `GhostState`): overlayOpacity, mediaOpacity,
 * chromeOpacity, ghostSrc, ghostVisible, ghostStyle, animating, activeIndex,
 * uiVisible, lightboxMounted, hiddenThumbIndex.
 *
 * On any unexpected error the catch block in `openTransition` forces overlay +
 * media to 1 and calls `resetOpenState` so the lightbox is always in a usable
 * state — no half-animated limbo.
 */
import { nextTick } from 'vue'
import {
  flipTransform,
  isUsableRect,
  makeGhostBaseStyle,
  shouldUseFlip,
  type PhotoItem,
  type RectLike,
} from '@nuxt-photo/core'
import {
  openDurationMs,
  type GhostState,
  type TransitionCallbacks,
} from './types'
import { resetOpenState } from './state'
import {
  animateNumber,
  easeOutCubic,
  nextFrame,
  wait,
} from '../../internal/runtime'

function showImageLoadFallback(s: GhostState) {
  s.ghostVisible.value = false
  s.ghostSrc.value = ''
  s.hiddenThumbIndex.value = null
  s.overlayOpacity.value = 1
  s.mediaOpacity.value = 0
  s.chromeOpacity.value = 1
  s.animating.value = false
  s.closeDragY.value = 0
  s.disableBackdropTransition.value = false
}

async function revealLoadedSlide(
  s: GhostState,
  photo: PhotoItem,
  callbacks: TransitionCallbacks,
): Promise<boolean> {
  const result = await callbacks.loadSlideImage(photo)
  if (!result.ok) {
    s.debug?.warn(
      'transitions',
      'open: slide image failed to load',
      result.error,
    )
    showImageLoadFallback(s)
    return false
  }

  s.mediaOpacity.value = 1
  return true
}

async function doInstantOpen(
  s: GhostState,
  photo: PhotoItem,
  callbacks: TransitionCallbacks,
) {
  s.debug?.log('transitions', 'open: INSTANT (mode=none)')
  s.overlayOpacity.value = 1
  await revealLoadedSlide(s, photo, callbacks)
  s.chromeOpacity.value = 1
}

async function doFadeOpen(
  s: GhostState,
  photo: PhotoItem,
  targetRect: RectLike | null,
  callbacks: TransitionCallbacks,
) {
  const fadeOpenDuration = 300

  s.animating.value = true
  const imgSrc = callbacks.getThumbSrc(photo)

  if (targetRect) {
    s.debug?.log(
      'transitions',
      `open FADE: ghost scale-in at ${targetRect.width.toFixed(0)}x${targetRect.height.toFixed(0)} @ (${targetRect.left.toFixed(0)},${targetRect.top.toFixed(0)})`,
    )

    s.ghostSrc.value = imgSrc
    s.ghostVisible.value = true
    s.ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'contain',
      transformOrigin: 'center center',
      pointerEvents: 'none',
      willChange: 'transform, opacity',
      borderRadius: '16px',
      opacity: '0',
      transform: 'scale(0.92)',
      ...makeGhostBaseStyle(targetRect),
    }

    await nextFrame()

    await animateNumber(
      0,
      1,
      fadeOpenDuration,
      (t) => {
        const sc = 0.92 + 0.08 * t
        s.ghostStyle.value = {
          ...s.ghostStyle.value,
          transform: `scale(${sc})`,
          opacity: String(t),
        }
        s.overlayOpacity.value = t
      },
      easeOutCubic,
    )

    await revealLoadedSlide(s, photo, callbacks)
    s.ghostVisible.value = false
    s.chromeOpacity.value = 1
  } else {
    s.debug?.log(
      'transitions',
      'open FADE: no target rect, simple overlay fade',
    )

    await animateNumber(
      0,
      1,
      fadeOpenDuration,
      (v) => {
        s.overlayOpacity.value = v
      },
      easeOutCubic,
    )

    await revealLoadedSlide(s, photo, callbacks)
    s.chromeOpacity.value = 1
  }

  s.animating.value = false
}

async function doFlipOpen(
  s: GhostState,
  index: number,
  photo: PhotoItem,
  fromRect: DOMRect,
  toRect: RectLike,
  callbacks: TransitionCallbacks,
) {
  s.debug?.log('transitions', 'open: using FLIP animation')

  s.animating.value = true
  s.hiddenThumbIndex.value = index

  const thumbSrc = callbacks.getThumbSrc(photo)
  s.ghostSrc.value = thumbSrc
  s.ghostVisible.value = true
  s.ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    transition: `transform ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    ...makeGhostBaseStyle(toRect),
    transform: flipTransform(fromRect, toRect),
  }

  await nextFrame()

  s.overlayOpacity.value = 1
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  }

  const [, loadResult] = await Promise.all([
    wait(openDurationMs),
    callbacks.loadSlideImage(photo),
  ])

  if (!loadResult.ok) {
    s.debug?.warn(
      'transitions',
      'open: slide image failed to load',
      loadResult.error,
    )
    showImageLoadFallback(s)
    return
  }

  s.mediaOpacity.value = 1
  await nextFrame()
  resetOpenState(s)
}

/** Run the lightbox open transition with automatic FLIP/fade/instant selection. */
export async function openTransition(
  s: GhostState,
  index: number,
  callbacks: TransitionCallbacks,
): Promise<boolean> {
  if (s.animating.value) return false

  s.debug?.group('transitions', `open(index=${index})`)

  callbacks.resetGestureState()
  callbacks.cancelTapTimer()

  s.activeIndex.value = index
  s.uiVisible.value = true

  s.lightboxMounted.value = true
  s.overlayOpacity.value = 0
  s.mediaOpacity.value = 0
  s.chromeOpacity.value = 0

  await nextTick()
  await nextFrame()

  callbacks.syncGeometry()
  callbacks.refreshZoomState(true)

  const photo = s.currentPhoto.value
  if (!photo) {
    s.debug?.warn('transitions', 'open: no active photo, aborting')
    s.lightboxMounted.value = false
    s.overlayOpacity.value = 0
    s.mediaOpacity.value = 0
    s.chromeOpacity.value = 0
    s.debug?.groupEnd('transitions')
    return false
  }

  try {
    if (s.transitionConfig?.mode === 'none') {
      await doInstantOpen(s, photo, callbacks)
      s.debug?.log('transitions', 'open: complete')
      s.debug?.groupEnd('transitions')
      return true
    }

    const thumbEl = s.thumbRefs.get(index)
    const fromRect = thumbEl?.getBoundingClientRect() ?? null
    const toRect = s.getAbsoluteFrameRect(photo)

    const useFlip =
      fromRect &&
      toRect &&
      isUsableRect(fromRect) &&
      (!s.transitionConfig ||
        shouldUseFlip(fromRect, s.transitionConfig, s.debug))

    if (useFlip) {
      await doFlipOpen(s, index, photo, fromRect, toRect, callbacks)
    } else {
      await doFadeOpen(s, photo, toRect, callbacks)
    }

    s.debug?.log('transitions', 'open: complete')
    s.debug?.groupEnd('transitions')
    return true
  } catch (err) {
    s.debug?.warn('transitions', 'open: error, forcing recovery', err)
    s.debug?.groupEnd('transitions')
    s.overlayOpacity.value = 1
    s.mediaOpacity.value = 1
    resetOpenState(s)
    throw err
  }
}
