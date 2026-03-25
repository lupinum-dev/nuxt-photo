<template>
  <div class="demo-shell">
    <header class="hero">
      <p class="eyebrow">nuxt-photo connected-motion POC</p>
      <h1>Vue can do this elegantly.</h1>
      <p class="lede">
        Click any image. The thumbnail is picked up, moved into the viewer,
        swiped between slides, and zoomed with image-first gestures.
      </p>
    </header>

    <section class="gallery">
      <button
        v-for="(photo, index) in photos"
        :key="photo.id"
        :ref="setThumbRef(index)"
        class="thumb"
        :class="{ 'thumb-hidden': hiddenThumbIndex === index }"
        :style="{ aspectRatio: `${photo.width} / ${photo.height}` }"
        @click="open(index)"
      >
        <img
          class="thumb-image"
          :src="photo.thumb"
          :alt="photo.title"
          draggable="false"
        />
        <div class="thumb-gradient" />
        <div class="thumb-meta">
          <strong>{{ photo.title }}</strong>
          <span>{{ photo.subtitle }}</span>
        </div>
      </button>
    </section>

    <teleport to="body">
      <div v-if="lightboxMounted" class="lightbox-root">
        <div
          class="lightbox-backdrop"
          :style="backdropStyle"
          @click="handleBackdropClick"
        />

        <div class="lightbox-ui" :style="lightboxUiStyle">
          <div class="topbar" :style="chromeStyle">
            <div class="counter">
              {{ activeIndex + 1 }} / {{ photos.length }}
            </div>

            <div class="actions">
              <button class="ui-btn" @click="prev" :disabled="controlsDisabled">
                ←
              </button>
              <button class="ui-btn" @click="next" :disabled="controlsDisabled">
                →
              </button>
              <button class="ui-btn" @click="toggleZoom()" :disabled="controlsDisabled || !zoomAllowed">
                {{ isZoomedIn ? 'Fit' : 'Zoom' }}
              </button>
              <button class="ui-btn close-btn" @click="close" :disabled="controlsDisabled">
                ✕
              </button>
            </div>
          </div>

          <div class="stage">
            <div
              ref="mediaAreaRef"
              class="media-area"
              :class="{ 'media-area--zoomed': isZoomedIn, 'media-area--dragging': gesturePhase !== 'idle' }"
              @pointerdown="onMediaPointerDown"
              @pointermove="onMediaPointerMove"
              @pointerup="onMediaPointerUp"
              @pointercancel="onMediaPointerCancel"
              @wheel="onWheel"
            >
              <div class="media-viewport">
                <div class="media-track" :style="mediaTrackStyle">
                  <div
                    v-for="view in slideViews"
                    :key="`${view.index}-${view.photo.id}`"
                    class="slide-cell"
                    :style="slideCellStyle"
                  >
                    <div class="slide-frame" :style="getSlideFrameStyle(view.photo)">
                      <div class="slide-zoom" :style="getSlideZoomStyle(view)">
                        <img
                          class="lightbox-image"
                          :src="view.photo.full"
                          :alt="view.photo.title"
                          draggable="false"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="zoomAllowed" class="zoom-hint" :style="chromeStyle">
                {{ isZoomedIn ? 'Drag to pan' : 'Double tap or use the Zoom button' }}
              </div>
            </div>

            <div class="caption" :style="chromeStyle">
              <h2>{{ currentPhoto.title }}</h2>
              <p>{{ currentPhoto.subtitle }}</p>
            </div>
          </div>
        </div>

        <img
          v-if="ghostVisible"
          class="ghost-image"
          :src="ghostSrc"
          alt=""
          aria-hidden="true"
          :style="ghostStyle"
        />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
} from 'vue'

type Photo = {
  id: number
  title: string
  subtitle: string
  width: number
  height: number
  thumb: string
  full: string
}

type GestureMode = 'idle' | 'slide' | 'pan' | 'close'

type ZoomState = {
  fit: number
  secondary: number
  max: number
  current: number
}

type PanState = {
  x: number
  y: number
}

type SlideView = {
  photo: Photo
  index: number
  offset: -1 | 0 | 1
  isActive: boolean
}

type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

type AreaMetrics = RectLike

type PointerSession = {
  id: number
  pointerType: string
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  moved: boolean
  startPan: PanState
}

