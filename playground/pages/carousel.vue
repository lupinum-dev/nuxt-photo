<template>
  <div class="page">
    <header class="header">
      <h1 class="header__title">PhotoCarousel</h1>
      <p class="header__desc">
        A swipeable inline carousel for blogs and docs. Thumbnails, arrows, counter, caption —
        all optional. Lightbox opt-in. Powered by <code>embla-carousel-vue</code>.
      </p>
    </header>

    <div class="controls">
      <label class="control">
        <input type="checkbox" v-model="showArrows" />
        Arrows
      </label>
      <label class="control">
        <input type="checkbox" v-model="showThumbnails" />
        Thumbnails
      </label>
      <label class="control">
        <input type="checkbox" v-model="showCounter" />
        Counter
      </label>
      <label class="control">
        <input type="checkbox" v-model="showDots" />
        Dots
      </label>
      <label class="control">
        <input type="checkbox" v-model="autoplay" />
        Autoplay
      </label>
      <label class="control">
        <input type="checkbox" v-model="lightbox" />
        Lightbox
      </label>
      <label class="control">
        <input type="checkbox" v-model="loop" />
        Loop
      </label>
    </div>

    <section class="demo">
      <h2 class="demo__title">Default carousel</h2>
      <PhotoCarousel
        :photos="photos"
        :show-arrows="showArrows"
        :show-thumbnails="showThumbnails"
        :show-counter="showCounter"
        :show-dots="showDots"
        :autoplay="autoplay ? { delay: 3500 } : false"
        :lightbox="lightbox"
        :options="{ loop }"
      />
    </section>

    <section class="demo">
      <h2 class="demo__title">With custom slide slot</h2>
      <PhotoCarousel :photos="photos.slice(0, 4)" :show-thumbnails="false" :show-counter="false">
        <template #slide="{ photo, selected }">
          <div class="custom-slide">
            <img :src="photo.src" :alt="photo.alt" class="custom-slide__img" />
            <div class="custom-slide__overlay" :class="{ 'custom-slide__overlay--active': selected }">
              <h3 class="custom-slide__title">{{ photo.caption }}</h3>
              <p class="custom-slide__desc">{{ photo.description }}</p>
            </div>
          </div>
        </template>
      </PhotoCarousel>
    </section>

    <section class="demo">
      <h2 class="demo__title">Multi-slide view</h2>
      <PhotoCarousel
        :photos="photos"
        :show-thumbnails="false"
        slide-size="40%"
        slide-aspect="1 / 1"
        gap="1rem"
      />
    </section>

    <div class="code-section">
      <h2 class="code-section__title">Usage</h2>
      <CodeExample :code="templateCode" title="Template" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { photos } from '~/composables/photos'

useHead({ title: 'Carousel — nuxt-photo' })

const showArrows = ref(true)
const showThumbnails = ref(true)
const showCounter = ref(true)
const showDots = ref(false)
const autoplay = ref(false)
const lightbox = ref(false)
const loop = ref(false)

const templateCode = computed(() => `<PhotoCarousel
  :photos="photos"
  :show-arrows="${showArrows.value}"
  :show-thumbnails="${showThumbnails.value}"
  :show-counter="${showCounter.value}"
  :show-dots="${showDots.value}"${autoplay.value ? '\n  :autoplay="{ delay: 3500 }"' : ''}${lightbox.value ? '\n  :lightbox="true"' : ''}${loop.value ? '\n  :options="{ loop: true }"' : ''}
/>`)
</script>

<style scoped>
.page {
  padding: 80px 48px 120px;
  max-width: 1100px;
  margin: 0 auto;
}

.header {
  margin-bottom: 48px;
}

.header__title {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #ede8e3;
}

.header__desc {
  max-width: 640px;
  margin: 16px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(237, 232, 227, 0.55);
}

.header__desc code {
  padding: 1px 6px;
  background: rgba(200, 149, 108, 0.12);
  color: #c8956c;
  border-radius: 3px;
  font-size: 13px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 16px 20px;
  margin-bottom: 32px;
  background: rgba(237, 232, 227, 0.03);
  border: 1px solid rgba(200, 149, 108, 0.12);
  border-radius: 8px;
}

.control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(237, 232, 227, 0.75);
  cursor: pointer;
}

.control input {
  accent-color: #c8956c;
}

.demo {
  margin-bottom: 64px;
  padding-top: 32px;
  border-top: 1px solid rgba(200, 149, 108, 0.1);
}

.demo__title {
  margin: 0 0 20px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: #ede8e3;
}

.custom-slide {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
}

.custom-slide__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.custom-slide__overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: 20px 24px;
  background: linear-gradient(0deg, rgba(26, 24, 22, 0.9), rgba(26, 24, 22, 0));
  opacity: 0.7;
  transition: opacity 250ms ease;
}

.custom-slide__overlay--active {
  opacity: 1;
}

.custom-slide__title {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 24px;
  font-weight: 500;
  color: #ede8e3;
}

.custom-slide__desc {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(237, 232, 227, 0.7);
}

.code-section {
  margin-top: 48px;
}

.code-section__title {
  margin: 0 0 16px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.02em;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }
}
</style>
