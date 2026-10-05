<script setup lang="ts">
import type { PhotoItem } from '@lupinum/nuxt-photo/app'
import { startLabTiming } from '../lab/timing'
import { useLabMeasurement } from '../lab/measurement'
import { DEFAULT_WIDTHS } from '#build/nuxt-photo-internals.mjs'

const props = defineProps<{
  title: string
  photos: readonly PhotoItem[]
  active?: string | null
  requests?: boolean
}>()
useHead({
  script: [
    { key: 'lab-timing', innerHTML: `(${startLabTiming.toString()})()`, tagPosition: 'head' },
  ],
})
const image = useImage()
// The generated .mjs bridge does not preserve the source declaration for app TypeScript.
const defaultWidths: readonly number[] = DEFAULT_WIDTHS
const provider = image.options.provider
const screens = [...new Set(Object.values(image.options.screens))].sort((a, b) => a - b)
const products = [
  ...new Set(screens.flatMap((width) => image.options.densities.map((density) => width * density))),
].sort((a, b) => a - b)
const ladder =
  provider === 'vercel'
    ? screens
    : [...defaultWidths.filter((width) => width < (products[0] ?? Infinity)), ...products]
const bar = ref<HTMLElement | null>(null)
const barHeight = ref(0)
const overlay = ref(false)
const { summary, readings, slideRequests } = useLabMeasurement(
  () => props.photos,
  provider,
  ladder,
  () => props.active,
  bar,
)
let resizeFrame = 0
let previousToggleRight: number | undefined
onBeforeUpdate(() => {
  const element = bar.value
  if (previousToggleRight === undefined && element && element.scrollLeft > 0)
    previousToggleRight = element.querySelector('button')?.getBoundingClientRect().right
})
function sizeBar() {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    const element = bar.value
    // The browser may already clamp scrollLeft when content shrinks. Correct the
    // actual position once, rather than applying the content-width delta twice.
    const right = element?.querySelector('button')?.getBoundingClientRect().right
    if (element && right !== undefined && previousToggleRight !== undefined)
      element.scrollLeft += right - previousToggleRight
    previousToggleRight = undefined
    const height = element?.offsetHeight ?? 0
    if (barHeight.value === height) return
    barHeight.value = height
    document.documentElement.style.setProperty('--lab-bar-height', `${height}px`)
  })
}
onMounted(() => {
  sizeBar()
  window.addEventListener('resize', sizeBar)
})
onUpdated(sizeBar)
onBeforeUnmount(() => {
  cancelAnimationFrame(resizeFrame)
  window.removeEventListener('resize', sizeBar)
  document.documentElement.style.removeProperty('--lab-bar-height')
})
const badgeText = (reading: (typeof readings.value)[number]) =>
  `need ${Math.round(reading.needed)}px · got ${reading.got}px · ${reading.ratio.toFixed(2)}× · ${reading.kb.toFixed(1)} KB · ${reading.format} · ${reading.loading}${reading.high ? ', high' : ''}${reading.floor ? ' · floor' : ''}`
const color = (reading: (typeof readings.value)[number]) =>
  reading.inRange ? '#16a34a' : reading.ratio <= 3 ? '#d97706' : '#dc2626'
</script>

<template>
  <main class="lab-page">
    <div ref="bar" class="lab-summary">
      <LabSummary :summary="summary" :overlay="overlay" @toggle="overlay = !overlay" />
    </div>
    <!-- A CSS-sized copy reserves the fixed bar's height before any client measurement. -->
    <div class="lab-summary-reserve" aria-hidden="true" inert>
      <LabSummary :summary="summary" :overlay="overlay" />
    </div>
    <header class="lab-header">
      <h1>{{ title }}</h1>
    </header>
    <div class="lab-content"><slot /></div>
    <ul v-if="requests">
      <li v-for="url in slideRequests" :key="url">
        <code>{{ url }}</code>
      </li>
    </ul>
    <Teleport to="body">
      <div v-if="overlay" class="lab-overlays" aria-hidden="true">
        <div
          v-for="(reading, index) in readings"
          :key="index"
          class="lab-badge-frame"
          :style="{
            left: `${Math.max(0, reading.left)}px`,
            top: `${reading.top}px`,
            width: `${reading.width}px`,
          }"
        >
          <span
            class="lab-badge"
            :title="badgeText(reading)"
            :data-url="reading.url"
            :data-srcset="reading.srcset"
            :style="{ background: color(reading) }"
            >{{ badgeText(reading) }}</span
          >
        </div>
      </div>
    </Teleport>
  </main>
</template>

<style>
/* Same page, heading and control styling as the playground Layout Explorer. */
.lab-page {
  padding: 40px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
}
.lab-header {
  margin-bottom: 48px;
}
.lab-header h1 {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 400;
  letter-spacing: -0.02em;
}
.lab-summary,
.lab-summary-reserve {
  padding: 16px 48px;
  background: #1a1816;
  font-size: 13px;
  line-height: 1.6;
  white-space: nowrap;
  overflow-x: auto;
}
.lab-summary {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 61;
}
.lab-summary-reserve {
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  visibility: hidden;
  pointer-events: none;
}
/* Keep the existing viewer tools usable below the diagnostic bar. */
.np-lightbox__topbar {
  top: calc(var(--lab-bar-height, 0px) + 16px);
}
.lab-summary button,
.lab-summary-reserve button {
  margin-top: 8px;
}
.lab-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin-bottom: 48px;
  padding: 24px;
  background: rgba(255, 248, 240, 0.02);
  border: 1px solid rgba(200, 149, 108, 0.1);
  border-radius: 6px;
}
.lab-controls label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: rgba(237, 232, 227, 0.45);
}
.lab-controls input {
  width: 100px;
}
.lab-badge-frame {
  position: fixed;
  z-index: 62;
  pointer-events: none;
}
.lab-badge {
  display: inline-block;
  z-index: 62;
  pointer-events: none;
  color: white;
  font: 11px monospace;
  padding: 2px 4px;
  max-width: calc(100% - 4px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lab-content .lab-photo {
  display: block;
  width: 100%;
}
.lab-content .lab-photo img {
  width: 100%;
}
@media (max-width: 700px) {
  .lab-page {
    padding-inline: 20px;
  }
  .lab-summary,
  .lab-summary-reserve {
    padding-inline: 20px;
    white-space: nowrap;
    overflow-x: auto;
  }
  .lab-summary > div,
  .lab-summary-reserve > div {
    display: inline-block;
  }
  .lab-summary button,
  .lab-summary-reserve button {
    margin-top: 0;
  }
  .lab-controls {
    gap: 16px;
  }
}
</style>
