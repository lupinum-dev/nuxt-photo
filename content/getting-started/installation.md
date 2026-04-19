---
title: Installation
description: Install nuxt-photo and configure the Nuxt module.
navigation: true
---

# Installation

## Nuxt (recommended)

Install the Nuxt module — it includes all packages and handles auto-imports, component registration, and CSS injection.

::code-group

```bash [pnpm]
pnpm add @nuxt-photo/nuxt
```

```bash [npm]
npm install @nuxt-photo/nuxt
```

```bash [yarn]
yarn add @nuxt-photo/nuxt
```

::

Add it to your `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

That's all you need. Components like `PhotoAlbum`, `PhotoGroup`, and `Photo` are auto-imported, along with composables like `useLightbox` and `responsive`.

## Requirements

- **Vue** >= 3.5.0
- **Nuxt** 4.x (when using the Nuxt module)

## Module Options

You can configure the module via the `nuxtPhoto` key in your Nuxt config:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    // Auto-import composables (useLightbox, useLightboxProvider, responsive)
    autoImports: true, // default

    // Register components globally. Set false to disable, or provide a prefix.
    components: { prefix: '' }, // default

    // CSS injection: 'none' | 'structure' | 'all'
    // 'structure' = layout-only CSS (you style the theme)
    // 'all' = structure + default theme (lightbox backdrop, buttons, captions)
    css: 'structure', // default

    // Image adapter configuration
    // Set to false to disable image adapter entirely
    image: {
      // 'auto' detects @nuxt/image if installed
      // 'nuxt-image' requires @nuxt/image in modules
      // 'native' uses plain <img> tags
      // 'custom' uses your own adapter via provide/inject
      provider: 'auto', // default
    },

    // Global lightbox defaults
    lightbox: {
      minZoom: 1, // minimum zoom level (1 = no zoom below fit)
    },
  },
})
```

## CSS Options

The `css` option controls which styles are injected:

| Value         | What's included                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `'none'`      | No CSS injected. Bring your own styles entirely.                                                                                |
| `'structure'` | Layout and positioning only — album grid, lightbox fixed positioning, controls layout. No colors, backgrounds, or visual theme. |
| `'all'`       | Structure + default theme — backdrop blur, button styles, caption typography, image border-radius.                              |

Use `'structure'` when you want full control over the visual appearance (e.g., with Tailwind). Use `'all'` for the default look out of the box.

::callout{type="warning"}
When using `'none'`, you must provide **all** CSS yourself — including structural styles for the album grid layout, lightbox fixed positioning, viewport sizing, and button placement. Transition animations are not affected since they are driven by inline styles, but the lightbox will not render correctly without the structural CSS.
::

## Packages

If you're not using Nuxt, or you need only part of the system:

| Package               | Use case                                                                             |
| --------------------- | ------------------------------------------------------------------------------------ |
| `@nuxt-photo/core`    | Framework-free layout algorithms, physics, types. No Vue dependency.                 |
| `@nuxt-photo/vue`     | Vue composables and primitive lightbox components.                                   |
| `@nuxt-photo/recipes` | Ready-to-use components (Photo, PhotoAlbum, PhotoGroup). Requires `@nuxt-photo/vue`. |
| `@nuxt-photo/nuxt`    | Full Nuxt integration. Includes everything above.                                    |

Each package includes its dependencies — installing `@nuxt-photo/recipes` automatically includes `@nuxt-photo/vue` and `@nuxt-photo/core`.

For plain Vue (without Nuxt):

```bash
pnpm add @nuxt-photo/recipes
```

Then import components and styles manually:

```ts
import { PhotoAlbum, PhotoGroup, Photo } from '@nuxt-photo/recipes'
import '@nuxt-photo/recipes/styles/lightbox-structure.css'
import '@nuxt-photo/recipes/styles/album.css'
import '@nuxt-photo/recipes/styles/photo-structure.css'
// Optional: default theme
import '@nuxt-photo/recipes/styles/lightbox-theme.css'
import '@nuxt-photo/recipes/styles/photo.css'
```
