---
seo:
  title: nuxt-photo
  description: A layered photo gallery and lightbox system for Vue and Nuxt. Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
---
orientation: horizontal
---
#top
:hero-background

#title
Photo galleries for [Vue & Nuxt]{.text-primary}.

#description
Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom — all from a single component. Zero configuration to get started, full control when you need it.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/mat4m0/nuxt-photo
  target: _blank
  ---
  View on GitHub
  :::

#default
  :::prose-pre
  ---
  code: |
    export default defineNuxtConfig({
      modules: ['@nuxt-photo/nuxt'],
    })
  filename: nuxt.config.ts
  ---

  ```ts [nuxt.config.ts]
  export default defineNuxtConfig({
    modules: ['@nuxt-photo/nuxt'],
  })
  ```
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Four layout algorithms

#links
  :::u-button
  ---
  color: neutral
  size: lg
  to: /guides/layouts
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Explore layouts
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-align-justify
  ---
  #title
  Rows (Justified)

  #description
  Knuth-Plass dynamic programming fills every row to the container edge while keeping row heights close to your target. No cropping, no gaps.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-columns-3
  ---
  #title
  Columns

  #description
  Equal-width columns with a shortest-path algorithm that balances column heights. Photos stay in order, columns stay even.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layout-grid
  ---
  #title
  Masonry

  #description
  Classic Pinterest-style layout. Each photo goes into the shortest column, greedy-placing items to minimize wasted space.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layout-dashboard
  ---
  #title
  Bento Grid

  #description
  CSS Grid with automatic span heuristics. Wide photos get more columns, tall photos get more rows. Magazine-style without the manual work.
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Built for production

#links
  :::u-button
  ---
  color: neutral
  size: lg
  to: /getting-started/installation
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Installation
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Lightbox included

  #description
  FLIP transitions from thumbnail to full-screen, swipe gestures, pinch-to-zoom, keyboard navigation, and spring physics — all built in.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-monitor-smartphone
  ---
  #title
  Responsive by design

  #description
  Every numeric option accepts a container-width function. Change columns, spacing, and row height at any breakpoint — no media queries needed.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-server
  ---
  #title
  Zero CLS on SSR

  #description
  Server-renders a flex-grow fallback that matches the JS layout. When JS hydrates, there's no layout shift — the page looks identical before and after.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-image
  ---
  #title
  Nuxt Image ready

  #description
  Automatic @nuxt/image integration. Thumbnails get optimized srcsets for the grid, slides get full-viewport srcsets for the lightbox.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  Layered architecture

  #description
  Use the high-level recipe components or drop down to composables and primitives for full control. No black boxes — every layer is replaceable.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-puzzle
  ---
  #title
  Headless mode

  #description
  Skip the recipe components entirely. Build your own grid and lightbox using the composables and primitive components with your own markup and styles.
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: Get started
      to: '/getting-started'
      trailingIcon: i-lucide-arrow-right
    - label: View on GitHub
      to: 'https://github.com/mat4m0/nuxt-photo'
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: From zero to gallery in minutes.
  description: Install the module, add your photos, render a PhotoAlbum. Everything else — lightbox, gestures, zoom, SSR — works out of the box.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
