---
title: nuxt-photo
description: A layered photo gallery and lightbox system for Vue and Nuxt.
navigation: true
---

# nuxt-photo

A layered photo gallery and lightbox system for Vue and Nuxt. Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom — all with zero configuration.

## Features

- **Three layout algorithms** — rows, columns, and masonry
- **Integrated lightbox** — FLIP transitions, swipe gestures, pinch-to-zoom
- **Responsive** — container-width-aware spacing, columns, and row heights
- **SSR-ready** — zero CLS with server-rendered flex-grow fallbacks
- **Layered architecture** — use the high-level recipes or build your own with primitives
- **Nuxt Image support** — automatic `@nuxt/image` integration for optimized thumbnails and slides
- **Measured bundle impact** — `pnpm size` tracks tree-shaking and client bundle delta across core, Vue, and Nuxt

## Quick Example

```vue
<script setup>
const photos = [
  { id: 1, src: '/photos/landscape.jpg', width: 1600, height: 900 },
  { id: 2, src: '/photos/portrait.jpg', width: 900, height: 1200 },
  { id: 3, src: '/photos/square.jpg', width: 1000, height: 1000 },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

That's it. The album renders a justified rows layout, and clicking any photo opens a lightbox with keyboard navigation, swipe gestures, and zoom.

## Architecture

nuxt-photo is built as four packages, each adding a layer:

| Package               | Layer | Description                                                                 |
| --------------------- | ----- | --------------------------------------------------------------------------- |
| `@nuxt-photo/core`    | 0     | Framework-free layout algorithms, physics, geometry, and state machine      |
| `@nuxt-photo/vue`     | 1     | Vue composables and primitive components                                    |
| `@nuxt-photo/recipes` | 2     | Ready-to-use Photo, PhotoAlbum, PhotoGroup components                       |
| `@nuxt-photo/nuxt`    | 3     | Nuxt module with auto-imports, CSS injection, and `@nuxt/image` integration |

Most users only need `@nuxt-photo/nuxt`. The lower layers are there when you need full control.

## Bundle Size

Nuxt Photo measures consumer bundle impact in CI instead of advertising a single package-size number.

- `@nuxt-photo/core` shakes down well for targeted imports. A named import like `responsive` is currently about `283 B` brotli.
- `@nuxt-photo/vue` stays small for focused primitives. `PhotoImage` is currently about `718 B` brotli.
- The lightbox engine is not a tiny helper. `useLightbox` currently measures about `17.8 kB` brotli, which reflects the actual gesture and transition machinery it pulls in.
- `@nuxt-photo/nuxt` adds almost no client overhead until you use a component. Enabling the module alone is effectively flat in the current fixture, and one `PhotoImage` usage is currently about `+292 B` brotli over baseline.
- `PhotoCarousel` uses full Embla. We do not present it as a micro-footprint feature; its size should be evaluated as a carousel feature, not as a primitive image helper.

All numbers come from the in-repo size harness and are re-measured with `pnpm size`.

## Next Steps

::card-grid
#default
::card{to="/docs/getting-started/installation"}
#title
Installation
#description
Install the package and configure the Nuxt module.
::

::card{to="/docs/getting-started/quick-start"}
#title
Quick Start
#description
Get a working gallery with lightbox in 5 minutes.
::

::card{to="/docs/guides/layouts"}
#title
Layouts
#description
Learn about rows, columns, and masonry layouts.
::

::card{to="/docs/components/photo-album"}
#title
PhotoAlbum API
#description
Full props, slots, and usage reference.
::

::card{to="/docs/reference/bundle-size"}
#title
Bundle Size
#description
See how tree-shaking and client bundle impact are measured.
::
::
