<template>
  <div class="demo-shell">
    <header class="hero">
      <p class="eyebrow">nuxt-photo connected-motion POC</p>
      <h1>Vue can do this elegantly.</h1>
      <p class="lede">
        Click any image. The thumbnail is “picked up”, moved into the viewer, and
        returned back on close.
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
          :style="{ opacity: overlayOpacity }"
          @click="close"
        />

        <div class="lightbox-ui" @click.stop>
          <div class="topbar">
            <div class="counter">
              {{ activeIndex + 1 }} / {{ photos.length }}
            </div>

            <div class="actions">
              <button class="ui-btn" @click="prev" :disabled="animating">
                ←
              </button>
              <button class="ui-btn" @click="next" :disabled="animating">
                →
              </button>
              <button class="ui-btn close-btn" @click="close" :disabled="animating">
                ✕
              </button>
            </div>
          </div>

          <div class="stage">
            <div ref="mediaAreaRef" class="media-area">
              <div
                class="media-shell"
                :style="{ opacity: mediaOpacity }"
              >
                <img
                  :key="currentPhoto.id"
                  class="lightbox-image"
                  :src="currentPhoto.full"
                  :alt="currentPhoto.title"
                  draggable="false"
                />
              </div>
            </div>

            <div class="caption" :style="{ opacity: mediaOpacity }">
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'

type Photo = {
  id: number
  title: string
  subtitle: string
  width: number
  height: number
  thumb: string
  full: string
}

