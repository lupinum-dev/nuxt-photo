<template>
  <div class="page">
    <header class="hero">
      <p class="hero__eyebrow">@nuxt-photo/nuxt</p>
      <h1 class="hero__title">Photo galleries for Nuxt.</h1>
      <p class="hero__lede">
        Click any image. The thumbnail animates into a full lightbox with
        carousel navigation, pinch-to-zoom, pan gestures, and spring-physics transitions.
        All auto-imported, zero config.
      </p>
    </header>

    <div class="gallery-section">
      <PhotoGallery
        :photos="photos"
        layout="rows"
        :target-row-height="280"
        :spacing="6"
      />
    </div>

    <footer class="footer">
      <p>
        Built with <strong>@nuxt-photo/core</strong>, <strong>@nuxt-photo/vue</strong>,
        <strong>@nuxt-photo/recipes</strong>, and <strong>@nuxt-photo/nuxt</strong>.
      </p>
      <p class="footer__sub">
        Carousel powered by Embla. Images from Lorem Picsum.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { photos } from '~/composables/photos'
</script>

<style scoped>
.page {
  padding: 80px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  margin-bottom: 64px;
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
  max-width: 580px;
  margin: 20px 0 0;
  font-size: 18px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
}

.gallery-section {
  margin-bottom: 80px;
}

.footer {
  text-align: left;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  line-height: 1.6;
}

.footer strong {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
}

.footer__sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.32);
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }
}
</style>
