<template>
  <!-- The glow layers stack inside this element only, under anything the backdrop draws. -->
  <div ref="root" data-np-ambient aria-hidden="true" style="isolation: isolate" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import type { ResolvedPhotoItem as PhotoItem } from '../core/index'
import { resolvePhotoImage, type ResolvedPhotoImage } from '../providers/resolve'
import { useLightboxInject } from '../lightbox/inject'

const props = withDefaults(
  defineProps<{
    /**
     * Length in milliseconds of the crossfade when the photo changes without motion: set from
     * outside, or a jump with no settle. A swipe, a key and the fade modes take their own timing.
     * @default 480
     */
    duration?: number
  }>(),
  { duration: 480 },
)

/**
 * One photo's glow: an opaque canvas covering the element, which carries the opacity. Fading
 * an opaque layer over another is a true crossfade: the glow never dips or doubles.
 */
type Glow = {
  id: string
  canvas: HTMLCanvasElement
  painted: boolean
  ready: Promise<unknown>
  /** The opacity and stacking last written, so a pointer move writes only what changed. */
  opacity: number
  z: number
}

const LAYER_STYLE = {
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
} as const

/** The glow is painted this many pixels wide; the browser stretches it smoothly. */
const GLOW_WIDTH = 32
const SATURATION = 1.35

const ctx = useLightboxInject('LightboxAmbient')
const root = shallowRef<HTMLElement>()
/** The glows of the mounted photos, by photo id. */
const glows = new Map<string, Glow>()
/** The glow underneath, at full opacity, and the one crossing over it. */
let base: Glow | null = null
let top: Glow | null = null
/** The running crossfade: a settle's, a fade mode's or a timed one. */
let crossfade: Animation | null = null
/** The photo the glow rests on once the running motion ends. */
let target: string | null = null

function isCrossOrigin(src: string) {
  try {
    const url = new URL(src, location.href)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== location.origin
  } catch {
    return false
  }
}

async function decodeThumb(source: ResolvedPhotoImage, cors: boolean) {
  const image = new Image()
  // Must be set before `src`: it decides how the browser requests the image.
  if (cors) image.crossOrigin = 'anonymous'
  // Let the browser pick the smallest candidate; the glow needs almost no detail.
  if (source.srcset) {
    image.sizes = `${GLOW_WIDTH * 2}px`
    image.srcset = source.srcset
  }
  image.src = source.src
  await image.decode()
  return image
}

async function loadThumb(photo: PhotoItem) {
  const source = resolvePhotoImage(photo, 'thumb', ctx.photoConfig.value)
  // The canvas can read, and so blur, a cross-origin image only when it was
  // requested with CORS. A server without CORS headers fails that request; the
  // plain request then still gives a glow, softened only by the stretching.
  // The browser may pick any `srcset` candidate. Splitting on whitespace and
  // commas finds every origin: descriptors like `800w` and the pieces of a URL
  // that contains commas resolve as same-origin paths.
  const urls = [source.src, ...(source.srcset?.split(/[\s,]+/) ?? [])]
  if (urls.some(isCrossOrigin)) {
    try {
      return await decodeThumb(source, true)
    } catch {
      // Fall through to the plain request.
    }
  }
  return decodeThumb(source, false)
}

/** Average neighbours three times (close to a Gaussian blur) and lift the saturation. */
function soften(data: ImageData) {
  const { width, height } = data
  const pixels = data.data
  const copy = new Uint8ClampedArray(pixels.length)
  // Three rounds of a horizontal and a vertical average, in turn.
  for (let pass = 0; pass < 6; pass++) {
    const dx = 1 - (pass % 2)
    const dy = pass % 2
    copy.set(pixels)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const before = (Math.max(0, y - dy) * width + Math.max(0, x - dx)) * 4
        const after = (Math.min(height - 1, y + dy) * width + Math.min(width - 1, x + dx)) * 4
        const at = (y * width + x) * 4
        for (let channel = 0; channel < 3; channel++) {
          pixels[at + channel] =
            (copy[before + channel]! + copy[at + channel]! + copy[after + channel]!) / 3
        }
      }
    }
  }
  for (let at = 0; at < pixels.length; at += 4) {
    const gray = 0.2126 * pixels[at]! + 0.7152 * pixels[at + 1]! + 0.0722 * pixels[at + 2]!
    for (let channel = 0; channel < 3; channel++) {
      pixels[at + channel] = gray + (pixels[at + channel]! - gray) * SATURATION
    }
  }
}

/**
 * Paint a softened glow of `image`. `strict` throws when the image cannot be read back, and
 * leaves the canvas blank; otherwise an unreadable image stays only stretched.
 */
function paint(canvas: HTMLCanvasElement, image: HTMLImageElement, strict = false) {
  const ratio = image.naturalHeight / image.naturalWidth || 1
  canvas.width = GLOW_WIDTH
  canvas.height = Math.max(1, Math.round(GLOW_WIDTH * ratio))
  const context = canvas.getContext('2d')
  if (!context) return
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  try {
    const data = context.getImageData(0, 0, canvas.width, canvas.height)
    soften(data)
    context.putImageData(data, 0, 0)
  } catch (error) {
    // A cross-origin image loaded without CORS cannot be read back. Stretching the
    // small drawing still softens it, only a little less.
    if (!strict) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    throw error
  }
}

/** The image the page already shows for this photo, when it is loaded. */
function pageImage(photo: PhotoItem) {
  const element = ctx.thumbnailFor(photo.id)
  const image = element instanceof HTMLImageElement ? element : element?.querySelector('img')
  return image?.complete && image.naturalWidth > 0 ? image : null
}