const photos: Photo[] = [
  {
    id: 1,
    title: 'Desert Light',
    subtitle: 'Connected open, swipe, and zoom',
    width: 1600,
    height: 1000,
    thumb: 'https://picsum.photos/seed/nuxt-photo-1/640/400',
    full: 'https://picsum.photos/seed/nuxt-photo-1/1600/1000',
  },
  {
    id: 2,
    title: 'Ocean Glass',
    subtitle: 'Image-first zoom with slide handoff',
    width: 1200,
    height: 1500,
    thumb: 'https://picsum.photos/seed/nuxt-photo-2/480/600',
    full: 'https://picsum.photos/seed/nuxt-photo-2/1200/1500',
  },
  {
    id: 3,
    title: 'Evening Canyon',
    subtitle: 'Vue state drives the track',
    width: 1600,
    height: 1067,
    thumb: 'https://picsum.photos/seed/nuxt-photo-3/640/427',
    full: 'https://picsum.photos/seed/nuxt-photo-3/1600/1067',
  },
  {
    id: 4,
    title: 'Forest Haze',
    subtitle: 'Looping stays simple with three views',
    width: 1500,
    height: 1000,
    thumb: 'https://picsum.photos/seed/nuxt-photo-4/600/400',
    full: 'https://picsum.photos/seed/nuxt-photo-4/1500/1000',
  },
  {
    id: 5,
    title: 'Alpine Frame',
    subtitle: 'Portraits keep their fitted geometry',
    width: 1400,
    height: 1750,
    thumb: 'https://picsum.photos/seed/nuxt-photo-5/480/600',
    full: 'https://picsum.photos/seed/nuxt-photo-5/1400/1750',
  },
  {
    id: 6,
    title: 'Soft Coast',
    subtitle: 'No carousel library required',
    width: 1600,
    height: 1100,
    thumb: 'https://picsum.photos/seed/nuxt-photo-6/640/440',
    full: 'https://picsum.photos/seed/nuxt-photo-6/1600/1100',
  },
]

const thumbRefs = new Map<number, HTMLElement>()
const mediaAreaRef = ref<HTMLElement | null>(null)

const activeIndex = ref(0)
const lightboxMounted = ref(false)
const animating = ref(false)
const gesturePhase = ref<GestureMode>('idle')

const overlayOpacity = ref(0)
const mediaOpacity = ref(0)
const chromeOpacity = ref(0)
const uiVisible = ref(true)

const areaMetrics = ref<AreaMetrics | null>(null)
const slideDragOffset = ref(0)
const closeDragY = ref(0)

const zoomState = ref<ZoomState>({
  fit: 1,
  secondary: 1,
  max: 1,
  current: 1,
})
const panState = ref<PanState>({ x: 0, y: 0 })

const ghostVisible = ref(false)
const ghostSrc = ref('')
const ghostStyle = ref<CSSProperties>({})

const hiddenThumbIndex = ref<number | null>(null)
const previousBodyOverflow = ref('')
const previousBodyPaddingRight = ref('')

const currentPhoto = computed<Photo>(() => photos[activeIndex.value] ?? photos[0]!)
const isZoomedIn = computed(() => zoomState.value.current > zoomState.value.fit + 0.01)
const zoomAllowed = computed(() => zoomState.value.max > zoomState.value.fit + 0.05)
const controlsDisabled = computed(() => animating.value || ghostVisible.value)

const slideViews = computed<SlideView[]>(() => {
  if (!photos.length) return []

  return [-1, 0, 1].map((offset) => {
    const index = getLoopedIndex(activeIndex.value + offset)
    return {
      photo: photos[index]!,
      index,
      offset: offset as -1 | 0 | 1,
      isActive: offset === 0,
    }
  })
})

const chromeStyle = computed<CSSProperties>(() => ({
  opacity: String(uiVisible.value ? chromeOpacity.value : 0),
  pointerEvents: uiVisible.value && chromeOpacity.value > 0.05 ? 'auto' : 'none',
}))

const closeDragRatio = computed(() => {
  const height = areaMetrics.value?.height || 1
  return Math.min(0.75, Math.abs(closeDragY.value) / Math.max(240, height * 0.85))
})

