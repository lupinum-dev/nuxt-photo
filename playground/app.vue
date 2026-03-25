<template>
  <div class="app">
    <nav class="nav">
      <NuxtLink to="/" class="nav__brand">nuxt-photo</NuxtLink>
      <div class="nav__links">
        <NuxtLink to="/" class="nav__link">Gallery</NuxtLink>
        <NuxtLink to="/layouts" class="nav__link">Layouts</NuxtLink>
        <NuxtLink to="/headless" class="nav__link">Headless</NuxtLink>
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
  background:
    radial-gradient(circle at top, rgba(90, 110, 255, 0.18), transparent 34%),
    linear-gradient(180deg, #0b1020 0%, #090d19 100%);
  background-attachment: fixed;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #f5f7fb;
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
  padding: 16px 24px;
  background: rgba(11, 16, 32, 0.72);
  backdrop-filter: blur(16px) saturate(1.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav__brand {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.03em;
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
  border-radius: 8px;
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
