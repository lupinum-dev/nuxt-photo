<script setup lang="ts">
import { provide } from 'vue'
import { LightboxComponentKey } from '@nuxt-photo/vue/extend'
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
        <NuxtLink to="/carousel" class="nav__link">Carousel</NuxtLink>
        <NuxtLink to="/headless" class="nav__link">Headless</NuxtLink>
        <NuxtLink to="/nuxt-image" class="nav__link">NuxtImage</NuxtLink>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

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
  background: #1a1816;
  font-family:
    'Source Sans 3',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: #ede8e3;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

.app {
  min-height: 100vh;
  position: relative;
}

.app::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: 0.018;
  pointer-events: none;
  z-index: 0;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 48px;
  background: #1a1816;
  border-bottom: 1px solid rgba(200, 149, 108, 0.12);
}

.nav__brand {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #ede8e3;
}

.nav__links {
  display: flex;
  gap: 0;
}

.nav__link {
  padding: 17px 16px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(237, 232, 227, 0.45);
  border-bottom: 2px solid transparent;
  transition:
    color 200ms ease,
    border-color 200ms ease;
}

.nav__link:hover {
  color: #ede8e3;
}

.nav__link.router-link-active {
  color: #c8956c;
  border-bottom-color: #c8956c;
}

@media (max-width: 700px) {
  .nav {
    padding: 0 20px;
  }

  .nav__link {
    padding: 17px 10px;
  }
}
</style>