const backdropStyle = computed<CSSProperties>(() => ({
  opacity: String(overlayOpacity.value * (1 - closeDragRatio.value)),
}))

const lightboxUiStyle = computed<CSSProperties>(() => ({
  transform: `translate3d(0, ${closeDragY.value}px, 0) scale(${1 - closeDragRatio.value * 0.05})`,
}))

const mediaTrackStyle = computed<CSSProperties>(() => {
  const area = areaMetrics.value
  const width = area?.width ?? 0
  const height = area?.height ?? 0

  return {
    width: `${width * 3}px`,
    height: `${height}px`,
    opacity: String(mediaOpacity.value),
    transform: `translate3d(${-width + slideDragOffset.value}px, 0, 0)`,
  }
})

const slideCellStyle = computed<CSSProperties>(() => {
  const area = areaMetrics.value
  return {
    width: `${area?.width ?? 0}px`,
    height: `${area?.height ?? 0}px`,
  }
})

const openDurationMs = 420
const closeDurationMs = 380
const slideDurationMs = 260
const zoomDurationMs = 220

const imageLoadCache = new Map<string, Promise<void>>()

let pointerSession: PointerSession | null = null
let tapTimer: ReturnType<typeof setTimeout> | undefined
let lastTap:
  | {
      time: number
      clientX: number
      clientY: number
    }
  | null = null

function setThumbRef(index: number) {
  return (value: Element | ComponentPublicInstance | null) => {
    const el = value instanceof HTMLElement
      ? value
      : value && '$el' in value && value.$el instanceof HTMLElement
        ? value.$el
        : null

    if (el instanceof HTMLElement) {
      thumbRefs.set(index, el)
    } else {
      thumbRefs.delete(index)
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}

function isUsableRect(rect: DOMRect | null): rect is DOMRect {
  if (!rect) return false
  if (rect.width < 24 || rect.height < 24) return false
  if (rect.bottom < 0 || rect.right < 0) return false
  if (typeof window !== 'undefined') {
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false
  }
  return true
}

function getLoopedIndex(index: number) {
  return (index + photos.length) % photos.length
}

function fitRect(container: RectLike, aspect: number) {
  let width = container.width
  let height = width / aspect

  if (height > container.height) {
    height = container.height
    width = height * aspect
  }

  return {
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
    width,
    height,
  }
}

function flipTransform(from: RectLike, to: RectLike) {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = from.width / to.width
  const sy = from.height / to.height
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

function makeGhostBaseStyle(to: RectLike) {
  return {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  }
}

function ensureImageLoaded(src: string) {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src

    if (image.decode) {
      image.decode().catch(() => {}).finally(resolve)
      return
    }

    if (image.complete) {
      resolve()
    }
  })

  imageLoadCache.set(src, promise)
  return promise
}

function lockBodyScroll(locked: boolean) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (locked) {
    previousBodyOverflow.value = document.body.style.overflow
    previousBodyPaddingRight.value = document.body.style.paddingRight

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    return
  }

  document.body.style.overflow = previousBodyOverflow.value
  document.body.style.paddingRight = previousBodyPaddingRight.value
}

function syncGeometry() {
  const mediaAreaEl = mediaAreaRef.value
  if (!mediaAreaEl) return null

  const rect = mediaAreaEl.getBoundingClientRect()
  if (!isUsableRect(rect)) return null

  areaMetrics.value = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }

  return areaMetrics.value
}

function getRelativeFrameRect(photo: Photo, area = areaMetrics.value) {
  if (!area) return null

  return fitRect(
    {
      left: 0,
      top: 0,
      width: area.width,
      height: area.height,
    },
    photo.width / photo.height,
  )
}

function getAbsoluteFrameRect(photo: Photo, area = areaMetrics.value) {
  if (!area) return null

  return fitRect(area, photo.width / photo.height)
}

function computeZoomLevels(photo: Photo): ZoomState {
  const frame = getRelativeFrameRect(photo)
  if (!frame) {
    return { fit: 1, secondary: 1, max: 1, current: 1 }
  }

  const naturalMax = Math.max(
    1,
    Math.min(
      4,
      photo.width / frame.width,
      photo.height / frame.height,
    ),
  )
  const secondary = naturalMax <= 1.05 ? 1 : Math.min(2, naturalMax)

  return {
    fit: 1,
    secondary,
    max: Math.max(secondary, naturalMax),
    current: 1,
  }
}