/** Paint the page's own image when it can be read back; true when it was. */
function paintFromPage(canvas: HTMLCanvasElement, photo: PhotoItem) {
  const image = pageImage(photo)
  if (!image) return false
  try {
    paint(canvas, image, true)
    return true
  } catch {
    // A cross-origin image without CORS: the loaded thumbnail below may still be readable.
    return false
  }
}

function setOpacity(glow: Glow, opacity: number) {
  if (glow.opacity !== opacity) glow.canvas.style.opacity = String((glow.opacity = opacity))
}

function glowAt(index: number) {
  const photo = ctx.photos.value[index]
  return photo ? glowFor(photo) : null
}

function glowFor(photo: PhotoItem): Glow | null {
  let glow = glows.get(photo.id)
  if (glow || !root.value) return glow ?? null
  const canvas = document.createElement('canvas')
  // Above the base from the start: a swipe then writes only the opacity of the glow it brings.
  Object.assign(canvas.style, LAYER_STYLE, { opacity: '0', zIndex: '1' })
  canvas.setAttribute('data-np-glow', String(ctx.photos.value.indexOf(photo)))
  glow = { id: photo.id, canvas, painted: false, ready: Promise.resolve(), opacity: 0, z: 1 }
  const made = glow
  glows.set(photo.id, glow)
  root.value.append(canvas)
  if (paintFromPage(canvas, photo)) glow.painted = true
  else
    glow.ready = loadThumb(photo).then(
      (image) => {
        paint(canvas, image)
        made.painted = true
      },
      () => {},
    )
  return glow
}

function stopCrossfade() {
  const running = crossfade
  crossfade = null
  running?.cancel()
}

/** Show `from` at full opacity with `to` over it; every other glow hides above it. */
function layer(from: Glow | null, to: Glow | null) {
  base = from
  top = to === from ? null : to
  for (const glow of glows.values()) {
    if (glow.z !== (glow === base ? 0 : 1))
      glow.canvas.style.zIndex = String((glow.z = glow === base ? 0 : 1))
    if (glow !== top) setOpacity(glow, glow === base ? 1 : 0)
  }
}

/**
 * Cross over from `from` to `to`: `to` lies above with these opacity keyframes, and the glow
 * rests on `to` afterwards when it ends shown, else on `from`. Returns the animation, paused
 * when `held`.
 */
function cross(
  from: Glow | null,
  to: Glow | null,
  keyframes: Keyframe[],
  timing: KeyframeAnimationOptions,
  held: boolean,
) {
  stopCrossfade()
  layer(from, to)
  const last = Number(keyframes.at(-1)!.opacity)
  const end = last > 0.5 ? to : from
  target = end?.id ?? null
  const over = top
  if (!over || typeof over.canvas.animate !== 'function') {
    layer(end, null)
    return null
  }
  // The end value stays once the animation is done; until then the animation rules.
  setOpacity(over, last)
  const animation = over.canvas.animate(keyframes, { ...timing, fill: 'backwards' })
  if (held) animation.pause()
  crossfade = animation
  void animation.finished.then(
    () => crossfade === animation && cross(end, null, [{ opacity: 0 }], {}, false),
    () => {},
  )
  return animation
}

/** A change with no motion: a linear crossfade of `duration`, started in the next frame. */
function fadeIn(glow: Glow) {
  const animation = cross(
    base,
    glow,
    [{ opacity: 0 }, { opacity: 1 }],
    {
      duration: props.duration,
      easing: 'linear',
    },
    true,
  )
  // The next frame gives it its time, so the first frame drawn shows the start in every
  // engine. (The lightbox's own helper for this lives in the viewer chunk.)
  requestAnimationFrame((now) => {
    if (animation?.playState === 'paused') animation.startTime = now
  })
}

function onActivePhoto(photo: PhotoItem | null) {
  if (!photo || !root.value) return
  // Paint the neighbours ahead of a swipe; forget glows no longer near.
  const photos = ctx.photos.value
  const index = photos.indexOf(photo)
  const near = [-1, 0, 1].map((offset) => photos.at((index + offset) % photos.length))
  for (const [id, glow] of glows)
    if (!near.some((item) => item?.id === id) && glow !== base && glow !== top) {
      glows.delete(id)
      glow.canvas.remove()
    }
  for (const item of near) if (item) glowFor(item)
  // The motion that brought this photo already crosses over to it.
  if (target === photo.id) return
  const glow = glowFor(photo)!
  target = glow.id
  // Opening, the backdrop is still hidden and brings the glow in with it.
  if (ctx.lifecycleStatus.value !== 'open' || ctx.reducedMotion.value)
    cross(glow, null, [{ opacity: 0 }], {}, false)
  else void glow.ready.then(() => target === glow.id && glow.painted && fadeIn(glow))
}

let disconnect: (() => void) | null = null
onMounted(() => {
  disconnect = ctx.glow.connect({
    show(from, to, share) {
      stopCrossfade()
      layer(glowAt(from), to === null ? null : glowAt(to))
      if (top) setOpacity(top, share)
      target = base?.id ?? null
    },
    settle: (from, to, shares, duration) =>
      cross(
        glowAt(from),
        glowAt(to),
        shares.map((opacity) => ({ opacity })),
        { duration, easing: 'linear' },
        true,
      ),
    fade(to, timing) {
      cross(base, glowAt(to), [{ opacity: 0 }, { opacity: 1 }], timing, false)
    },
    ready: () =>
      (ctx.activePhoto.value && glowFor(ctx.activePhoto.value)?.ready) ?? Promise.resolve(),
  })
  watch(() => ctx.activePhoto.value, onActivePhoto, { immediate: true, flush: 'post' })
})

onBeforeUnmount(() => {
  disconnect?.()
  stopCrossfade()
})
</script>
