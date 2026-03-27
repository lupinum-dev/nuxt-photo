<template>
  <div class="page">
    <header class="hero">
      <p class="hero__eyebrow">@nuxt-photo/nuxt</p>
      <h1 class="hero__title">Photo galleries for Nuxt.</h1>
      <p class="hero__lede">
        Click any image. The thumbnail animates into a full lightbox with
        carousel navigation, pinch-to-zoom, pan gestures, and spring-physics transitions.
        Auto-imported with an explicit, prefixed module surface.
      </p>
    </header>

    <div class="gallery-section">
      <PhotoAlbum
        :photos="photos"
        layout="rows"
        :target-row-height="280"
        :spacing="6"
        :breakpoints="[375, 600, 900, 1200]"
      />
    </div>

    <div class="code-section">
      <h2 class="code-section__title">Usage</h2>
      <CodeExample :code="galleryCode" title="Template" />
    </div>

    <footer class="footer">
      <p class="footer__line">
        Built with <span class="footer__pkg">@nuxt-photo/core</span>,
        <span class="footer__pkg">@nuxt-photo/vue</span>,
        <span class="footer__pkg">@nuxt-photo/recipes</span>, and
        <span class="footer__pkg">@nuxt-photo/nuxt</span>.
      </p>
      <p class="footer__sub">
        Carousel powered by Embla. Images from Lorem Picsum.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { photos } from '~/composables/photos'

useHead({ title: 'Gallery — nuxt-photo' })

const galleryCode = `<!-- Layer 1: album with lightbox baked in -->
<PhotoAlbum
  :photos="photos"
  layout="rows"
  :target-row-height="280"
  :spacing="6"
  :breakpoints="[375, 600, 900, 1200]"
/>`
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
  max-width: 580px;
  margin: 24px 0 0;
  font-size: 17px;
  line-height: 1.6;
  color: rgba(237, 232, 227, 0.55);
}

.gallery-section {
  margin-bottom: 80px;
  padding-top: 48px;
  border-top: 1px solid rgba(200, 149, 108, 0.12);
}

.code-section {
  margin-bottom: 64px;
}

.code-section__title {
  margin: 0 0 16px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.footer {
  padding-top: 32px;
  border-top: 1px solid rgba(200, 149, 108, 0.1);
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
}

.footer__line {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px;
  color: rgba(237, 232, 227, 0.6);
}

.footer__pkg {
  color: #c8956c;
}

.footer__sub {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(237, 232, 227, 0.3);
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }
}
</style>