function getPanBounds(photo: Photo, zoom: number) {
  const area = areaMetrics.value
  const frame = getRelativeFrameRect(photo, area)
  if (!area || !frame) {
    return { x: 0, y: 0 }
  }

  return {
    x: Math.max(0, (frame.width * zoom - area.width) / 2),
    y: Math.max(0, (frame.height * zoom - area.height) / 2),
  }
}

function clampPan(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
  const bounds = getPanBounds(photo, zoom)

  return {
    x: Math.min(bounds.x, Math.max(-bounds.x, pan.x)),
    y: Math.min(bounds.y, Math.max(-bounds.y, pan.y)),
  }
}

function rubberband(value: number, min: number, max: number) {
  if (value < min) {
    return min + (value - min) * 0.2
  }

  if (value > max) {
    return max + (value - max) * 0.2
  }

  return value
}

function clampPanWithResistance(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
  const bounds = getPanBounds(photo, zoom)

  return {
    x: rubberband(pan.x, -bounds.x, bounds.x),
    y: rubberband(pan.y, -bounds.y, bounds.y),
  }
}

function getPointFromClient(clientX: number, clientY: number) {
  const area = areaMetrics.value
  if (!area) return { x: 0, y: 0 }

  return {
    x: clientX - area.left - area.width / 2,
    y: clientY - area.top - area.height / 2,
  }
}

function getTargetPanForZoom(targetZoom: number, clientPoint?: { x: number; y: number }) {
  if (targetZoom <= zoomState.value.fit + 0.01) {
    return { x: 0, y: 0 }
  }

  const point = clientPoint ? getPointFromClient(clientPoint.x, clientPoint.y) : { x: 0, y: 0 }
  const currentZoom = zoomState.value.current
  const currentPan = panState.value

  const targetPan = {
    x: point.x - ((point.x - currentPan.x) / currentZoom) * targetZoom,
    y: point.y - ((point.y - currentPan.y) / currentZoom) * targetZoom,
  }

  return clampPan(targetPan, targetZoom)
}

async function animateNumber(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing = easeInOutCubic,
) {
  if (duration <= 0 || from === to) {
    onUpdate(to)
    return
  }

  const start = performance.now()

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      onUpdate(from + (to - from) * easing(progress))

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(tick)
  })
}

async function animatePanZoom(targetZoom: number, targetPan: PanState, duration = zoomDurationMs) {
  const fromZoom = zoomState.value.current
  const fromPan = { ...panState.value }

  await animateNumber(0, 1, duration, (progress) => {
    zoomState.value = {
      ...zoomState.value,
      current: fromZoom + (targetZoom - fromZoom) * easeOutCubic(progress),
    }

    const nextPan = {
      x: fromPan.x + (targetPan.x - fromPan.x) * easeOutCubic(progress),
      y: fromPan.y + (targetPan.y - fromPan.y) * easeOutCubic(progress),
    }

    panState.value = clampPan(nextPan, zoomState.value.current)
  })

  zoomState.value = { ...zoomState.value, current: targetZoom }
  panState.value = clampPan(targetPan, targetZoom)
}

async function animateSlideTo(targetOffset: number, duration = slideDurationMs) {
  const start = slideDragOffset.value
  await animateNumber(start, targetOffset, duration, (value) => {
    slideDragOffset.value = value
  })
}

async function animateCloseDragTo(target: number, duration = 220) {
  const start = closeDragY.value
  await animateNumber(start, target, duration, (value) => {
    closeDragY.value = value
  })
}

function refreshZoomState(reset = false) {
  const next = computeZoomLevels(currentPhoto.value)
  const current = reset
    ? next.fit
    : Math.min(next.max, Math.max(next.fit, zoomState.value.current))

  zoomState.value = {
    fit: next.fit,
    secondary: next.secondary,
    max: next.max,
    current,
  }

  panState.value = current <= next.fit + 0.01
    ? { x: 0, y: 0 }
    : clampPan(panState.value, current, currentPhoto.value)
}

function resetGestureState() {
  gesturePhase.value = 'idle'
  pointerSession = null
}

function cancelTapTimer() {
  if (tapTimer) {
    clearTimeout(tapTimer)
    tapTimer = undefined
  }
}

