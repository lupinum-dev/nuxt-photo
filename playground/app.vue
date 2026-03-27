<script setup lang="ts">
import { provide } from 'vue'
import { LightboxComponentKey } from '@nuxt-photo/vue'
import Lightbox from '~/components/Lightbox.vue'

provide(LightboxComponentKey, Lightbox)
</script>

<template>
  <div class="app">
    <nav class="nav">
      <NuxtLink to="/" class="nav__brand">nuxt-photo</NuxtLink>
      <div class="nav__links">
        <NuxtLink to="/" class="nav__link">Gallery</NuxtLink>
        <NuxtLink to="/layouts" class="nav__link">Layouts</NuxtLink>
        <NuxtLink to="/headless" class="nav__link">Headless</NuxtLink>
        <NuxtLink to="/nuxt-image" class="nav__link">NuxtImage</NuxtLink>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  margin: 0;
  background: #141414;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e5e5e5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

.app {
  min-height: 100vh;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 48px;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nav__brand {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: white;
}

.nav__links {
  display: flex;
  gap: 8px;
}

.nav__link {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  transition: color 160ms ease, background 160ms ease;
}

.nav__link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.06);
}

.nav__link.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}
</style>
