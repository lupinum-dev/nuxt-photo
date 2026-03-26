<template>
  <div class="page">
    <header class="header">
      <h1 class="header__title">PhotoGroup Patterns</h1>
      <p class="header__desc">
        <code>PhotoGroup</code> is the core primitive. Wrap anything in it — scattered photos,
        multiple albums, custom layouts — and they share one lightbox.
      </p>
    </header>

    <!-- Example 1: Scattered Photo components sharing a lightbox -->
    <section class="section">
      <h2 class="section__title">Scattered photos sharing one lightbox</h2>
      <p class="section__desc">
        Each <code>Photo</code> auto-registers with the parent <code>PhotoGroup</code>.
        No <code>:photos</code> array, no index tracking, no ctx wiring.
      </p>
      <PhotoGroup class="scattered">
        <div class="scattered__layout">
          <div class="scattered__main">
            <Photo :photo="photos[0]" class="scattered__img scattered__img--main" />
          </div>
          <div class="scattered__side">
            <Photo :photo="photos[1]" class="scattered__img" />
            <Photo :photo="photos[2]" class="scattered__img" />
          </div>
        </div>
        <div class="scattered__row">
          <Photo :photo="photos[3]" class="scattered__img" />
          <Photo :photo="photos[4]" lightbox-ignore class="scattered__img scattered__img--ignored" />
          <Photo :photo="photos[5]" class="scattered__img" />
        </div>
      </PhotoGroup>
      <p class="note">The middle photo in the bottom row has <code>lightbox-ignore</code> — it renders but is not part of the lightbox.</p>
      <CodeExample :code="scatteredCode" title="Template" />
    </section>

    <!-- Example 2: Two albums sharing one lightbox -->
    <section class="section">
      <h2 class="section__title">Two albums, one shared lightbox</h2>
      <p class="section__desc">
        Wrap multiple <code>PhotoAlbum</code> components in a <code>PhotoGroup</code> — they join
        one lightbox. Navigate across all photos from both albums seamlessly.
      </p>
      <PhotoGroup>
        <div class="two-albums">
          <div class="two-albums__col">
            <h3 class="two-albums__label">Landscapes</h3>
            <PhotoAlbum :photos="landscapes" layout="masonry" :columns="2" :spacing="6" />
          </div>
          <div class="two-albums__col">
            <h3 class="two-albums__label">Portraits</h3>
            <PhotoAlbum :photos="portraits" layout="columns" :columns="2" :spacing="6" />
          </div>
        </div>
      </PhotoGroup>
      <CodeExample :code="twoAlbumsCode" title="Template" />
    </section>

    <!-- Example 3: Programmatic open via ref -->
    <section class="section">
      <h2 class="section__title">Programmatic open</h2>
      <p class="section__desc">
        Use <code>ref</code> on <code>PhotoGroup</code> to open the lightbox from outside —
        e.g., from a button or after a route change.
      </p>
      <PhotoGroup ref="gallery">
        <PhotoAlbum :photos="photos.slice(0, 6)" layout="rows" :target-row-height="220" :spacing="6" />
      </PhotoGroup>
      <div class="btn-row">
        <button class="open-btn" @click="gallery?.open(0)">Open first photo</button>
        <button class="open-btn" @click="gallery?.open(3)">Open 4th photo</button>
        <button class="open-btn" @click="gallery?.open(photos[5])">Open by reference</button>
      </div>
      <CodeExample :code="programmaticCode" title="Template" />
    </section>

    <!-- Example 4: Fully headless — custom layout + custom lightbox -->
    <section class="section">
      <h2 class="section__title">Fully headless layout</h2>
      <p class="section__desc">
        Pass <code>:photos</code> to <code>PhotoGroup</code> and handle layout yourself.
        The slot exposes <code>open(photo)</code> and <code>setThumbRef(i)</code>.
      </p>
      <PhotoGroup :photos="photos.slice(0, 8)" v-slot="{ open, setThumbRef }">
        <div class="hex-grid">
          <div
            v-for="(photo, i) in photos.slice(0, 8)"
            :key="photo.id"
            :ref="setThumbRef(i)"
            class="hex-grid__item"
            @click="open(photo)"
          >
            <img :src="photo.thumbSrc || photo.src" :alt="photo.alt || ''" class="hex-grid__img" />
          </div>
        </div>
      </PhotoGroup>
      <CodeExample :code="headlessCode" title="Template" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { photos } from '~/composables/photos'

useHead({ title: 'PhotoGroup — nuxt-photo' })

const landscapes = photos.filter((_, i) => i % 2 === 0).slice(0, 6)
const portraits = photos.filter((_, i) => i % 2 === 1).slice(0, 6)

const gallery = ref<{ open: (photoOrIndex: any) => void } | null>(null)

const scatteredCode = `<PhotoGroup>
  <div class="layout">
    <Photo :photo="photos[0]" />
    <Photo :photo="photos[1]" />
    <Photo :photo="photos[2]" lightbox-ignore />
  </div>
</PhotoGroup>`

const twoAlbumsCode = `<!-- Two albums sharing one lightbox -->
<PhotoGroup>
  <PhotoAlbum :photos="landscapes" layout="masonry" :columns="2" />
  <PhotoAlbum :photos="portraits" layout="columns" :columns="2" />
</PhotoGroup>

<!-- Two albums each with their own lightbox — just remove the wrapper -->
<PhotoAlbum :photos="landscapes" layout="masonry" :columns="2" />
<PhotoAlbum :photos="portraits" layout="columns" :columns="2" />`

const programmaticCode = `<PhotoGroup ref="gallery">
  <PhotoAlbum :photos="photos" layout="rows" />
</PhotoGroup>
<button @click="gallery?.open(0)">Open Gallery</button>
<button @click="gallery?.open(photos[3])">Open specific photo</button>`

const headlessCode = `<PhotoGroup :photos="photos" v-slot="{ open, setThumbRef }">
  <div class="my-layout">
    <div
      v-for="(photo, i) in photos"
      :key="photo.id"
      :ref="setThumbRef(i)"
      @click="open(photo)"
    >
      <img :src="photo.thumbSrc" />
    </div>
  </div>
</PhotoGroup>`
</script>

<style scoped>
.page {
  padding: 80px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 64px;
}

.header__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 48px);
  letter-spacing: -0.03em;
}

.header__desc {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

.header__desc code {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.7);
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
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
}

.section__desc code {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.75);
}

.note {
  margin: 12px 0 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.note code {
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.65);
}

/* Scattered layout */
.scattered {
  margin-bottom: 16px;
}

.scattered__layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 6px;
  margin-bottom: 6px;
}

.scattered__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scattered__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.scattered__img {
  width: 100%;
  height: 200px;
  display: block;
  border-radius: 6px;
  overflow: hidden;
}

.scattered__main {
  position: relative;
}

.scattered__img--main {
  position: absolute;
  inset: 0;
  height: auto;
}

.scattered__img--ignored {
  opacity: 0.4;
  filter: grayscale(1);
}

/* Style the np-photo__img inside */
:deep(.np-photo__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Two albums */
.two-albums {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 24px;
}

.two-albums__label {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

/* Programmatic open */
.btn-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 24px 0;
}

.open-btn {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease;
}

.open-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

/* Hex grid */
.hex-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 24px;
}

.hex-grid__item {
  aspect-ratio: 4/3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 180ms ease;
}

.hex-grid__item:hover {
  transform: scale(1.02);
}

.hex-grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }

  .scattered__layout {
    grid-template-columns: 1fr;
  }

  .two-albums {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hex-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