function handleTap(clientX: number, clientY: number) {
  const now = performance.now()
  const isDoubleTap = lastTap
    && now - lastTap.time < 260
    && Math.abs(clientX - lastTap.clientX) < 24
    && Math.abs(clientY - lastTap.clientY) < 24

  cancelTapTimer()

  if (isDoubleTap) {
    lastTap = null
    void toggleZoom({ x: clientX, y: clientY })
    return
  }

  lastTap = { time: now, clientX, clientY }
  tapTimer = setTimeout(() => {
    uiVisible.value = !uiVisible.value
    tapTimer = undefined
  }, 220)
}

function classifyGesture(deltaX: number, deltaY: number, pointerType: string): GestureMode {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const threshold = pointerType === 'touch' ? 10 : 6

  if (absX < threshold && absY < threshold) {
    return 'idle'
  }

  const horizontalIntent = absX > absY * 1.1
  const verticalIntent = absY > absX * 1.1

  if (isZoomedIn.value) {
    const bounds = getPanBounds(currentPhoto.value, zoomState.value.current)
    const canPanX = bounds.x > 0.5
    const canPanY = bounds.y > 0.5
    const atLeftEdge = panState.value.x >= bounds.x - 1
    const atRightEdge = panState.value.x <= -bounds.x + 1
    const wantsOutwardSlide = horizontalIntent
      && (
        !canPanX
        || (deltaX > 0 && atLeftEdge)
        || (deltaX < 0 && atRightEdge)
      )

    if (!wantsOutwardSlide && (canPanX || canPanY)) {
      return 'pan'
    }

    if (horizontalIntent) {
      return 'slide'
    }

    return 'pan'
  }

  if (horizontalIntent) {
    return 'slide'
  }

  if (verticalIntent) {
    return 'close'
  }

  return absX >= absY ? 'slide' : 'close'
}

function resolveSlideTarget(dragDelta: number, velocityX: number) {
  const width = areaMetrics.value?.width ?? 0
  const threshold = width * 0.18

  if (dragDelta <= -threshold || velocityX <= -0.45) {
    return 1
  }

  if (dragDelta >= threshold || velocityX >= 0.45) {
    return -1
  }

  return 0
}

async function commitSlideChange(direction: number) {
  if (!lightboxMounted.value || !direction) return

  const width = areaMetrics.value?.width ?? 0
  if (!width) {
    activeIndex.value = getLoopedIndex(activeIndex.value + direction)
    refreshZoomState(true)
    return
  }

  animating.value = true
  await animateSlideTo(direction > 0 ? -width : width)

  activeIndex.value = getLoopedIndex(activeIndex.value + direction)
  slideDragOffset.value = 0
  closeDragY.value = 0

  await nextTick()
  await nextFrame()

  syncGeometry()
  refreshZoomState(true)
  void ensureImageLoaded(currentPhoto.value.full)
  animating.value = false
}

function getSlideFrameStyle(photo: Photo): CSSProperties {
  const frame = getRelativeFrameRect(photo)

  return {
    width: `${frame?.width ?? 0}px`,
    height: `${frame?.height ?? 0}px`,
  }
}

function getSlideZoomStyle(view: SlideView): CSSProperties {
  const scale = view.isActive ? zoomState.value.current : 1
  const panX = view.isActive ? panState.value.x : 0
  const panY = view.isActive ? panState.value.y : 0

  return {
    transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
  }
}

async function toggleZoom(clientPoint?: { x: number; y: number }) {
  if (!lightboxMounted.value || animating.value || !zoomAllowed.value) return

  const targetZoom = isZoomedIn.value ? zoomState.value.fit : zoomState.value.secondary
  const targetPan = getTargetPanForZoom(targetZoom, clientPoint)

  animating.value = true
  await animatePanZoom(targetZoom, targetPan)
  animating.value = false
}

