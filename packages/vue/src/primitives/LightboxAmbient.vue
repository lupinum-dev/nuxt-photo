<template>
  <div data-np-ambient aria-hidden="true" v-bind="$attrs">
    <canvas
      v-for="layer in layers"
      :key="layer.key"
      :ref="(element) => setLayerRef(layer, element)"
      :style="layer.shown ? LAYER_STYLE : HIDDEN_LAYER_STYLE"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch, type ComponentPublicInstance } from 'vue'
import type { PhotoItem } from '../core/index'
import { useLightboxInject } from '../lightbox/inject'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /**
     * Length of the crossfade between photos in milliseconds.
     * @default 480
     */
    duration?: number
  }>(),
  { duration: 480 },
)

type Layer = {
  key: number
  photo: PhotoItem
  shown: boolean
  canvas: HTMLCanvasElement | null
  animation: Animation | null
}

// Each layer is an opaque canvas covering the element; the element carries the opacity.
// Fading an opaque layer over another is a true crossfade: the glow never dips or doubles.
const LAYER_STYLE = {
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
} as const
const HIDDEN_LAYER_STYLE = { ...LAYER_STYLE, opacity: '0' } as const

/** The glow is painted this many pixels wide; the browser stretches it smoothly. */
const GLOW_WIDTH = 32
const SATURATION = 1.35

const ctx = useLightboxInject('LightboxAmbient')
const layers = shallowRef<Layer[]>([])
let nextKey = 0

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function loadThumb(photo: PhotoItem) {
  const source = ctx.imageAdapter.value(photo, 'thumb')
  const image = new Image()
  // Let the browser pick the smallest candidate; the glow needs almost no detail.
  if (source.srcset) {
    image.sizes = `${GLOW_WIDTH * 2}px`
    image.srcset = source.srcset
  }
  image.src = source.src
  await image.decode()
  return image
}

/** Average neighbours three times (close to a Gaussian blur) and lift the saturation. */
function soften(data: ImageData) {
  const { width, height } = data
  const pixels = data.data
  const copy = new Uint8ClampedArray(pixels.length)
  for (let pass = 0; pass < 3; pass++) {
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ] as const) {
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
  }
  for (let at = 0; at < pixels.length; at += 4) {
    const gray = 0.2126 * pixels[at]! + 0.7152 * pixels[at + 1]! + 0.0722 * pixels[at + 2]!
    for (let channel = 0; channel < 3; channel++) {
      pixels[at + channel] = gray + (pixels[at + channel]! - gray) * SATURATION
    }
  }
}

function paint(canvas: HTMLCanvasElement, image: HTMLImageElement) {
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
  } catch {
    // A cross-origin image served without CORS cannot be read back. Stretching the
    // small drawing still softens it, only a little less.
  }
}

async function render(layer: Layer) {
  try {
    const image = await loadThumb(layer.photo)
    if (!layer.canvas || !layers.value.includes(layer)) return
    paint(layer.canvas, image)
    show(layer)
  } catch {
    drop(layer)
  }
}

function setLayerRef(layer: Layer, element: Element | ComponentPublicInstance | null) {
  if (layer.canvas || !(element instanceof HTMLCanvasElement)) return
  layer.canvas = element
  void render(layer)
}

/** Remove every layer under `layer`; it now covers them completely. */
function settle(layer: Layer) {
  const index = layers.value.indexOf(layer)
  if (index > 0) {
    for (const below of layers.value.slice(0, index)) below.animation?.cancel()
    layers.value = layers.value.slice(index)
  }
}

function show(layer: Layer) {
  if (layer.shown || !layers.value.includes(layer)) return
  layer.shown = true
  layers.value = [...layers.value]
  const canvas = layer.canvas
  if (!canvas || typeof canvas.animate !== 'function' || reducedMotion()) {
    settle(layer)
    return
  }
  layer.animation = canvas.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: props.duration,
    easing: 'ease-out',
  })
  layer.animation.finished.then(
    () => settle(layer),
    () => {},
  )
}

function drop(layer: Layer) {
  layers.value = layers.value.filter((item) => item !== layer)
}

watch(
  () => ctx.activePhoto.value,
  (photo) => {
    const top = layers.value.at(-1)
    if (!photo || top?.photo.id === photo.id) return
    // A layer still loading was never visible; the newer photo replaces it.
    const kept = layers.value.filter((layer) => layer.shown)
    layers.value = [...kept, { key: nextKey++, photo, shown: false, canvas: null, animation: null }]
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const layer of layers.value) layer.animation?.cancel()
})
</script>
