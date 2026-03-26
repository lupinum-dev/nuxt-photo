<template>
  <div class="page">
    <header class="hero">
      <p class="hero__eyebrow">@nuxt/image Integration</p>
      <h1 class="hero__title">First-class NuxtImage support.</h1>
      <p class="hero__lede">
        When <code>@nuxt/image</code> is installed, nuxt-photo automatically routes all images
        through its optimization pipeline. Zero config — thumbnails get responsive
        <code>srcset</code>, lightbox slides get full-viewport srcset. No adapter prop needed.
      </p>
    </header>

    <!-- Section 1: Full album (one-liner) -->
    <section class="section">
      <h2 class="section__title">Full album</h2>
      <p class="section__desc">
        <code>&lt;PhotoGallery&gt;</code> works out of the box. Every thumbnail and lightbox
        slide is served through <code>@nuxt/image</code>'s provider.
      </p>
      <div class="gallery-wrap">
        <PhotoGallery
          :photos="photos"
          layout="rows"
          :target-row-height="260"
          :spacing="6"
        />
      </div>
      <CodeExample :code="albumCode" title="Template" />
    </section>

    <!-- Section 2: Custom grid with manual lightbox -->
    <section class="section">
      <h2 class="section__title">Custom grid + lightbox</h2>
      <p class="section__desc">
        Use <code>PhotoImage</code> with <code>context="thumb"</code> in your own layout.
        The <code>Lightbox</code> recipe handles slide images automatically.
      </p>
      <div class="custom-grid">
        <div
          v-for="(photo, index) in gridPhotos"
          :key="photo.id"
          :ref="gridCtx.setThumbRef(index)"
          class="custom-grid__item"
          :style="{ opacity: gridCtx.hiddenThumbIndex.value === index ? 0 : 1 }"
          role="button"
          tabindex="0"
          @click="gridCtx.open(index)"
          @keydown.enter="gridCtx.open(index)"
        >
          <PhotoImage
            :photo="photo"
            context="thumb"
            class="custom-grid__img"
          />
        </div>
      </div>
      <Lightbox :ctx="gridCtx" />
      <CodeExample :code="gridCode" title="Template" />
    </section>

    <!-- Section 3: Single photo -->
    <section class="section">
      <h2 class="section__title">Single photo</h2>
      <p class="section__desc">
        Use <code>PhotoImage</code> as a thumbnail that opens a lightbox. The same
        component handles thumbnail optimization and lightbox display.
      </p>
      <div class="single-wrap">
        <div
          :ref="singleCtx.setThumbRef(0)"
          class="single-trigger"
          :style="{ opacity: singleCtx.hiddenThumbIndex.value === 0 ? 0 : 1 }"
          role="button"
          tabindex="0"
          @click="singleCtx.open(0)"
          @keydown.enter="singleCtx.open(0)"
        >
          <PhotoImage
            :photo="hero"
            context="thumb"
            class="single-img"
          />
          <div class="single-hint">Click to open</div>
        </div>
      </div>
      <Lightbox :ctx="singleCtx" />
      <CodeExample :code="singleCode" title="Template" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { photos } from '~/composables/photos'

const hero = photos[0]
const gridPhotos = photos.slice(0, 6)

const singleCtx = useLightbox([hero])
const gridCtx = useLightbox(gridPhotos)

const albumCode = `<PhotoGallery
  :photos="photos"
  layout="rows"
  :target-row-height="260"
  :spacing="6"
/>`

const gridCode = `<div class="grid">
  <div
    v-for="(photo, index) in photos"
    :key="photo.id"
    :ref="ctx.setThumbRef(index)"
    @click="ctx.open(index)"
  >
    <PhotoImage :photo="photo" context="thumb" />
  </div>
</div>

<Lightbox :ctx="ctx" />

<script setup>
const ctx = useLightbox(photos)
<\/script>`

const singleCode = `<div :ref="ctx.setThumbRef(0)" @click="ctx.open(0)">
  <PhotoImage :photo="photo" context="thumb" />
</div>

<Lightbox :ctx="ctx" />

<script setup>
const ctx = useLightbox([photo])
<\/script>`
</script>

<style scoped>
.page {
  padding: 80px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  margin-bottom: 80px;
}

.hero__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.hero__title {
  margin: 0;
  font-size: clamp(34px, 5vw, 64px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.hero__lede {
  max-width: 600px;
  margin: 20px 0 0;
  font-size: 18px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
}

.hero__lede code {
  font-family: monospace;
  font-size: 0.88em;
  color: rgba(255, 255, 255, 0.85);
}

.section {
  margin-bottom: 96px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: -0.025em;
}

.section__desc {
  margin: 0 0 32px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
  max-width: 560px;
}

.section__desc code {
  font-family: monospace;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
}

.gallery-wrap {
  margin-bottom: 32px;
}

/* Custom grid */
.custom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 32px;
}

.custom-grid__item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}

.custom-grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.custom-grid__item:hover .custom-grid__img {
  transform: scale(1.03);
}

/* Single photo */
.single-wrap {
  margin-bottom: 32px;
  max-width: 480px;
}

.single-trigger {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
}

.single-img {
  width: 100%;
  height: auto;
  display: block;
}

.single-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  pointer-events: none;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }

  .custom-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