async function open(index: number) {
  if (animating.value) return

  resetGestureState()
  cancelTapTimer()
  lastTap = null

  activeIndex.value = index
  slideDragOffset.value = 0
  closeDragY.value = 0
  uiVisible.value = true

  lightboxMounted.value = true
  overlayOpacity.value = 0
  mediaOpacity.value = 0
  chromeOpacity.value = 0

  await nextTick()
  await nextFrame()

  syncGeometry()
  refreshZoomState(true)

  const photo = currentPhoto.value
  const thumbEl = thumbRefs.get(index)
  const fromRect = thumbEl?.getBoundingClientRect() ?? null
  const toRect = getAbsoluteFrameRect(photo)

  if (!isUsableRect(fromRect) || !toRect) {
    overlayOpacity.value = 1
    await ensureImageLoaded(photo.full)
    mediaOpacity.value = 1
    chromeOpacity.value = 1
    return
  }

  animating.value = true
  hiddenThumbIndex.value = index

  ghostSrc.value = photo.thumb
  ghostVisible.value = true
  ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'contain',
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

  overlayOpacity.value = 1
  ghostStyle.value = {
    ...ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  }

  await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.full)])

  mediaOpacity.value = 1
  await nextFrame()
  ghostVisible.value = false
  chromeOpacity.value = 1
  animating.value = false
}