const photos: Photo[] = [
  {
    id: 1,
    title: 'Desert Light',
    subtitle: 'Smooth open / close with FLIP',
    width: 1600,
    height: 1000,
    thumb: 'https://picsum.photos/seed/nuxt-photo-1/640/400',
    full: 'https://picsum.photos/seed/nuxt-photo-1/1600/1000',
  },
  {
    id: 2,
    title: 'Ocean Glass',
    subtitle: 'Vue state, tiny transition runtime',
    width: 1200,
    height: 1500,
    thumb: 'https://picsum.photos/seed/nuxt-photo-2/480/600',
    full: 'https://picsum.photos/seed/nuxt-photo-2/1200/1500',
  },
  {
    id: 3,
    title: 'Evening Canyon',
    subtitle: 'Measured source / target rects',
    width: 1600,
    height: 1067,
    thumb: 'https://picsum.photos/seed/nuxt-photo-3/640/427',
    full: 'https://picsum.photos/seed/nuxt-photo-3/1600/1067',
  },
  {
    id: 4,
    title: 'Forest Haze',
    subtitle: 'Graceful fallback when needed',
    width: 1500,
    height: 1000,
    thumb: 'https://picsum.photos/seed/nuxt-photo-4/600/400',
    full: 'https://picsum.photos/seed/nuxt-photo-4/1500/1000',
  },
  {
    id: 5,
    title: 'Alpine Frame',
    subtitle: 'Image feels physically connected',
    width: 1400,
    height: 1750,
    thumb: 'https://picsum.photos/seed/nuxt-photo-5/480/600',
    full: 'https://picsum.photos/seed/nuxt-photo-5/1400/1750',
  },
  {
    id: 6,
    title: 'Soft Coast',
    subtitle: 'No external animation library',
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

const overlayOpacity = ref(0)
const mediaOpacity = ref(0)

const ghostVisible = ref(false)
const ghostSrc = ref('')
const ghostStyle = ref<CSSProperties>({})

const hiddenThumbIndex = ref<number | null>(null)

const currentPhoto = computed(() => photos[activeIndex.value])

function setThumbRef(index: number) {
  return (el: Element | null) => {
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

function isUsableRect(rect: DOMRect | null) {
  if (!rect) return false
  if (rect.width < 24 || rect.height < 24) return false
  if (rect.bottom < 0 || rect.right < 0) return false
  if (typeof window !== 'undefined') {
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false
  }
  return true
}

function fitRect(container: DOMRect, aspect: number) {
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

function flipTransform(from: DOMRect, to: { left: number; top: number; width: number; height: number }) {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = from.width / to.width
  const sy = from.height / to.height
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

function makeGhostBaseStyle(to: { left: number; top: number; width: number; height: number }) {
  return {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  }
}

async function open(index: number) {
  if (animating.value) return

  activeIndex.value = index
  lightboxMounted.value = true
  overlayOpacity.value = 0
  mediaOpacity.value = 0

  await nextTick()
  await nextFrame()

  const thumbEl = thumbRefs.get(index)
  const mediaAreaEl = mediaAreaRef.value
  const photo = currentPhoto.value

  const fromRect = thumbEl?.getBoundingClientRect() ?? null
  const areaRect = mediaAreaEl?.getBoundingClientRect() ?? null

  if (!isUsableRect(fromRect) || !isUsableRect(areaRect)) {
    overlayOpacity.value = 1
    mediaOpacity.value = 1
    return
  }

  animating.value = true
  hiddenThumbIndex.value = index

  const toRect = fitRect(areaRect, photo.width / photo.height)

  ghostSrc.value = photo.full
  ghostVisible.value = true
  ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    transition:
      'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1)',
    ...makeGhostBaseStyle(toRect),
    transform: flipTransform(fromRect!, toRect),
  }

  await nextFrame()

  overlayOpacity.value = 1
  ghostStyle.value = {
    ...ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  }

  await wait(420)

  mediaOpacity.value = 1
  ghostVisible.value = false
  animating.value = false
}

async function close() {
  if (!lightboxMounted.value || animating.value) return

  const photo = currentPhoto.value
  const thumbEl = thumbRefs.get(activeIndex.value)
  const mediaAreaEl = mediaAreaRef.value

  const toRect = thumbEl?.getBoundingClientRect() ?? null
  const areaRect = mediaAreaEl?.getBoundingClientRect() ?? null

  if (!isUsableRect(toRect) || !isUsableRect(areaRect)) {
    mediaOpacity.value = 0
    overlayOpacity.value = 0
    await wait(220)
    ghostVisible.value = false
    lightboxMounted.value = false
    hiddenThumbIndex.value = null
    return
  }

  animating.value = true
  hiddenThumbIndex.value = activeIndex.value

  const fromRect = fitRect(areaRect, photo.width / photo.height)

  ghostSrc.value = photo.full
  ghostVisible.value = true
  mediaOpacity.value = 0

  ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    transition:
      'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms cubic-bezier(0.22, 1, 0.36, 1)',
    ...makeGhostBaseStyle(toRect!),
    transform: flipTransform(fromRect as DOMRect, toRect!),
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  }

  await nextFrame()

  overlayOpacity.value = 0
  ghostStyle.value = {
    ...ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
  }

  await wait(380)

  ghostVisible.value = false
  lightboxMounted.value = false
  hiddenThumbIndex.value = null
  animating.value = false
}

function next() {
  if (animating.value) return
  activeIndex.value = (activeIndex.value + 1) % photos.length
}

function prev() {
  if (animating.value) return
  activeIndex.value = (activeIndex.value - 1 + photos.length) % photos.length
}

function onKeydown(event: KeyboardEvent) {
  if (!lightboxMounted.value) return

  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') prev()
}

watch(lightboxMounted, (mounted) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = mounted ? 'hidden' : ''
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)

    for (const photo of photos) {
      const img = new Image()
      img.src = photo.full
    }
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
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
  max-width: 680px;
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
  width: min(1240px, calc(100vw - 72px));
  height: min(78vh, calc(100vh - 150px));
  display: grid;
  place-items: center;
}

.media-shell {
  width: 100%;
  height: 100%;
  transition: opacity 160ms ease;
}

.lightbox-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: 0 30px 120px rgba(0, 0, 0, 0.45);
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
}
</style>