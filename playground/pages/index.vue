<template>
  <div class="page">
    <header class="hero">
      <p class="hero__eyebrow">@lupinum/nuxt-photo</p>
      <h1 class="hero__title">Photo galleries for Nuxt.</h1>
      <p class="hero__lede">
        Click any image. The thumbnail animates into a full lightbox with carousel navigation,
        pinch-to-zoom, pan gestures, and spring-physics transitions. Auto-imported with an explicit,
        prefixed module surface.
      </p>
    </header>

    <fieldset class="modes">
      <legend class="modes__label">Photo change</legend>
      <label v-for="mode in modes" :key="mode" class="modes__option">
        <input v-model="navigation" type="radio" name="navigation" :value="mode" />
        <span>{{ mode }}</span>
      </label>
    </fieldset>

    <div class="gallery-section">
      <PhotoAlbum
        :photos="photos"
        :navigation="navigation"
        :layout="{ type: 'rows', targetRowHeight: 280 }"
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
        Built with <span class="footer__pkg">@lupinum/nuxt-photo</span> and its
        <span class="footer__pkg">@lupinum/nuxt-photo/app</span> facade.
      </p>
      <p class="footer__sub">Carousel powered by Embla. Images from Lorem Picsum.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { LightboxNavigationMode } from '@lupinum/nuxt-photo/app'
import { demoPhotos as photos } from 'nuxt-photo-demo'

const modes: LightboxNavigationMode[] = ['slide', 'fade', 'crossfade']
const route = useRoute()
const navigation = ref<LightboxNavigationMode>(
  modes.find((mode) => mode === route.query.navigation) ?? 'slide',
)

useHead({ title: 'Gallery — nuxt-photo' })

const galleryCode = `<!-- Layer 1: album with lightbox baked in -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'rows', targetRowHeight: 280 }"
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
  margin-bottom: 48px;
}

.modes {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 20px;
  padding: 0;
  border: 0;
}

.modes__label {
  float: left;
  margin-right: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(237, 232, 227, 0.5);
}

.modes__option {
  position: relative;
  cursor: pointer;
}

.modes__option input {
  position: absolute;
  opacity: 0;
}

.modes__option span {
  display: block;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: rgba(237, 232, 227, 0.72);
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.modes__option input:checked + span {
  background: rgba(237, 232, 227, 0.12);
  color: #ede8e3;
}

.modes__option input:focus-visible + span {
  outline: 2px solid #c8956c;
  outline-offset: 2px;
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
