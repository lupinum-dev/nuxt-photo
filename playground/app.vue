<script setup lang="ts">
const routes = [
  { path: '/', label: 'Home' },
  { path: '/standalone', label: 'Images' },
  { path: '/album', label: 'Album' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/lightbox', label: 'Lightbox' },
  { path: '/fallbacks', label: 'Fallbacks' },
]
</script>

<template>
  <div class="shell">
    <nav class="nav">
      <NuxtLink
        to="/"
        class="nav-brand"
      >
        nuxt-photo
      </NuxtLink>
      <div class="nav-links">
        <NuxtLink
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-link"
        >
          {{ route.label }}
        </NuxtLink>
      </div>
    </nav>

    <main class="main">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  --bg: #f5f5f4;
  --surface: #ffffff;
  --surface-dim: #fafaf9;
  --border: #e7e5e4;
  --border-strong: #d6d3d1;
  --text: #1c1917;
  --text-secondary: #78716c;
  --accent: #0d9488;
  --accent-hover: #0f766e;
  --accent-bg: rgba(13, 148, 136, 0.08);
  --radius: 12px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

/* Shared section card */
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 24px;
}

.section + .section {
  margin-top: 24px;
}

.section-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-label {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 4px 0 0;
}

/* Controls */
.controls {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.btn {
  appearance: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 6px 12px;
  transition: background-color 0.15s, border-color 0.15s;
}

.btn:hover {
  background: var(--surface-dim);
  border-color: var(--border-strong);
}

.btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.btn--active:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* Status badge */
.status {
  background: var(--surface-dim);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  margin-top: 16px;
  padding: 8px 12px;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
  }

  .section {
    padding: 16px;
  }
}
</style>

<style scoped>
.shell {
  min-height: 100vh;
}

.nav {
  align-items: center;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 16px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  color: var(--accent);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2px;
}

.nav-link {
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 10px 12px;
  text-decoration: none;
  transition: color 0.15s, background-color 0.15s;
}

.nav-link:hover {
  background: var(--accent-bg);
  color: var(--text);
}

.nav-link.router-link-active {
  color: var(--accent);
}

.main {
  margin: 0 auto;
  max-width: 1120px;
  padding: 32px 24px 80px;
}

@media (max-width: 640px) {
  .nav {
    gap: 8px;
    padding: 0 16px;
  }

  .main {
    padding: 20px 16px 60px;
  }
}
</style>
