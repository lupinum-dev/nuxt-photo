<script setup lang="ts">
const features = [
  {
    path: '/standalone',
    label: 'Standalone Images',
    description: 'PhotoImg with semantic triggers, caption modes, and lightbox control.',
  },
  {
    path: '/album',
    label: 'Photo Album',
    description: 'PhotoAlbum with layout switching, responsive layout props, custom slots, and controlled lightbox.',
  },
  {
    path: '/gallery',
    label: 'Gallery',
    description: 'PhotoGallery with custom thumbnail markup and event handling.',
  },
  {
    path: '/lightbox',
    label: 'Lightbox',
    description: 'PhotoLightbox with custom slide rendering and programmatic control.',
  },
  {
    path: '/fallbacks',
    label: 'Graceful Fallbacks',
    description: 'Trusted zoom vs fallback opens for missing dimensions, bad aspect data, and weak trigger visibility.',
  },
]
</script>

<template>
  <div>
    <header class="hero">
      <p class="section-label">
        Playground
      </p>
      <h1 class="hero-title">
        nuxt-photo
      </h1>
      <p class="hero-lead">
        Test every component and API surface of the module.
        Each page demonstrates a distinct feature set.
      </p>
    </header>

    <div class="grid">
      <NuxtLink
        v-for="feature in features"
        :key="feature.path"
        :to="feature.path"
        class="card"
      >
        <h2 class="card-title">
          {{ feature.label }}
        </h2>
        <p class="card-description">
          {{ feature.description }}
        </p>
        <span class="card-arrow">&rarr;</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.hero {
  padding: 8px 0 40px;
}

.hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 0;
}

.hero-lead {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  margin: 12px 0 0;
  max-width: 48ch;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: inherit;
  display: flex;
  flex-direction: column;
  padding: 20px;
  text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 6px;
}

.card-description {
  color: var(--text-secondary);
  flex: 1;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0;
}

.card-arrow {
  color: var(--accent);
  font-size: 1.125rem;
  margin-top: 12px;
}
</style>