async function close() {
  if (!lightboxMounted.value || animating.value) return

  cancelTapTimer()
  lastTap = null
  resetGestureState()

  if (isZoomedIn.value || closeDragY.value) {
    zoomState.value = { ...zoomState.value, current: zoomState.value.fit }
    panState.value = { x: 0, y: 0 }
    closeDragY.value = 0
    await nextFrame()
  }

  syncGeometry()

  const photo = currentPhoto.value
  const fromRect = getAbsoluteFrameRect(photo)
  const toRect = thumbRefs.get(activeIndex.value)?.getBoundingClientRect() ?? null

  if (!fromRect || !isUsableRect(toRect)) {
    mediaOpacity.value = 0
    chromeOpacity.value = 0
    overlayOpacity.value = 0
    await wait(220)
    ghostVisible.value = false
    lightboxMounted.value = false
    hiddenThumbIndex.value = null
    return
  }

  animating.value = true
  hiddenThumbIndex.value = activeIndex.value
  mediaOpacity.value = 0
  chromeOpacity.value = 0

  ghostSrc.value = photo.full
  ghostVisible.value = true
  ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'contain',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
    transition:
      `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    ...makeGhostBaseStyle(toRect),
    transform: flipTransform(fromRect, toRect),
  }

  await nextFrame()

  overlayOpacity.value = 0
  ghostStyle.value = {
    ...ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
  }

  await wait(closeDurationMs)

  ghostVisible.value = false
  lightboxMounted.value = false
  hiddenThumbIndex.value = null
  slideDragOffset.value = 0
  closeDragY.value = 0
  animating.value = false
}

function next() {
  if (controlsDisabled.value) return
  void commitSlideChange(1)
}

function prev() {
  if (controlsDisabled.value) return
  void commitSlideChange(-1)
}

async function handleSlideGesture(deltaX: number, velocityX: number) {
  const direction = resolveSlideTarget(deltaX, velocityX)

  if (!direction) {
    animating.value = true
    await animateSlideTo(0, 200)
    animating.value = false
    return
  }

  await commitSlideChange(direction)
}

async function handleCloseGesture(deltaY: number, velocityY: number) {
  const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)

  if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
    await close()
    return
  }

  animating.value = true
  await animateCloseDragTo(0)
  animating.value = false
}

function handleBackdropClick() {
  if (animating.value) return
  void close()
}

function onMediaPointerDown(event: PointerEvent) {
  if (!lightboxMounted.value || animating.value || ghostVisible.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  cancelTapTimer()

  pointerSession = {
    id: event.pointerId,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    velocityX: 0,
    velocityY: 0,
    moved: false,
    startPan: { ...panState.value },
  }

  gesturePhase.value = 'idle'
  mediaAreaRef.value?.setPointerCapture(event.pointerId)
}

function onMediaPointerMove(event: PointerEvent) {
  if (!pointerSession || event.pointerId !== pointerSession.id || animating.value) return

  const deltaX = event.clientX - pointerSession.startX
  const deltaY = event.clientY - pointerSession.startY
  const elapsed = Math.max(1, event.timeStamp - pointerSession.lastTime)

  pointerSession.velocityX = (event.clientX - pointerSession.lastX) / elapsed
  pointerSession.velocityY = (event.clientY - pointerSession.lastY) / elapsed
  pointerSession.lastX = event.clientX
  pointerSession.lastY = event.clientY
  pointerSession.lastTime = event.timeStamp
  pointerSession.moved = pointerSession.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

  if (gesturePhase.value === 'idle') {
    const mode = classifyGesture(deltaX, deltaY, pointerSession.pointerType)
    if (mode !== 'idle') {
      gesturePhase.value = mode
    }
  }

  if (gesturePhase.value === 'slide') {
    slideDragOffset.value = deltaX
    return
  }

  if (gesturePhase.value === 'close') {
    closeDragY.value = deltaY
    return
  }

  if (gesturePhase.value === 'pan') {
    const targetPan = {
      x: pointerSession.startPan.x + deltaX,
      y: pointerSession.startPan.y + deltaY,
    }

    panState.value = clampPanWithResistance(targetPan)
  }
}

async function onMediaPointerUp(event: PointerEvent) {
  if (!pointerSession || event.pointerId !== pointerSession.id) return

  try {
    mediaAreaRef.value?.releasePointerCapture(event.pointerId)
  } catch {
    // ignored
  }

  const session = pointerSession
  const deltaX = event.clientX - session.startX
  const deltaY = event.clientY - session.startY
  const velocityX = session.velocityX
  const velocityY = session.velocityY
  const mode = gesturePhase.value

  resetGestureState()

  if (!session.moved || mode === 'idle') {
    handleTap(event.clientX, event.clientY)
    return
  }

  if (mode === 'slide') {
    await handleSlideGesture(deltaX, velocityX)
    return
  }

  if (mode === 'close') {
    await handleCloseGesture(deltaY, velocityY)
    return
  }

  if (mode === 'pan') {
    panState.value = clampPan(panState.value)
  }
}

function onMediaPointerCancel(event: PointerEvent) {
  if (!pointerSession || event.pointerId !== pointerSession.id) return

  resetGestureState()
  panState.value = clampPan(panState.value)
  closeDragY.value = 0
  slideDragOffset.value = 0
}

function onWheel(event: WheelEvent) {
  if (!lightboxMounted.value || animating.value) return

  const hasModifier = event.ctrlKey || event.metaKey || event.altKey

  if (hasModifier && zoomAllowed.value) {
    event.preventDefault()

    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88
    const targetZoom = Math.min(
      zoomState.value.max,
      Math.max(zoomState.value.fit, zoomState.value.current * zoomFactor),
    )
    const targetPan = getTargetPanForZoom(targetZoom, {
      x: event.clientX,
      y: event.clientY,
    })

    void animatePanZoom(targetZoom, targetPan, 120)
    return
  }

  if (isZoomedIn.value) {
    event.preventDefault()
    panState.value = clampPan({
      x: panState.value.x - event.deltaX,
      y: panState.value.y - event.deltaY,
    })
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!lightboxMounted.value || animating.value) return

  if (event.key === 'Escape') {
    void close()
    return
  }

  if (event.key === 'z' || event.key === 'Z') {
    void toggleZoom()
    return
  }

  if (event.key === 'ArrowRight') {
    if (isZoomedIn.value) {
      panState.value = clampPan({ x: panState.value.x - 80, y: panState.value.y })
    } else {
      void commitSlideChange(1)
    }
  }

  if (event.key === 'ArrowLeft') {
    if (isZoomedIn.value) {
      panState.value = clampPan({ x: panState.value.x + 80, y: panState.value.y })
    } else {
      void commitSlideChange(-1)
    }
  }
}

function onResize() {
  if (!lightboxMounted.value) return

  syncGeometry()
  refreshZoomState(false)
}

watch(lightboxMounted, (mounted) => {
  lockBodyScroll(mounted)
})

watch(activeIndex, async () => {
  if (!lightboxMounted.value) return

  await nextTick()
  await nextFrame()
  syncGeometry()
  refreshZoomState(true)
  void ensureImageLoaded(currentPhoto.value.full)
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', onResize)

    for (const photo of photos) {
      void ensureImageLoaded(photo.full)
    }
  }
})

onBeforeUnmount(() => {
  cancelTapTimer()

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
  }

  if (typeof document !== 'undefined') {
    lockBodyScroll(false)
  }
})
</script>

<style scoped>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top, rgba(90, 110, 255, 0.18), transparent 34%),
    linear-gradient(180deg, #0b1020 0%, #090d19 100%);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.demo-shell {
  min-height: 100vh;
  padding: 48px 24px 72px;
  color: #f5f7fb;
}

.hero {
  max-width: 840px;
  margin: 0 auto 32px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(215, 223, 255, 0.72);
}

.hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 64px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.lede {
  max-width: 700px;
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 1.5;
  color: rgba(236, 240, 255, 0.8);
}

.gallery {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.thumb {
  position: relative;
  grid-column: span 4;
  overflow: hidden;
  border: 0;
  padding: 0;
  cursor: zoom-in;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 20px 50px rgba(0, 0, 0, 0.22);
  transform: translateY(0);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.thumb:hover {
  transform: translateY(-3px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 26px 56px rgba(0, 0, 0, 0.28);
}

.thumb-hidden {
  visibility: hidden;
}

.thumb-image,
.ghost-image,
.lightbox-image {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
}

.thumb-image {
  object-fit: cover;
}

.thumb-gradient {
  position: absolute;
  inset: auto 0 0;
  height: 50%;
  background: linear-gradient(to top, rgba(5, 8, 16, 0.82), transparent);
}

.thumb-meta {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: grid;
  gap: 2px;
  text-align: left;
  color: white;
}

.thumb-meta strong {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.thumb-meta span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.lightbox-root {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.lightbox-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(75, 98, 255, 0.16), transparent 30%),
    rgba(5, 7, 12, 0.84);
  backdrop-filter: blur(16px) saturate(1.08);
  transition: opacity 260ms ease;
}

.lightbox-ui {
  position: absolute;
  inset: 0;
  transform-origin: center 28%;
}

.topbar {
  position: absolute;
  top: 18px;
  left: 20px;
  right: 20px;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 160ms ease;
}

.counter {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);
}

.actions {
  display: flex;
  gap: 10px;
}

.ui-btn {
  height: 42px;
  min-width: 42px;
  border: 0;
  border-radius: 999px;
  padding: 0 14px;
  cursor: pointer;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 16px 40px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(8px);
  transition:
    transform 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
}

.ui-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.16);
}

.ui-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.close-btn {
  min-width: 48px;
}

.stage {
  position: absolute;
  inset: 64px 28px 24px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 18px;
  justify-items: center;
}

.media-area {
  position: relative;
  width: min(1240px, calc(100vw - 72px));
  height: min(78vh, calc(100vh - 150px));
  touch-action: none;
  overflow: hidden;
}

.media-area::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
    radial-gradient(circle at top, rgba(63, 74, 168, 0.22), transparent 55%);
  border-radius: 28px;
}

.media-area--zoomed {
  cursor: grab;
}

.media-area--dragging.media-area--zoomed {
  cursor: grabbing;
}

.media-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.media-track {
  display: flex;
  position: relative;
  will-change: transform, opacity;
}

.slide-cell {
  flex: none;
  display: grid;
  place-items: center;
}

.slide-frame {
  position: relative;
  overflow: visible;
}

.slide-zoom {
  width: 100%;
  height: 100%;
  will-change: transform;
  transform-origin: center center;
}

.lightbox-image {
  object-fit: contain;
  border-radius: 24px;
  box-shadow: 0 30px 120px rgba(0, 0, 0, 0.45);
}

.zoom-hint {
  position: absolute;
  left: 18px;
  bottom: 18px;
  z-index: 10;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(10, 12, 20, 0.48);
  backdrop-filter: blur(10px);
  transition: opacity 160ms ease;
}

.caption {
  width: min(1240px, calc(100vw - 72px));
  text-align: left;
  transition: opacity 160ms ease;
}

.caption h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.caption p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.72);
}

.ghost-image {
  border-radius: 18px;
}

@media (max-width: 980px) {
  .thumb {
    grid-column: span 6;
  }
}

@media (max-width: 700px) {
  .demo-shell {
    padding-inline: 16px;
    padding-top: 28px;
  }

  .thumb {
    grid-column: span 12;
  }

  .stage {
    inset: 64px 12px 16px;
  }

  .media-area,
  .caption {
    width: min(100vw - 24px, 1240px);
  }

  .topbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .actions {
    gap: 8px;
  }

  .ui-btn {
    min-width: 40px;
    padding-inline: 12px;
  }
}
</style>
