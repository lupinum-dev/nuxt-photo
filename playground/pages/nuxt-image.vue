<template>
  <div class="page">
    <header class="hero">
      <p class="hero__eyebrow">@nuxt/image Integration</p>
      <h1 class="hero__title">First-class NuxtImage support.</h1>
      <p class="hero__lede">
        Set <code>nuxtPhoto.image.provider = 'nuxt-image'</code> and nuxt-photo
        routes all images through Nuxt Image's optimization pipeline. Thumbnails
        get responsive <code>srcset</code>, lightbox slides get full-viewport
        <code>srcset</code>, and no adapter prop is needed.
      </p>
    </header>

    <!-- Section 1: Full album (one-liner) -->
    <section class="section">
      <h2 class="section__title">Layer 0 — Single photo</h2>
      <p class="section__desc">
        One component, one prop.
        <code>&lt;Photo :photo="hero" lightbox /&gt;</code>
        creates its own solo lightbox when clicked.
      </p>
      <div class="single-wrap">
        <Photo :photo="hero!" lightbox class="single-photo" />
      </div>
      <CodeExample :code="singleCode" title="Template" />
    </section>

    <!-- Section 2: Album -->
    <section class="section">
      <h2 class="section__title">Layer 1 — Album with lightbox</h2>
      <p class="section__desc">
        <code>&lt;PhotoAlbum&gt;</code> handles layout + lightbox. Every
        thumbnail and slide is served through the configured
        <code>@nuxt/image</code> provider.
      </p>
      <div class="gallery-wrap">
        <PhotoAlbum
          :photos="photos"
          layout="rows"
          :target-row-height="260"
          :spacing="6"
        />
      </div>
      <CodeExample :code="albumCode" title="Template" />
    </section>

    <!-- Section 3: Custom thumbnail via slot -->
    <section class="section">
      <h2 class="section__title">Layer 2 — Custom thumbnail</h2>
      <p class="section__desc">
        Override just the thumbnail via <code>#thumbnail</code> slot. Click
        handling, ref registration, and opacity during transitions are
        automatic.
      </p>
      <div class="gallery-wrap">
        <PhotoAlbum
          :photos="photos.slice(0, 6)"
          layout="columns"
          :columns="3"
          :spacing="6"
        >
          <template #thumbnail="{ photo }">
            <div
              class="custom-thumb"
              :style="{ aspectRatio: `${photo.width} / ${photo.height}` }"
            >
              <PhotoImage
                :photo="photo"
                context="thumb"
                class="custom-thumb__img"
              />
              <div class="custom-thumb__overlay">
                <span class="custom-thumb__caption">{{ photo.caption }}</span>
              </div>
            </div>
          </template>
        </PhotoAlbum>
      </div>
      <CodeExample :code="slotCode" title="Template" />
    </section>

    <!-- Section 4: Shared lightbox across two albums -->
    <section class="section">
      <h2 class="section__title">Layer 3 — Shared lightbox</h2>
      <p class="section__desc">
        Wrap two <code>PhotoAlbum</code> components in <code>PhotoGroup</code>
        to share one lightbox with navigation across both.
      </p>
      <PhotoGroup class="gallery-wrap">
        <PhotoAlbum
          :photos="photos.slice(0, 6)"
          layout="rows"
          :target-row-height="200"
          :spacing="6"
        />
        <div style="margin-top: 8px">
          <PhotoAlbum
            :photos="photos.slice(6)"
            layout="rows"
            :target-row-height="200"
            :spacing="6"
          />
        </div>
      </PhotoGroup>
      <CodeExample :code="groupCode" title="Template" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { photos } from '~/composables/photos'

useHead({ title: 'NuxtImage — nuxt-photo' })

const hero = photos[0]

const singleCode = `<!-- Layer 0: one photo, one prop -->
<Photo :photo="hero" lightbox />`

const albumCode = `<!-- Layer 1: album with lightbox baked in -->
<PhotoAlbum
  :photos="photos"
  layout="rows"
  :target-row-height="260"
  :spacing="6"
/>`

const slotCode = `<!-- Layer 2: custom thumbnail, automatic wiring -->
<PhotoAlbum :photos="photos" layout="columns" :columns="3">
  <template #thumbnail="{ photo }">
    <div class="my-thumb">
      <PhotoImage :photo="photo" context="thumb" />
      <span>{{ photo.caption }}</span>
    </div>
  </template>
</PhotoAlbum>`

const groupCode = `<!-- Layer 3: two albums, one shared lightbox -->
<PhotoGroup>
  <PhotoAlbum :photos="set1" layout="rows" />
  <PhotoAlbum :photos="set2" layout="rows" />
</PhotoGroup>`
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
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #c8956c;
}

.hero__title {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 400;
  line-height: 0.96;
  letter-spacing: -0.03em;
  color: #ede8e3;
}

.hero__lede {
  max-width: 600px;
  margin: 24px 0 0;
  font-size: 17px;
  line-height: 1.6;
  color: rgba(237, 232, 227, 0.55);
}

.hero__lede code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88em;
  color: rgba(237, 232, 227, 0.8);
}

.section {
  margin-bottom: 96px;
  padding-top: 40px;
  border-top: 1px solid rgba(200, 149, 108, 0.1);
}

.section__title {
  margin: 0 0 8px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.section__desc {
  margin: 0 0 32px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(237, 232, 227, 0.5);
  max-width: 560px;
}

.section__desc code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: rgba(237, 232, 227, 0.75);
}

.gallery-wrap {
  margin-bottom: 32px;
}

/* Single photo */
.single-wrap {
  margin-bottom: 32px;
  max-width: 480px;
}

.single-photo {
  width: 100%;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

:deep(.single-photo .np-photo__img) {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 16/9;
  object-fit: cover;
}

/* Custom thumbnail */
.custom-thumb {
  position: relative;
  width: 100%;
  border-radius: 2px;
  overflow: hidden;
}

.custom-thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 200ms ease;
}

.custom-thumb:hover .custom-thumb__img {
  transform: scale(1.03);
}

.custom-thumb__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(transparent 50%, rgba(26, 24, 22, 0.75));
  opacity: 0;
  transition: opacity 200ms ease;
}

.custom-thumb:hover .custom-thumb__overlay {
  opacity: 1;
}

.custom-thumb__caption {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }
}
</style>
