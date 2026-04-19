import { nextTick } from 'vue'
import {
  flipTransform,
  isUsableRect,
  makeGhostBaseStyle,
  ensureImageLoaded,
  nextFrame,
  wait,
  animateNumber,
  easeOutCubic,
  shouldUseFlip,
  type PhotoItem,
  type RectLike,
} from '@nuxt-photo/core'
import { openDurationMs, type GhostState, type TransitionCallbacks } from './types'
import { resetOpenState } from './state'

async function doInstantOpen(s: GhostState, photo: PhotoItem) {
  s.debug?.log('transitions', 'open: INSTANT (mode=none)')
  s.overlayOpacity.value = 1
  await ensureImageLoaded(photo.src)
  s.mediaOpacity.value = 1
  s.chromeOpacity.value = 1
}

async function doFadeOpen(s: GhostState, photo: PhotoItem, targetRect: RectLike | null) {
  const fadeOpenDuration = 300

  s.animating.value = true
  const imgSrc = photo.thumbSrc || photo.src

  if (targetRect) {
    s.debug?.log('transitions', `open FADE: ghost scale-in at ${targetRect.width.toFixed(0)}x${targetRect.height.toFixed(0)} @ (${targetRect.left.toFixed(0)},${targetRect.top.toFixed(0)})`)

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

    await animateNumber(0, 1, fadeOpenDuration, (t) => {
      const sc = 0.92 + 0.08 * t
      s.ghostStyle.value = {
        ...s.ghostStyle.value,
        transform: `scale(${sc})`,
        opacity: String(t),
      }
      s.overlayOpacity.value = t
    }, easeOutCubic)

    await ensureImageLoaded(photo.src)
    s.mediaOpacity.value = 1
    s.ghostVisible.value = false
    s.chromeOpacity.value = 1
  } else {
    s.debug?.log('transitions', 'open FADE: no target rect, simple overlay fade')

    await animateNumber(0, 1, fadeOpenDuration, (v) => {
      s.overlayOpacity.value = v
    }, easeOutCubic)

    await ensureImageLoaded(photo.src)
    s.mediaOpacity.value = 1
    s.chromeOpacity.value = 1
  }

  s.animating.value = false
}

async function doFlipOpen(s: GhostState, index: number, photo: PhotoItem, fromRect: DOMRect, toRect: RectLike) {
  s.debug?.log('transitions', 'open: using FLIP animation')

  s.animating.value = true
  s.hiddenThumbIndex.value = index

  const thumbSrc = photo.thumbSrc || photo.src
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
    transition:
      `transform ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
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

  await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.src)])

  s.mediaOpacity.value = 1
  await nextFrame()
  resetOpenState(s)
}

export async function openTransition(s: GhostState, index: number, callbacks: TransitionCallbacks) {
  if (s.animating.value) return

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

  try {
    if (s.transitionConfig?.mode === 'none') {
      await doInstantOpen(s, photo)
      s.debug?.log('transitions', 'open: complete')
      s.debug?.groupEnd('transitions')
      return
    }

    const thumbEl = s.thumbRefs.get(index)
    const fromRect = thumbEl?.getBoundingClientRect() ?? null
    const toRect = s.getAbsoluteFrameRect(photo)

    const useFlip = fromRect && toRect && isUsableRect(fromRect)
      && (!s.transitionConfig || shouldUseFlip(fromRect, s.transitionConfig, s.debug))

    if (useFlip) {
      await doFlipOpen(s, index, photo, fromRect, toRect)
    } else {
      await doFadeOpen(s, photo, toRect)
    }

    s.debug?.log('transitions', 'open: complete')
    s.debug?.groupEnd('transitions')
  } catch (err) {
    s.debug?.warn('transitions', 'open: error, forcing recovery', err)
    s.debug?.groupEnd('transitions')
    s.overlayOpacity.value = 1
    s.mediaOpacity.value = 1
    resetOpenState(s)
    throw err
  }
}
