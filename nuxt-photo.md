<context>
<project_tree>
nuxt-photo
├─ .size-limit.cjs
├─ knip.json
├─ package.json
├─ vitest.config.ts
├─ docs/
│  └─ content/
│     ├─ index.md
│     └─ docs/
│        ├─ .navigation.yml
│        ├─ 1.getting-started/
│        │  ├─ .navigation.yml
│        │  ├─ 1.introduction.md
│        │  ├─ 2.installation.md
│        │  ├─ 3.quickstart.md
│        │  └─ 4.configuration.md
│        ├─ 2.concepts/
│        │  ├─ .navigation.yml
│        │  ├─ 1.photo-item.md
│        │  ├─ 2.layers.md
│        │  ├─ 3.image-providers.md
│        │  ├─ 4.responsive.md
│        │  └─ 5.transitions.md
│        ├─ 3.components/
│        │  ├─ .navigation.yml
│        │  ├─ 1.photo.md
│        │  ├─ 2.photo-album.md
│        │  ├─ 3.photo-group.md
│        │  ├─ 4.photo-carousel.md
│        │  ├─ 5.photo-trigger.md
│        │  ├─ 6.photo-image.md
│        │  └─ 7.lightbox-primitives.md
│        ├─ 4.composables/
│        │  ├─ .navigation.yml
│        │  ├─ 1.use-lightbox.md
│        │  ├─ 2.use-lightbox-provider.md
│        │  └─ 3.responsive.md
│        ├─ 5.guides/
│        │  ├─ .navigation.yml
│        │  ├─ 1.nuxt-image.md
│        │  ├─ 2.custom-layout.md
│        │  ├─ 3.custom-lightbox.md
│        │  ├─ 4.custom-adapter.md
│        │  ├─ 5.responsive-tuning.md
│        │  ├─ 6.ssr-and-cls.md
│        │  └─ 7.programmatic-control.md
│        └─ 6.reference/
│           ├─ .navigation.yml
│           ├─ 1.types.md
│           ├─ 2.css.md
│           ├─ 3.extension-api.md
│           └─ 4.bundle-size.md
├─ packages/
│  ├─ core/
│  │  ├─ build.config.ts
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ types.ts
│  │  │  ├─ collection/
│  │  │  │  ├─ collection.ts
│  │  │  │  └─ index.ts
│  │  │  ├─ debug/
│  │  │  │  ├─ index.ts
│  │  │  │  └─ logger.ts
│  │  │  ├─ dom/
│  │  │  │  ├─ body-scroll.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ timing.ts
│  │  │  ├─ geometry/
│  │  │  │  ├─ index.ts
│  │  │  │  └─ rect.ts
│  │  │  ├─ image/
│  │  │  │  ├─ adapter.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ loader.ts
│  │  │  ├─ layout/
│  │  │  │  ├─ columns.ts
│  │  │  │  ├─ columnsContainerQueries.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ masonry.ts
│  │  │  │  ├─ masonryContainerQueries.ts
│  │  │  │  ├─ shortestPath.ts
│  │  │  │  ├─ snapshotVisibility.ts
│  │  │  │  ├─ types.ts
│  │  │  │  └─ rows/
│  │  │  │     ├─ containerQueries.ts
│  │  │  │     ├─ helpers.ts
│  │  │  │     ├─ index.ts
│  │  │  │     ├─ knuthPlass.ts
│  │  │  │     └─ pathToGroups.ts
│  │  │  ├─ physics/
│  │  │  │  ├─ animation.ts
│  │  │  │  ├─ easing.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ spring.ts
│  │  │  │  └─ velocity.ts
│  │  │  ├─ transition/
│  │  │  │  ├─ index.ts
│  │  │  │  └─ planner.ts
│  │  │  ├─ utils/
│  │  │  │  ├─ dom.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ math.ts
│  │  │  └─ viewer/
│  │  │     ├─ gestures.ts
│  │  │     ├─ index.ts
│  │  │     ├─ state-machine.ts
│  │  │     └─ zoom.ts
│  │  └─ test/
│  │     ├─ collection.test.ts
│  │     ├─ layout.test.ts
│  │     ├─ loader.test.ts
│  │     ├─ photoAdapter.test.ts
│  │     ├─ responsive.test.ts
│  │     ├─ transition.test.ts
│  │     └─ viewer-and-geometry.test.ts
│  ├─ nuxt/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ src/
│  │  │  ├─ module.ts
│  │  │  └─ runtime/
│  │  │     ├─ defaults-plugin.ts
│  │  │     └─ plugin.ts
│  │  └─ test/
│  │     └─ module.test.ts
│  ├─ recipes/
│  │  ├─ build.config.ts
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ components/
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ InternalLightbox.vue
│  │  │  │  ├─ Lightbox.vue
│  │  │  │  ├─ Photo.vue
│  │  │  │  ├─ PhotoAlbum.vue
│  │  │  │  ├─ PhotoCarousel.vue
│  │  │  │  ├─ PhotoGroup.vue
│  │  │  │  ├─ SlotProxy.ts
│  │  │  │  └─ internal/
│  │  │  │     └─ CarouselLayout.vue
│  │  │  ├─ composables/
│  │  │  │  └─ usePhotoLayout.ts
│  │  │  └─ styles/
│  │  │     ├─ album.css
│  │  │     ├─ carousel-structure.css
│  │  │     ├─ carousel-theme.css
│  │  │     ├─ lightbox-structure.css
│  │  │     ├─ lightbox-theme.css
│  │  │     ├─ lightbox.css
│  │  │     ├─ photo-structure.css
│  │  │     └─ photo.css
│  │  └─ test/
│  │     ├─ carousel.test.ts
│  │     ├─ recipeContracts.test.ts
│  │     ├─ ssr.test.ts
│  │     └─ ssrHydration.test.ts
│  └─ vue/
│     ├─ build.config.ts
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ src/
│     │  ├─ extend.ts
│     │  ├─ globals.d.ts
│     │  ├─ index.ts
│     │  ├─ composables/
│     │  │  ├─ index.ts
│     │  │  ├─ useCarousel.ts
│     │  │  ├─ useContainerWidth.ts
│     │  │  ├─ useGestures.ts
│     │  │  ├─ useGhostTransition.ts
│     │  │  ├─ useLightbox.ts
│     │  │  ├─ useLightboxContext.ts
│     │  │  ├─ useLightboxInject.ts
│     │  │  ├─ useLightboxProvider.ts
│     │  │  ├─ usePanzoom.ts
│     │  │  └─ ghost/
│     │  │     ├─ closeTransition.ts
│     │  │     ├─ openTransition.ts
│     │  │     ├─ state.ts
│     │  │     └─ types.ts
│     │  ├─ internal/
│     │  │  └─ requireInjection.ts
│     │  ├─ primitives/
│     │  │  ├─ index.ts
│     │  │  ├─ LightboxCaption.vue
│     │  │  ├─ LightboxControls.vue
│     │  │  ├─ LightboxOverlay.vue
│     │  │  ├─ LightboxPortal.vue
│     │  │  ├─ LightboxRoot.vue
│     │  │  ├─ LightboxSlide.vue
│     │  │  ├─ LightboxViewport.vue
│     │  │  ├─ PhotoImage.vue
│     │  │  └─ PhotoTrigger.vue
│     │  ├─ provide/
│     │  │  ├─ keys.ts
│     │  │  └─ lightbox.ts
│     │  └─ types/
│     │     ├─ index.ts
│     │     └─ slots.ts
│     └─ test/
│        ├─ ghostState.test.ts
│        ├─ primitiveGuards.test.ts
│        ├─ publicApi.test.ts
│        ├─ useGestures.test.ts
│        └─ usePanzoom.test.ts
├─ scripts/
│  └─ size/
│     ├─ config.json
│     └─ run.mjs
└─ test/
   ├─ fixtures/
   │  └─ photos.ts
   └─ size/
      ├─ nuxt/
      │  ├─ baseline/
      │  │  ├─ app.vue
      │  │  ├─ nuxt.config.ts
      │  │  └─ package.json
      │  ├─ module/
      │  │  ├─ app.vue
      │  │  ├─ nuxt.config.ts
      │  │  └─ package.json
      │  └─ usage/
      │     ├─ app.vue
      │     ├─ nuxt.config.ts
      │     └─ package.json
      └─ vue/
         ├─ all/
         │  ├─ index.html
         │  └─ main.ts
         ├─ photo-image/
         │  ├─ index.html
         │  └─ main.ts
         └─ use-lightbox/
            ├─ index.html
            └─ main.ts
</project_tree>
<project_files>
<file name=".navigation.yml" path="/docs/content/docs/1.getting-started/.navigation.yml">
title: Getting Started
icon: i-lucide-rocket
</file>
<file name="1.introduction.md" path="/docs/content/docs/1.getting-started/1.introduction.md">
---
navigation:
  title: Introduction
title: What is Nuxt Photo?
description: A Nuxt module for photo galleries with a lightbox, carousel, and headless primitives.
---

Nuxt Photo gives you four components you can drop into any Nuxt 3 or 4 app:

- **`<Photo>`** — a single photo, with an optional solo lightbox.
- **`<PhotoAlbum>`** — a photo grid in rows, columns, or masonry, with a lightbox baked in.
- **`<PhotoGroup>`** — wraps any number of albums so they share a single lightbox.
- **`<PhotoCarousel>`** — an Embla carousel with thumbnails, counter, autoplay, and an optional lightbox overlay.

The lightbox supports pinch-to-zoom, pan, swipe, and spring-physics FLIP transitions. Everything is auto-imported. The module detects `@nuxt/image` and routes all thumbnails and slides through it when it is installed.

Nuxt Photo also tracks bundle impact as a consumer would see it. We measure tree-shaking on `@nuxt-photo/core`, focused imports on `@nuxt-photo/vue`, and client-bundle delta for `@nuxt-photo/nuxt` fixture builds in CI.

## Why it exists

Most photo gallery libraries force one trade-off: either the layout is flexible and the lightbox is weak, or the lightbox is rich and the layout is rigid. Nuxt Photo splits the two along a clean seam so neither has to compromise.

The result is a layered API. You reach for the layer that fits the job and ignore the rest.

## The five layers

Pick the highest layer that does the job. Drop down only when you need more control.

```text
<Photo>                One photo, optional solo lightbox.
<PhotoAlbum>           Grid layout + lightbox, baked in.
<PhotoGroup>           Share a lightbox across many albums.
<PhotoGroup v-slot>    Headless — your own layout, our lightbox.
Primitives + hooks     Build your own lightbox from scratch.
```

:read-more{to="/docs/concepts/layers" title="Layers of the API"}

## A 10-line gallery

This is the smallest useful thing you can build.

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [
  { id: '1', src: '/photos/desert.jpg', width: 1280, height: 800, alt: 'Desert' },
  { id: '2', src: '/photos/ocean.jpg', width: 960, height: 1200, alt: 'Ocean' },
  { id: '3', src: '/photos/forest.jpg', width: 1200, height: 800, alt: 'Forest' }
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

You get a justified-rows layout, a lightbox with gesture support, and SSR-safe rendering — no config.

## What you get out of the box

- Three layouts: **rows** (justified), **columns**, **masonry**, with responsive breakpoints.
- Touch gestures: pinch-to-zoom, pan, swipe, swipe-to-dismiss.
- Spring-physics FLIP transitions with a `fade` fallback for distant thumbnails.
- A `<PhotoGroup>` that lets several albums share one lightbox and one navigation flow.
- An Embla-powered `<PhotoCarousel>` with thumbnails, counter, arrows, dots, and autoplay.
- Measured client bundle impact, with thresholds checked by `pnpm size`.
- First-class `@nuxt/image` integration — auto-detected, no extra config.
- Pluggable image adapter for custom CMS or provider pipelines.
- Full SSR with CLS prevention through a configurable pre-render width.
- Headless primitives (`LightboxRoot`, `LightboxViewport`, `PhotoTrigger`, …) for when you need to build your own.

## Bundle size and tree-shaking

We document size by import path, not with one “the package is X kB” claim.

- `@nuxt-photo/core` is designed to tree-shake well. A named import like `responsive` is currently about `283 B` brotli in the repo fixture.
- `@nuxt-photo/vue` has a real spread between focused and rich imports. `PhotoImage` is currently about `718 B` brotli, while `useLightbox` is about `17.8 kB` brotli because it pulls in the actual gesture and transition engine.
- `@nuxt-photo/nuxt` is measured as bundle delta, not dist size. In the current fixture, enabling the module alone is effectively flat, and rendering one `PhotoImage` adds about `+292 B` brotli over baseline.
- `<PhotoCarousel>` uses full Embla. We treat it as an intentionally richer feature, not as a tiny primitive.

:read-more{to="/docs/reference/bundle-size" title="Bundle size and tree-shaking reference"}

## Next step

:read-more{to="/docs/getting-started/installation" title="Install the module"}
</file>
<file name="2.installation.md" path="/docs/content/docs/1.getting-started/2.installation.md">
---
title: Installation
description: Install the module, register it, and get the auto-imports.
---

Nuxt Photo is a single Nuxt module. One install, one entry in `modules`, and every component and composable is auto-imported.

## Prerequisites

- Nuxt **3.21.2+** or **4.x**
- Node **18+**

## Install

::pm-install{name="@nuxt-photo/nuxt"}
::

## Register the module

Add it to your `nuxt.config`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt']
})
```

That's it. `<Photo>`, `<PhotoAlbum>`, `<PhotoGroup>`, `<PhotoCarousel>`, and the `useLightbox` composable are now available anywhere in your app.

## Use `@nuxt/image` (optional, recommended)

If you want responsive images, srcset generation, and provider integrations (Cloudinary, Vercel, local, …), install `@nuxt/image` alongside Nuxt Photo. It is detected automatically.

::pm-install{name="@nuxt/image"}
::

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt-photo/nuxt'
  ]
})
```

With `@nuxt/image` present, every thumbnail and lightbox slide is routed through it. You can override the behavior in `nuxtPhoto.image` if you prefer a different provider strategy.

:read-more{to="/docs/concepts/image-providers" title="Image providers"}

## Use it

The smallest working example:

```vue [app.vue]
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [
  { id: '1', src: '/photos/a.jpg', width: 1280, height: 800, alt: 'Sunrise' },
  { id: '2', src: '/photos/b.jpg', width: 960, height: 1200, alt: 'Canyon' }
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Start the dev server and click any photo — the lightbox opens with a FLIP transition.

## What got installed

The `@nuxt-photo/nuxt` package pulls in three sibling packages so you never have to install them separately:

| Package | Purpose |
| --- | --- |
| `@nuxt-photo/core` | Framework-free layout, gestures, and types |
| `@nuxt-photo/vue` | Vue bindings and primitive components |
| `@nuxt-photo/recipes` | High-level components (`<PhotoAlbum>`, `<PhotoCarousel>`, …) |

You can import advanced helpers from any of them when you need to, but the default auto-imports cover 95% of cases.

## Next step

:read-more{to="/docs/getting-started/quickstart" title="Build your first gallery"}
</file>
<file name="3.quickstart.md" path="/docs/content/docs/1.getting-started/3.quickstart.md">
---
title: Quickstart
description: Build a real gallery with a lightbox in about 60 seconds.
---

You will end up with a full gallery page: a justified-rows layout, a lightbox with pinch-to-zoom, a shared lightbox across two albums, and captions. No custom CSS.

## Prerequisites

- The module installed. If not, see [Installation](/docs/getting-started/installation).
- A handful of images in `public/photos/`. If you don't have any yet, grab one from [Lorem Picsum](https://picsum.photos) — the real dimensions matter (they drive the layout).

## 1. Describe your photos

Every photo is a plain object. The required fields are `id`, `src`, `width`, and `height`. Everything else is optional.

```ts [app/composables/gallery.ts]
import type { PhotoItem } from '@nuxt-photo/core'

export const gallery: PhotoItem[] = [
  {
    id: 'desert',
    src: '/photos/desert.jpg',
    width: 1280,
    height: 800,
    alt: 'Desert at golden hour',
    caption: 'Desert Light'
  },
  {
    id: 'ocean',
    src: '/photos/ocean.jpg',
    width: 960,
    height: 1200,
    alt: 'Ocean waves',
    caption: 'Ocean Glass'
  },
  {
    id: 'forest',
    src: '/photos/forest.jpg',
    width: 1200,
    height: 800,
    alt: 'Misty forest',
    caption: 'Forest Haze'
  }
]
```

::callout{icon="i-lucide-triangle-alert"}
`width` and `height` are required. Nuxt Photo uses them to lay out thumbnails before the images load, which is how it avoids layout shift.
::

## 2. Render an album

```vue [app/pages/index.vue]
<script setup lang="ts">
import { gallery } from '~/composables/gallery'
</script>

<template>
  <PhotoAlbum :photos="gallery" layout="rows" :target-row-height="240" />
</template>
```

Reload the page. You now have a justified-rows gallery. Click any photo — the lightbox opens with a FLIP transition. Swipe, pinch to zoom, or press `Esc` to close.

## 3. Share a lightbox across two albums

Wrap both albums in a `<PhotoGroup>` and they share one lightbox. Clicking a photo in either album opens the same viewer, and the next/previous arrows flow across both.

```vue
<script setup lang="ts">
import { gallery } from '~/composables/gallery'

const landscapes = gallery.slice(0, 2)
const studies = gallery.slice(2)
</script>

<template>
  <PhotoGroup>
    <h2>Landscapes</h2>
    <PhotoAlbum :photos="landscapes" layout="rows" />

    <h2>Studies</h2>
    <PhotoAlbum :photos="studies" layout="rows" />
  </PhotoGroup>
</template>
```

:read-more{to="/docs/components/photo-group" title="PhotoGroup reference"}

## 4. Add a carousel

Swap the album for a carousel when you want a horizontal, swipeable view with thumbnails.

```vue
<template>
  <PhotoCarousel
    :photos="gallery"
    :options="{ loop: true }"
    show-thumbnails
    :lightbox="true"
  />
</template>
```

The carousel is powered by Embla, with optional lightbox integration.

:read-more{to="/docs/components/photo-carousel" title="PhotoCarousel reference"}

## You're done

You have a working gallery, lightbox, and carousel. From here:

- [Configure the module](/docs/getting-started/configuration) — CSS strategy, image provider, lightbox defaults.
- [Use `@nuxt/image`](/docs/guides/nuxt-image) — responsive images with real optimization.
- [Tune responsive layouts](/docs/guides/responsive-tuning) — column counts, spacing, breakpoints.
- [Build a custom lightbox](/docs/guides/custom-lightbox) — when the defaults aren't enough.
</file>
<file name="4.configuration.md" path="/docs/content/docs/1.getting-started/4.configuration.md">
---
title: Configuration
description: Every module option, with defaults and when to change them.
---

Configure Nuxt Photo under the `nuxtPhoto` key in `nuxt.config`. Every option is optional — the defaults work for a typical Nuxt app.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    autoImports: true,
    components: { prefix: '' },
    css: 'structure',
    image: { provider: 'auto' },
    lightbox: { minZoom: 1 }
  }
})
```

## `autoImports`

- **Type:** `boolean`
- **Default:** `true`

Controls whether composables (`useLightbox`, `useLightboxProvider`, `responsive`) are auto-imported.

```ts
nuxtPhoto: {
  autoImports: false // manually import from '@nuxt-photo/vue'
}
```

Turn this off only if you want tight control over your imports or you are importing the composables manually.

## `components`

- **Type:** `boolean | { prefix?: string }`
- **Default:** `{ prefix: '' }`

Registers all recipe components (`<Photo>`, `<PhotoAlbum>`, `<PhotoGroup>`, `<PhotoCarousel>`, …) with optional prefix.

```ts
// Disable auto-registration
nuxtPhoto: {
  components: false
}

// Add a prefix to avoid collisions
nuxtPhoto: {
  components: { prefix: 'Np' }
  // <NpPhoto>, <NpPhotoAlbum>, <NpPhotoCarousel>, …
}
```

Use a prefix when another module exposes components with the same names.

## `css`

- **Type:** `'none' | 'structure' | 'all'`
- **Default:** `'structure'`

Controls which stylesheets are loaded.

| Value | What's loaded | When to use |
| --- | --- | --- |
| `'none'` | Nothing | You have a custom design system and style every class yourself. |
| `'structure'` | Layout + geometry CSS only | You want structural correctness but want to theme colors, transitions, and spacing yourself. |
| `'all'` | Structure + default theme | You want the library to look good out of the box. |

```ts
nuxtPhoto: {
  css: 'all' // default theme colors and transitions
}
```

::callout{icon="i-lucide-triangle-alert"}
`'structure'` is the minimum viable setting. Disabling it entirely breaks layouts because the grid math depends on the structure CSS.
::

:read-more{to="/docs/reference/css" title="CSS reference and custom theming"}

## `image`

- **Type:** `false | { provider?: 'auto' | 'nuxt-image' | 'native' | 'custom' }`
- **Default:** `{ provider: 'auto' }`

Picks the image pipeline.

| Value | Behavior |
| --- | --- |
| `'auto'` | Uses `@nuxt/image` if it's installed, otherwise falls back to `native`. |
| `'nuxt-image'` | Routes every image through `@nuxt/image`. Fails loudly if it isn't installed. |
| `'native'` | Uses browser `<img>` with your `src` and optional `srcset` unchanged. |
| `'custom'` | Disables the built-in adapter. You provide one through `provide(ImageAdapterKey, ...)`. |

```ts
// Force @nuxt/image even if other providers are installed
nuxtPhoto: {
  image: { provider: 'nuxt-image' }
}

// Keep images out of any optimization pipeline
nuxtPhoto: {
  image: { provider: 'native' }
}

// Disable the adapter entirely
nuxtPhoto: {
  image: false
}
```

:read-more{to="/docs/concepts/image-providers" title="How image providers work"}

## `lightbox`

- **Type:** `{ minZoom?: number }`
- **Default:** `{ minZoom: 1 }`

Sets defaults applied to every lightbox in your app.

```ts
nuxtPhoto: {
  lightbox: {
    minZoom: 1.2 // allow zooming slightly past the fit-to-frame size
  }
}
```

Per-lightbox overrides are still possible through `useLightboxProvider({ minZoom })` when you build a custom lightbox.

## Full example

A production-ish config with `@nuxt/image`, full theming, and a component prefix:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt-photo/nuxt'
  ],
  image: {
    // your @nuxt/image provider config
    provider: 'cloudinary',
    cloudinary: { baseURL: 'https://res.cloudinary.com/your-cloud/image/upload/' }
  },
  nuxtPhoto: {
    css: 'all',
    image: { provider: 'nuxt-image' },
    components: { prefix: 'Np' },
    lightbox: { minZoom: 1 }
  }
})
```

## Next step

:read-more{to="/docs/concepts/photo-item" title="The PhotoItem type"}
</file>
<file name=".navigation.yml" path="/docs/content/docs/2.concepts/.navigation.yml">
title: Concepts
icon: i-lucide-compass
</file>
<file name="1.photo-item.md" path="/docs/content/docs/2.concepts/1.photo-item.md">
---
title: PhotoItem
description: The data shape every Nuxt Photo component speaks.
---

Nuxt Photo doesn't care where your photos come from — a CMS, a filesystem, an Unsplash query, a static list. Everything funnels through a single shape: the `PhotoItem`.

```ts
import type { PhotoItem } from '@nuxt-photo/core'
```

## The shape

```ts
type PhotoItem<TMeta = Record<string, unknown>> = {
  id: string | number        // required — stable identifier
  src: string                // required — full-size URL
  width: number              // required — intrinsic pixel width
  height: number             // required — intrinsic pixel height
  alt?: string               // accessibility + `<img alt>`
  caption?: string           // shown under lightbox and optional album overlay
  description?: string       // long-form text; shown below caption in lightbox
  thumbSrc?: string          // smaller URL for the grid; falls back to `src`
  srcset?: string            // passed through when you're managing srcset yourself
  blurhash?: string          // reserved for future placeholder support
  meta?: TMeta               // free-form app-specific data
}
```

## Required fields

Four fields are required on every item.

### `id`

Any string or number, as long as it's unique within the photo list. The lightbox uses it to track the active slide across re-renders, and `<PhotoGroup>` uses it to identify photos when they belong to different albums.

```ts
{ id: 'desert-01', src: '/photos/desert.jpg', width: 1280, height: 800 }
```

Don't use array indices — if the list changes order, the lightbox loses track of the active photo mid-animation.

### `src`

The URL to the full-size image. This is what the lightbox loads.

### `width` and `height`

The image's intrinsic pixel dimensions, not its display size. Nuxt Photo uses them to:

- Lay out the grid before images load (no CLS).
- Compute the FLIP transition target when opening the lightbox.
- Pick the right aspect ratio for `object-fit` and lightbox sizing.

::callout{icon="i-lucide-triangle-alert"}
Every rendered photo needs real dimensions — not placeholders. If your CMS doesn't return them, generate them at upload time with [`probe-image-size`](https://www.npmjs.com/package/probe-image-size) or equivalent. Ballpark values ruin the layout.
::

## Optional fields

### `alt`

Accessible alternative text. Rendered on the thumbnail `<img>` and reused in the lightbox. Skip only for decorative images.

### `caption`

Short title-like text. The default lightbox renders it prominently; `<PhotoAlbum>` can be configured to overlay it on thumbnails.

### `description`

Longer body text shown below the caption in the default lightbox. Use it for credits, EXIF summaries, or photographer notes.

### `thumbSrc`

A smaller pre-rendered URL for the grid. If set, the native image adapter uses `thumbSrc` in grid thumbnails and `src` in the lightbox — saving bandwidth on the list view.

```ts
{
  id: '1',
  src: '/photos/desert-2400.jpg',       // lightbox
  thumbSrc: '/photos/desert-400.jpg',   // grid
  width: 1280,
  height: 800
}
```

If you're using `@nuxt/image`, `thumbSrc` is usually unnecessary — the provider generates responsive sizes automatically.

### `srcset`

Escape hatch for when you want to control the browser's image selection yourself. Passed through to the `<img srcset>` attribute verbatim. Most users should rely on the image adapter instead.

### `meta`

A typed, free-form bag for app-specific data. Nuxt Photo never touches it, but it's passed to slots, event handlers, and adapters, so you can use it for CMS-specific fields.

```ts
type MyMeta = { photographer: string; shotAt: Date; tags: string[] }

const photos: PhotoItem<MyMeta>[] = [
  {
    id: '1',
    src: '/photos/desert.jpg',
    width: 1280,
    height: 800,
    meta: {
      photographer: 'Jane Doe',
      shotAt: new Date('2025-03-10'),
      tags: ['desert', 'golden-hour']
    }
  }
]
```

Then read it in a slot:

```vue
<PhotoAlbum :photos="photos">
  <template #caption="{ photo }">
    Shot by {{ photo.meta.photographer }}
  </template>
</PhotoAlbum>
```

## Don't have this shape?

If your API returns something else — Unsplash, Contentful, Sanity — use a `PhotoAdapter` instead of manually mapping.

```ts
import type { PhotoAdapter } from '@nuxt-photo/core'

type UnsplashPhoto = {
  id: string
  urls: { regular: string; thumb: string }
  width: number
  height: number
  alt_description: string | null
}

const fromUnsplash: PhotoAdapter<UnsplashPhoto> = item => ({
  id: item.id,
  src: item.urls.regular,
  thumbSrc: item.urls.thumb,
  width: item.width,
  height: item.height,
  alt: item.alt_description ?? undefined
})
```

Pass it to `<PhotoAlbum :photo-adapter="fromUnsplash" :photos="apiResponse" />` and Nuxt Photo will transform each item before rendering.

## See also

:::read-more{to="/docs/reference/types" title="Types reference"}
:::

:::read-more{to="/docs/guides/custom-adapter" title="Write a custom image adapter"}
:::
</file>
<file name="2.layers.md" path="/docs/content/docs/2.concepts/2.layers.md">
---
title: Layers
description: Five layers of API. Pick the highest one that does the job.
---

Nuxt Photo is stacked. Each layer gives you more control and asks for more work. The trick is to reach for the top of the stack and only drop down when you hit its ceiling.

```text
 ┌─────────────────────────────────────────────────────┐
 │ 1. <PhotoAlbum> / <Photo> / <PhotoCarousel>         │  ← start here
 ├─────────────────────────────────────────────────────┤
 │ 2. <PhotoGroup>                                     │
 ├─────────────────────────────────────────────────────┤
 │ 3. <PhotoGroup v-slot>                              │
 ├─────────────────────────────────────────────────────┤
 │ 4. Primitives: <LightboxRoot>, <PhotoTrigger>, …    │
 ├─────────────────────────────────────────────────────┤
 │ 5. Composables: useLightboxProvider, useLightbox    │
 └─────────────────────────────────────────────────────┘
```

Each layer is a supported entry point. You are not meant to read the source to find "the real API" — the real API is whichever layer you stop at.

## 1 — Recipe components

The fastest path. Four components, all batteries included.

```vue
<PhotoAlbum :photos="photos" layout="rows" />
```

You get a layout, a lightbox, gestures, `@nuxt/image` integration, and SSR-safe rendering. No configuration required.

Use this layer when:

- You want a working gallery in under a minute.
- You're prototyping.
- The default visuals are fine or nearly fine — small tweaks via props and CSS variables are still easy.

Move up when: you need two albums to share a lightbox, or you need a different layout than rows/columns/masonry.

## 2 — `<PhotoGroup>`

Wraps any number of albums so they share a single lightbox. When a user clicks a photo in either album, one lightbox opens and the next/previous arrows flow across both albums.

```vue
<PhotoGroup>
  <PhotoAlbum :photos="landscapes" layout="rows" />
  <PhotoAlbum :photos="studies" layout="columns" />
</PhotoGroup>
```

Use this layer when:

- You have multiple themed albums on one page (editorial layouts, categorized archives).
- You want "next" to carry the user across album boundaries.
- You want to open the lightbox from a button, not a thumbnail — `<PhotoGroup>` exposes `groupRef.open(id)`.

Move up when: the built-in layouts don't fit — you want a hex grid, a map, a 3D carousel, a timeline.

## 3 — `<PhotoGroup>` headless (`v-slot`)

Same lightbox as layer 2, but you render the photos however you want. `<PhotoGroup v-slot>` hands you a `trigger()` function and the registered photos; you arrange them.

```vue
<PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
  <div class="my-custom-layout">
    <figure
      v-for="(photo, i) in photos"
      :key="photo.id"
      v-bind="trigger(photo, i)"
      :style="hexPosition(i)"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </figure>
  </div>
</PhotoGroup>
```

Use this layer when:

- The built-in layouts don't fit — custom geometry, animation, map pins, whatever.
- You still want the default lightbox, gestures, and FLIP transitions.

Move up when: you want a different lightbox. Custom controls, a side panel, a before/after slider, a zoom UI that doesn't behave like ours.

## 4 — Primitives

The lightbox is built from small, composable primitives. Compose them to build your own.

```vue
<LightboxRoot :photos="photos">
  <PhotoTrigger v-for="photo in photos" :photo="photo" />

  <LightboxPortal>
    <LightboxOverlay />
    <LightboxViewport>
      <LightboxSlide v-slot="{ photo }">
        <!-- your own slide content, your own controls -->
      </LightboxSlide>
    </LightboxViewport>
    <LightboxControls />
    <LightboxCaption />
  </LightboxPortal>
</LightboxRoot>
```

Every primitive is unstyled, headless, and accessible. You decide what sits inside each slot.

Use this layer when:

- You want a custom lightbox UX — side-by-side compare, vertical feed, card flip.
- You need fine control over portaling, focus trapping, or motion.

Move up when: you want to drive everything yourself — no primitives, no conventions.

## 5 — Composables

At the bottom are the composables that power everything above. They expose state, actions, and gestures. No DOM assumptions.

```ts
const lightbox = useLightboxProvider(photos, { minZoom: 1.2 })
// lightbox.state, lightbox.open(), lightbox.next(), lightbox.panzoom, …
```

Use this layer when:

- You're wrapping Nuxt Photo in another library.
- You want to drive the state machine from a Pinia store, a URL, or an external event source.
- You don't render inside a Vue template at all (e.g. Canvas or WebGL overlays).

There's no layer below this one. You've reached the bottom.

## Picking a layer

A short rubric:

| Question | Layer |
| --- | --- |
| Do I need a gallery on a page? | 1 |
| Do I have two galleries that should share a lightbox? | 2 |
| Do I want the default lightbox, but my own layout? | 3 |
| Do I want a different lightbox UX? | 4 |
| Am I not even using Vue templates for the UI? | 5 |

Most users stop at layer 1 or 2. Layer 3 is common for editorial layouts. Layer 4 is for design teams. Layer 5 is rare.

## See also

:::read-more{to="/docs/components/photo-album" title="PhotoAlbum"}
:::

:::read-more{to="/docs/components/photo-group" title="PhotoGroup"}
:::

:::read-more{to="/docs/guides/custom-layout" title="Headless layout walkthrough"}
:::

:::read-more{to="/docs/guides/custom-lightbox" title="Custom lightbox from primitives"}
:::
</file>
<file name="3.image-providers.md" path="/docs/content/docs/2.concepts/3.image-providers.md">
---
title: Image providers
description: Choose how Nuxt Photo loads your images.
---

Every `<img>` Nuxt Photo renders — grid thumbnails, lightbox slides, carousel frames — goes through an **image adapter**. The adapter decides the final `src`, `srcset`, and `sizes`. You pick the adapter through one module option.

```ts [nuxt.config.ts]
nuxtPhoto: {
  image: { provider: 'auto' } // default
}
```

## The four providers

| Provider | When to use |
| --- | --- |
| `'auto'` | Default. Uses `@nuxt/image` if installed, otherwise `native`. |
| `'nuxt-image'` | You want responsive images and are sure `@nuxt/image` is installed. |
| `'native'` | You're serving pre-optimized images and want no transformation. |
| `'custom'` | You want full control — provide your own adapter via `provide()`. |

## `'auto'`

The default. Nuxt Photo checks whether `@nuxt/image` is in the module list. If yes, it uses it; if no, it falls back to the native adapter. Safe for any project.

## `'native'`

Uses the browser's `<img>` element with your `src` (and optional `srcset`) unchanged. No server-side transformation, no `@nuxt/image`. The right choice when:

- You serve pre-optimized images from a CDN (Cloudflare Images, Imgix URLs) and generate `srcset` yourself.
- You don't want `@nuxt/image` in your dependency tree.
- You need deterministic URLs for caching or signed-URL workflows.

If `photo.thumbSrc` is set, it's used for grid thumbnails; `photo.src` is used for lightbox slides.

```ts
// photo with pre-built srcset
{
  id: '1',
  src: '/photos/desert-2400.jpg',
  thumbSrc: '/photos/desert-400.jpg',
  srcset: '/photos/desert-400.jpg 400w, /photos/desert-800.jpg 800w, /photos/desert-2400.jpg 2400w',
  width: 1280,
  height: 800
}
```

## `'nuxt-image'`

Routes every image through [`@nuxt/image`](https://image.nuxt.com/). You get automatic responsive sizes, optional blur-up placeholders, and integrations for Cloudinary, Vercel, IPX, and every provider `@nuxt/image` supports.

Fails loudly if `@nuxt/image` isn't installed — use `'auto'` if you want silent fallback.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
  image: {
    provider: 'cloudinary',
    cloudinary: { baseURL: 'https://res.cloudinary.com/your-cloud/image/upload/' }
  },
  nuxtPhoto: {
    image: { provider: 'nuxt-image' }
  }
})
```

With `@nuxt/image` driving the pipeline, you only need to provide `src`, `width`, and `height` on each `PhotoItem` — the srcset is generated for you.

## `'custom'`

When neither native nor `@nuxt/image` fits — say you have a bespoke CMS endpoint, signed URLs that expire, or you want WebP + AVIF with your own logic — provide your own adapter.

Set `image: false` in the module options to disable the built-in adapter, then provide your own:

```ts [nuxt.config.ts]
nuxtPhoto: {
  image: false
}
```

```ts [plugins/photo-adapter.ts]
import { ImageAdapterKey } from '@nuxt-photo/vue'
import type { ImageAdapter } from '@nuxt-photo/core'

const myAdapter: ImageAdapter = (photo, context) => {
  // context is 'thumb' | 'slide' | 'preload'
  const width = context === 'thumb' ? 480 : 1920
  return {
    src: `/_cms/image/${photo.id}?w=${width}&fmt=webp`,
    srcset: `/_cms/image/${photo.id}?w=${width * 2}&fmt=webp 2x`,
    width: photo.width,
    height: photo.height
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(ImageAdapterKey, myAdapter)
})
```

Every `<PhotoImage>` in the app now routes through `myAdapter`.

## Per-component override

Individual components accept an `:adapter` prop for one-off overrides — useful when a specific album talks to a different CMS or uses a different transform.

```vue
<PhotoAlbum :photos="photos" :adapter="myCustomAdapter" />
```

The prop wins over the provided adapter, which wins over the module default.

## The adapter signature

```ts
type ImageAdapter = (
  photo: PhotoItem,
  context: 'thumb' | 'slide' | 'preload'
) => ImageSource

type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}
```

`context` tells you whether the consumer is a small grid thumbnail, a full lightbox slide, or a preload hint. Return different URLs for each if that saves bandwidth.

## See also

:::read-more{to="/docs/guides/nuxt-image" title="Integrate @nuxt/image"}
:::

:::read-more{to="/docs/guides/custom-adapter" title="Write a custom image adapter"}
:::

:::read-more{to="/docs/reference/types" title="ImageAdapter type reference"}
:::
</file>
<file name="4.responsive.md" path="/docs/content/docs/2.concepts/4.responsive.md">
---
title: Responsive parameters
description: Same prop, different value per container width.
---

Spacing, padding, columns, and row height can all change per viewport. Instead of media queries or `v-if`, Nuxt Photo accepts a **responsive parameter** wherever a number is expected — a plain value, a breakpoint map, or a function.

```ts
import { responsive } from '@nuxt-photo/vue'
```

## The three forms

### Static value

```vue
<PhotoAlbum :photos="photos" :spacing="8" />
```

Same spacing at every width. Equivalent to what you'd write for any other prop.

### Breakpoint map via `responsive()`

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
/>
```

- Keys are **minimum container widths** in pixels.
- Values are the parameter at that width.
- Largest matching key wins (mobile-first).

Reads the same way it renders: 4px below 640, 8px from 640 to 1023, 12px at 1024+.

### Inline function

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="w => w < 600 ? 4 : w < 1200 ? 8 : 12"
/>
```

Full control. Use when you need interpolation, min/max clamping, or a formula. The function receives the current **container width** (not viewport width — important for nested layouts).

## Which props accept it?

Any prop whose type is `ResponsiveParameter<T>`. In practice:

- `<PhotoAlbum>` — `spacing`, `padding`
- `<PhotoAlbum>` rows layout — `layout.targetRowHeight`
- `<PhotoAlbum>` columns/masonry layout — `layout.columns`

Static props (`layout.type`, `photos`, `lightbox`) don't.

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, 768: 3, 1200: 4 })
  }"
  :spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
  :padding="responsive({ 0: 0, 1200: 8 })"
/>
```

## Container width vs viewport width

`responsive()` keys match the **container's** measured width, not `window.innerWidth`. This matters when:

- Your album is inside a sidebar or card, not full-bleed.
- You use the same component on two pages with different layouts.
- The page has a fixed max-width — the album never goes full viewport.

If you want viewport-based breakpoints, build the function form around `useWindowSize` yourself.

## Why not CSS?

Grid layout in CSS (`grid-template-columns: repeat(auto-fill, minmax(…))`) is excellent for simple grids. Nuxt Photo needs more:

- The **rows** layout's justified sizing is computed from each photo's intrinsic aspect ratio — impossible in pure CSS.
- The **lightbox** needs to know the thumbnail's measured size to plan the FLIP transition. CSS-only breakpoints leave JavaScript blind.
- **SSR** needs a deterministic layout before JS runs, which media queries can't guarantee without knowing the assumed viewport.

The responsive parameter gives JS and CSS the same source of truth.

## SSR and `breakpoints`

When you use `responsive()`, the breakpoints it sees are extracted automatically and fed into the internal layout engine so the server-rendered HTML picks one of your breakpoint values instead of guessing.

Combine with `defaultContainerWidth` for fully deterministic SSR:

```vue
<PhotoAlbum
  :photos="photos"
  :default-container-width="1200"
  :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
/>
```

The server renders with `spacing=12` (because 1200 ≥ 1024), then the client re-resolves at its real measured width on hydration. If your assumed width matches the common viewport, users see no flicker.

:::read-more{to="/docs/guides/ssr-and-cls" title="SSR, CLS, and defaultContainerWidth"}
:::

## Common recipes

### Spacing that grows with the container

```ts
responsive({ 0: 2, 640: 6, 1024: 12, 1440: 16 })
```

### Fixed columns with expanding padding

```ts
:columns="3"
:padding="responsive({ 0: 0, 1024: 12 })"
```

### Rows that get taller on larger screens

```ts
:layout="{
  type: 'rows',
  targetRowHeight: responsive({ 0: 160, 640: 220, 1024: 280 })
}"
```

### Conditional layout

`responsive()` can't switch layout *types* — it's for numeric values. For a type change, gate the whole component:

```vue
<PhotoAlbum
  :photos="photos"
  :layout="isMobile ? 'masonry' : 'rows'"
/>
```

## See also

:::read-more{to="/docs/composables/responsive" title="responsive() signature"}
:::

:::read-more{to="/docs/guides/responsive-tuning" title="Tuning responsive layouts"}
:::
</file>
<file name="5.transitions.md" path="/docs/content/docs/2.concepts/5.transitions.md">
---
title: Transitions
description: FLIP animations between the grid and the lightbox — when they run and when they don't.
---

When a user clicks a thumbnail, Nuxt Photo animates the image from its grid position to its lightbox position. This is a **FLIP** transition (First, Last, Invert, Play) — the image doesn't teleport into the lightbox, it *moves* there.

Four modes decide how that animation plays.

## The four modes

| Mode | Behavior |
| --- | --- |
| `'flip'` | Always animate from the thumbnail rect to the lightbox rect. |
| `'fade'` | Never FLIP — always cross-fade into the lightbox. |
| `'auto'` | FLIP if the thumbnail is visible enough, otherwise fade. **Default.** |
| `'none'` | No transition. The lightbox appears instantly. |

### `'auto'` — the smart default

Most of the time you want FLIP — it's what makes a gallery feel physical. But FLIP only works if the user can *see* the thumbnail:

- Scrolled off-screen? No source rect. FLIP would animate from nowhere.
- Tiny thumbnail covered by an overlay? Source rect is wrong. FLIP would snap visibly.
- Opened programmatically before the thumbnail exists? No source rect either.

`'auto'` checks the thumbnail's intersection ratio and falls back to fade when FLIP would look worse than no animation.

### `autoThreshold`

The intersection ratio at which `'auto'` prefers FLIP over fade. Default: `0.55` (55% of the thumbnail visible).

```ts
transition: { mode: 'auto', autoThreshold: 0.75 }
```

Lower values mean FLIP runs more often. Raise it if your FLIPs look janky from partially-hidden thumbs; lower it if fades feel too eager.

## Setting the mode

### Per `PhotoAlbum` / `Photo` / `PhotoGroup`

```vue
<PhotoAlbum :photos="photos" transition="flip" />
<PhotoAlbum :photos="photos" :transition="{ mode: 'auto', autoThreshold: 0.7 }" />
```

### Globally via `useLightboxProvider`

```ts
const ctx = useLightboxProvider(photos, {
  transition: { mode: 'auto', autoThreshold: 0.6 }
})
```

The provider option covers every lightbox instance the composable drives — handy when building a custom lightbox that renders in multiple places.

## Close transitions

Closing flips back if the original thumbnail is still on-screen and in view. If the user scrolled away, the close transition falls back to fade.

This is automatic — there's no separate `closeTransition` prop. The same `autoThreshold` applies on the way out.

## Reduced motion

When the user has `prefers-reduced-motion: reduce` set, Nuxt Photo skips FLIP entirely and uses a very short fade. No opt-out needed — it respects OS-level accessibility settings by default.

## Why your FLIP isn't firing

Common causes:

1. **The thumbnail is out of view.** Scroll to it, then open — `'auto'` will FLIP. This is correct behavior: animating from a rect the user can't see looks wrong.
2. **Opening programmatically with no source.** `groupRef.open(id)` from a button has no thumbnail rect, so it falls back to fade. Pass the source element via `useLightbox().open(index, element)` if you need FLIP.
3. **Aspect ratios too far apart.** A square thumb opening a 4:1 panorama looks wrong mid-flight — the planner refuses FLIP and fades instead. The threshold is intentionally strict.
4. **Decode timeout.** If the full-size image takes too long to decode, we don't hold the animation hostage — it fades in. Use `@nuxt/image` or smaller source files.

You can inspect the planner's reasoning by enabling debug mode:

```ts
useLightboxProvider(photos, { debug: ['transitions'] })
```

## Switching modes in practice

- Editorial grid with big thumbs → `'flip'` (thumbs are always visible, FLIP feels great)
- Feed-style infinite scroll → `'auto'` (some thumbs will be near viewport edge)
- Carousel opening a lightbox → `'fade'` (carousel thumbs move during the open)
- Programmatic-only lightbox (deep links, search results) → `'fade'` or `'none'`

## See also

:::read-more{to="/docs/composables/use-lightbox-provider" title="useLightboxProvider reference"}
:::

:::read-more{to="/docs/reference/types" title="TransitionMode reference"}
:::
</file>
<file name=".navigation.yml" path="/docs/content/docs/3.components/.navigation.yml">
title: Components
icon: i-lucide-component
</file>
<file name="1.photo.md" path="/docs/content/docs/3.components/1.photo.md">
---
title: Photo
description: A single photo, optionally with its own lightbox.
---

`<Photo>` renders one photo as a `<figure>` with an `<img>` and optional caption. Drop it anywhere you'd normally use an `<img>` — it picks up the configured image provider, gestures, and lightbox.

```vue
<template>
  <Photo :photo="hero" lightbox />
</template>

<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const hero: PhotoItem = {
  id: 'hero',
  src: '/photos/desert.jpg',
  width: 1280,
  height: 800,
  alt: 'Desert at golden hour',
  caption: 'Desert Light'
}
</script>
```

::demo-code-pair
::demo-photo-solo
::

```vue [code]
<template>
  <Photo :photo="hero" lightbox />
</template>
```
::

## When to use

- A single editorial image on a landing page that should open full-screen on click.
- Inline images inside long-form content where a lightbox helps readability.
- Composing inside a `<PhotoGroup>` with a custom layout — a bunch of `<Photo>` children auto-register and share one lightbox.

For a grid of many photos, prefer `<PhotoAlbum>`. For horizontal scrolling, prefer `<PhotoCarousel>`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `photo` | `PhotoItem` | — | **Required.** The photo to render. |
| `lightbox` | `boolean \| Component` | `undefined` | `true` opens a solo lightbox on click. Pass a component to use a custom lightbox. Ignored when inside a `<PhotoGroup>`. |
| `lightboxIgnore` | `boolean` | `false` | When inside a `<PhotoGroup>`, opt this photo out of auto-registration. Renders as a plain image. |
| `adapter` | `ImageAdapter` | provided/module default | Per-instance image adapter override. |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Passed through to the underlying `<img>`. |
| `imgClass` | `string` | — | Extra classes for the `<img>` element. |
| `captionClass` | `string` | — | Extra classes for the `<figcaption>`. |

## Behavior

`<Photo>` has three modes depending on its context:

1. **Standalone** — no `<PhotoGroup>` parent, no `lightbox` prop. Renders a plain `<figure>` with image and caption. No click handler.
2. **Solo lightbox** — no parent, `lightbox` is `true` (or a component). Renders the same figure and mounts its own lightbox. Clicking opens it.
3. **Inside `<PhotoGroup>`** — auto-registers with the group's shared lightbox. Clicking opens that shared lightbox. The `lightbox` prop is ignored; use `lightboxIgnore` to opt out.

## Slots

| Slot | Slot props | Description |
| --- | --- | --- |
| `slide` | `{ photo, index, close, next, prev }` | Replace the rendered slide inside the lightbox with your own content. |

Use the `slide` slot when the photo's lightbox view needs to be different from its thumbnail — adding a video player, a map, or a before/after comparison.

```vue
<Photo :photo="photo" lightbox>
  <template #slide="{ photo, close }">
    <div class="my-custom-slide">
      <h2>{{ photo.caption }}</h2>
      <img :src="photo.src" :alt="photo.alt" />
      <button @click="close">Done</button>
    </div>
  </template>
</Photo>
```

## Examples

### Standalone image (no lightbox)

```vue
<Photo :photo="hero" />
```

The figure renders; clicks do nothing. Use for decorative or hero images.

### Solo lightbox

```vue
<Photo :photo="hero" lightbox />
```

Clicking opens a lightbox with just this one photo. Arrows are disabled (nothing to navigate to).

### Inside a `<PhotoGroup>`

```vue
<PhotoGroup>
  <div class="editorial-grid">
    <Photo v-for="p in photos" :key="p.id" :photo="p" />
  </div>
</PhotoGroup>
```

Every `<Photo>` child registers with the group on mount; one lightbox serves them all and next/previous navigate between them.

### Custom lightbox component

```vue
<script setup lang="ts">
import MyLightbox from './MyLightbox.vue'
</script>

<template>
  <Photo :photo="hero" :lightbox="MyLightbox" />
</template>
```

The custom component receives the lightbox context through the same provide/inject keys the built-in lightbox uses.

## See also

:::read-more{to="/docs/components/photo-album" title="PhotoAlbum"}
:::

:::read-more{to="/docs/components/photo-group" title="PhotoGroup"}
:::

:::read-more{to="/docs/guides/custom-lightbox" title="Build a custom lightbox"}
:::
</file>
<file name="2.photo-album.md" path="/docs/content/docs/3.components/2.photo-album.md">
---
title: PhotoAlbum
description: A grid of photos in rows, columns, or masonry, with a lightbox baked in.
---

`<PhotoAlbum>` is the workhorse. Give it a list of photos and a layout — rows, columns, or masonry — and you get a responsive grid with an integrated lightbox, gestures, and FLIP transitions.

```vue
<PhotoAlbum :photos="photos" layout="rows" />
```

::demo-code-pair
::demo-album-rows
::

```vue [code]
<template>
  <PhotoAlbum
    :photos="photos"
    layout="rows"
    :target-row-height="240"
    :spacing="6"
  />
</template>
```
::

## Layouts

Three layout algorithms; each responds to container width.

### Rows (justified)

```vue
<PhotoAlbum :photos="photos" layout="rows" :target-row-height="240" />
```

Images stretch horizontally to fill each row at a consistent height — the "Flickr look". Best for mixed aspect ratios.

Options:

- `targetRowHeight` — pixel height each row tries to hit. Accepts a responsive parameter. Default `300`.

### Columns

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: 3 }"
/>
```

Fixed-column grid. Every photo in a column is the same width; heights vary. Best when every image looks similar.

Options:

- `columns` — number of columns. Accepts a responsive parameter. Default `3`.

### Masonry

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'masonry', columns: 4 }"
/>
```

Fixed-column Pinterest-style layout — photos flow into the shortest column next. Best when visual density matters more than reading order.

Options:

- `columns` — number of columns. Accepts a responsive parameter. Default `3`.

::callout{icon="i-lucide-lightbulb"}
You can pass `layout` as a string (`"rows"`, `"columns"`, `"masonry"`) to use the default options for that algorithm, or as an object for full control.
::

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `photos` | `PhotoItem[]` | — | **Required.** The photos to lay out. |
| `photoAdapter` | `PhotoAdapter` | — | Transforms each `photos` entry into a `PhotoItem` (for CMS data). |
| `layout` | `'rows' \| 'columns' \| 'masonry' \| AlbumLayout` | `'rows'` | Layout algorithm and options. |
| `spacing` | `ResponsiveParameter<number>` | `8` | Gap between images in px. |
| `padding` | `ResponsiveParameter<number>` | `0` | Padding around each image in px. |
| `defaultContainerWidth` | `number` | — | Assumed container width for SSR. Runs the JS layout on the server. |
| `breakpoints` | `readonly number[]` | auto from `responsive()` | Snap observed width to the largest breakpoint ≤ actual. |
| `sizes` | `{ size: string; sizes?: ... }` | — | `<img sizes>` hint for rows layout. |
| `adapter` | `ImageAdapter` | provided/module default | Per-instance image adapter override. |
| `lightbox` | `boolean \| Component` | `true` | Enable the built-in lightbox, disable it, or pass a custom one. |
| `transition` | `LightboxTransitionOption` | `'auto'` | FLIP/fade mode for open/close animation. |
| `itemClass` | `string` | — | Extra classes for each item wrapper. |
| `imgClass` | `string` | — | Extra classes for each `<img>`. |

## Slots

| Slot | Slot props | Description |
| --- | --- | --- |
| `thumbnail` | `{ photo, index, width, height, hidden }` | Replace the rendered thumbnail. Useful for overlays, captions-on-hover, badges. |
| `caption` | `{ photo, index }` | Lightbox caption (forwarded to the internal lightbox). |
| `toolbar` | `{ close, next, prev, photo, index }` | Lightbox toolbar override. |
| `slide` | `{ photo, index, close, next, prev }` | Replace the lightbox slide content. |

The `thumbnail` slot receives a `hidden` boolean that flips to `true` during the FLIP transition — useful if you stack an overlay over the image and need to hide it while the transition animates.

## Examples

### Responsive columns layout

::demo-code-pair
::demo-album-columns
::

```vue [code]
<script setup lang="ts">
import { responsive } from '@nuxt-photo/vue'
</script>

<template>
  <PhotoAlbum
    :photos="photos"
    :layout="{
      type: 'columns',
      columns: responsive({ 0: 2, 640: 3, 1024: 4 })
    }"
    :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
  />
</template>
```
::

### Masonry layout

::demo-code-pair
::demo-album-masonry
::

```vue [code]
<template>
  <PhotoAlbum
    :photos="photos"
    :layout="{ type: 'masonry', columns: 3 }"
    :spacing="8"
  />
</template>
```
::

### SSR-friendly rows

```vue
<PhotoAlbum
  :photos="photos"
  layout="rows"
  :default-container-width="1200"
  :breakpoints="[375, 768, 1200]"
/>
```

The rows layout runs on the server at 1200px, then the client snaps to the nearest breakpoint on hydration.

:::read-more{to="/docs/guides/ssr-and-cls" title="SSR and CLS"}
:::

### Disable the lightbox

```vue
<PhotoAlbum :photos="photos" :lightbox="false" />
```

Useful when the album sits inside another pattern (e.g. a carousel of albums, or custom routing where clicks go to a detail page).

### Custom thumbnail overlay

```vue
<PhotoAlbum :photos="photos" layout="rows">
  <template #thumbnail="{ photo, hidden }">
    <div class="thumb" :style="{ opacity: hidden ? 0 : 1 }">
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
      <span class="badge">{{ photo.meta?.tag }}</span>
    </div>
  </template>
</PhotoAlbum>
```

### Feeding CMS data with a `photoAdapter`

```ts
import type { PhotoAdapter } from '@nuxt-photo/core'

const fromContentful: PhotoAdapter = item => ({
  id: item.sys.id,
  src: item.fields.file.url,
  width: item.fields.file.details.image.width,
  height: item.fields.file.details.image.height,
  alt: item.fields.title
})
```

```vue
<PhotoAlbum :photos="contentfulAssets" :photo-adapter="fromContentful" />
```

## See also

:::read-more{to="/docs/concepts/layers" title="Layers of the API"}
:::

:::read-more{to="/docs/components/photo-group" title="Share a lightbox across albums"}
:::

:::read-more{to="/docs/concepts/responsive" title="Responsive parameters"}
:::
</file>
<file name="3.photo-group.md" path="/docs/content/docs/3.components/3.photo-group.md">
---
title: PhotoGroup
description: Share one lightbox across many albums — or render your own layout.
---

`<PhotoGroup>` does one of two jobs:

1. Wraps multiple `<PhotoAlbum>` (or `<Photo>`) components so they share a single lightbox and navigation flow.
2. In headless mode (`v-slot`), it gives you the photos and a `trigger()` helper so you can render any layout you want — and still get the built-in lightbox.

::demo-code-pair
::demo-group
::

```vue [code]
<template>
  <PhotoGroup>
    <h2>Landscapes</h2>
    <PhotoAlbum :photos="landscapes" layout="rows" />

    <h2>Studies</h2>
    <PhotoAlbum :photos="studies" layout="columns" />
  </PhotoGroup>
</template>
```
::

Clicking a photo in either album opens the same lightbox — arrows flow across both.

## Two modes

### Auto (child-collected)

Don't pass `:photos`. Any `<Photo>` or `<PhotoAlbum>` child inside the group auto-registers. The photos appear in the lightbox in mount order.

```vue
<PhotoGroup>
  <PhotoAlbum :photos="albumA" />
  <PhotoAlbum :photos="albumB" />
</PhotoGroup>
```

### Explicit (headless)

Pass `:photos` and a `v-slot`. The group doesn't auto-collect; you render whatever you want. Use the slot's `trigger()` to wire up click handlers.

```vue
<PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
  <div class="hex-grid">
    <div
      v-for="(photo, i) in photos"
      :key="photo.id"
      v-bind="trigger(photo, i)"
      :style="hexPosition(i)"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </div>
  </div>
</PhotoGroup>
```

The same lightbox, gestures, and FLIP transitions — but the layout is yours.

:::read-more{to="/docs/guides/custom-layout" title="Headless layout walkthrough"}
:::

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `photos` | `PhotoItem[]` | — | Explicit photos list. Switches the group to headless mode. |
| `photoAdapter` | `PhotoAdapter` | — | Transforms `photos` entries into `PhotoItem` objects. |
| `lightbox` | `boolean \| Component` | `true` | Enable the built-in lightbox, disable it, or pass a custom one. |
| `transition` | `LightboxTransitionOption` | `'auto'` | FLIP/fade mode. |

## Slots

| Slot | Slot props | Description |
| --- | --- | --- |
| default (auto mode) | — | Child components. |
| default (headless) | `{ trigger, setThumbRef, open, photos }` | Render your own layout. |
| `toolbar` | `{ close, next, prev, photo, index }` | Lightbox toolbar override. |
| `caption` | `{ photo, index }` | Lightbox caption override. |
| `slide` | `{ photo, index, close, next, prev }` | Full lightbox slide replacement. |

### Headless slot props

- `trigger(photo, index)` — returns an object you `v-bind` to the thumbnail root. Attaches click/keyboard handlers and a ref.
- `setThumbRef(index)` — lower-level alternative to `trigger`, if you want to attach the ref manually.
- `open(photoOrIndex)` — programmatic open.
- `photos` — the resolved photos list (after `photoAdapter`).

## Exposed methods

Get a template ref and you can drive the lightbox externally:

```vue
<script setup lang="ts">
const groupRef = ref()

function openHero() {
  groupRef.value.open('desert-01') // by id
  // or groupRef.value.open(3)     // by index
  // or groupRef.value.open(photoObject)
}
</script>

<template>
  <PhotoGroup ref="groupRef" :photos="photos" v-slot="{ trigger, photos }">
    <!-- your layout -->
  </PhotoGroup>
  <button @click="openHero">Open hero</button>
</template>
```

- `open(photoOrIndex)` — opens the lightbox at the given index, photo id, or `PhotoItem`.
- `close()` — closes the lightbox.

:::read-more{to="/docs/guides/programmatic-control" title="Programmatic control"}
:::

## When to use `<PhotoGroup>`

### Use auto mode when

- You have multiple themed albums on one page.
- You want "next" to flow across albums.
- You still want rows/columns/masonry for each section.

### Use headless mode when

- You want a bespoke layout — hex grid, map pins, timeline, scatter plot.
- You want to drive the lightbox from a button, a URL, or a search result.
- You still want our default lightbox.

If you want a custom *lightbox* too, drop one layer down to primitives — see [Build a custom lightbox](/docs/guides/custom-lightbox).

## Examples

### Nested auto-collection

```vue
<PhotoGroup>
  <section>
    <h2>Featured</h2>
    <Photo :photo="featured[0]" />
    <Photo :photo="featured[1]" />
  </section>
  <section>
    <h2>Archive</h2>
    <PhotoAlbum :photos="archive" />
  </section>
</PhotoGroup>
```

Every individual `<Photo>` and every photo inside the `<PhotoAlbum>` lands in the same lightbox, in order.

### Programmatic open from outside

```vue
<script setup lang="ts">
const groupRef = ref()
const route = useRoute()

onMounted(() => {
  if (route.query.photo) {
    groupRef.value.open(route.query.photo)
  }
})
</script>

<template>
  <PhotoGroup ref="groupRef" :photos="photos" v-slot="{ trigger, photos }">
    <div class="grid">
      <img
        v-for="(p, i) in photos"
        :key="p.id"
        v-bind="trigger(p, i)"
        :src="p.thumbSrc ?? p.src"
      />
    </div>
  </PhotoGroup>
</template>
```

Deep-linking to a specific photo becomes one `open()` call.

### Disabling auto-registration for a specific `<Photo>`

```vue
<PhotoGroup>
  <Photo :photo="hero" lightbox-ignore />
  <PhotoAlbum :photos="rest" />
</PhotoGroup>
```

The hero image renders as a plain thumbnail — it won't land in the group's lightbox. Useful when you want one photo to link out to a detail page instead.

## See also

:::read-more{to="/docs/components/photo-album" title="PhotoAlbum"}
:::

:::read-more{to="/docs/components/photo" title="Photo"}
:::

:::read-more{to="/docs/guides/custom-layout" title="Headless layout with PhotoGroup"}
:::
</file>
<file name="4.photo-carousel.md" path="/docs/content/docs/3.components/4.photo-carousel.md">
---
title: PhotoCarousel
description: Horizontal, swipeable carousel with thumbnails, autoplay, and optional lightbox.
---

`<PhotoCarousel>` is an [Embla](https://www.embla-carousel.com/)-powered horizontal gallery. One main rail, an optional thumbnail strip, and an optional lightbox on tap.

```vue
<PhotoCarousel :photos="photos" :lightbox="true" show-thumbnails />
```

::demo-code-pair
::demo-carousel
::

```vue [code]
<template>
  <PhotoCarousel
    :photos="photos"
    :options="{ loop: true }"
    show-arrows
    show-thumbnails
    show-counter
    :lightbox="true"
    slide-aspect="16/9"
  />
</template>
```
::

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `photos` | `PhotoItem[]` | — | **Required.** The photos to show. |
| `photoAdapter` | `PhotoAdapter` | — | Transforms `photos` entries into `PhotoItem` objects. |
| `adapter` | `ImageAdapter` | provided/module default | Per-instance image adapter override. |
| `options` | `EmblaOptionsType` | Embla defaults | Main carousel options (loop, align, dragFree, …). |
| `plugins` | `EmblaPluginType[]` | `[]` | Additional Embla plugins. |
| `thumbsOptions` | `EmblaOptionsType` | `{ dragFree: true }` | Thumbnail rail options. |
| `showArrows` | `boolean` | `true` | Render prev/next arrow buttons. |
| `showThumbnails` | `boolean` | `true` | Render the thumbnail rail below the main rail. |
| `showCounter` | `boolean` | `true` | Render the `3 / 12` counter. |
| `showDots` | `boolean` | `false` | Render dot indicators. |
| `autoplay` | `boolean \| AutoplayOptionsType` | `false` | Enable Embla's Autoplay plugin. Pass an object for custom options. |
| `slideSize` | `string` | — | CSS `flex-basis` of each slide (e.g. `'100%'`, `'80%'`). |
| `slideAspect` | `string` | — | CSS `aspect-ratio` per slide (e.g. `'16/9'`, `'1/1'`). |
| `gap` | `string` | — | CSS gap between slides. |
| `thumbSize` | `string` | — | Thumbnail width. |
| `lightbox` | `boolean \| Component` | `false` | Enable a lightbox overlay on tap/click. |
| `transition` | `LightboxTransitionOption` | `'auto'` | Lightbox transition mode. |
| `slideClass` | `string` | — | Extra classes for each slide. |
| `imgClass` | `string` | — | Extra classes for each `<img>`. |
| `thumbClass` | `string` | — | Extra classes for each thumbnail. |
| `captionClass` | `string` | — | Extra classes for the caption. |
| `controlsClass` | `string` | — | Extra classes for the controls wrapper. |

## Embla options

The `options` prop is passed straight to Embla. The most common ones:

```ts
{
  loop: true,           // wrap around
  align: 'start',       // slide alignment ('start' | 'center' | 'end')
  dragFree: false,      // momentum-based scrolling
  containScroll: 'trimSnaps', // prevent over-scrolling at edges
  skipSnaps: false,     // allow velocity-based multi-slide jumps
  duration: 30          // transition speed (higher = slower)
}
```

See the [Embla options reference](https://www.embla-carousel.com/api/options/) for the full list.

## Exposed methods

Get a template ref to drive the carousel:

```vue
<script setup lang="ts">
const carouselRef = ref()
</script>

<template>
  <PhotoCarousel ref="carouselRef" :photos="photos" />
  <button @click="carouselRef.goTo(0)">Go to first</button>
  <button @click="carouselRef.goToNext()">Next</button>
</template>
```

| Method | Description |
| --- | --- |
| `goTo(index, instant?)` | Jump to a slide. Set `instant` to skip animation. |
| `goToNext(instant?)` | Next slide. |
| `goToPrev(instant?)` | Previous slide. |
| `selectedSnap()` | Current snap index (0-based). |
| `reInit(options?, plugins?)` | Re-initialize Embla (e.g. after option changes). |

| Reactive ref | Description |
| --- | --- |
| `emblaApi` | The main Embla API instance. |
| `thumbsApi` | The thumbnail rail's Embla API. |
| `selectedIndex` | Current slide index. |

## Examples

### Looping carousel with autoplay

```vue
<PhotoCarousel
  :photos="photos"
  :options="{ loop: true }"
  :autoplay="{ delay: 4000, stopOnInteraction: false }"
/>
```

Autoplay pauses on hover by default. Pass `stopOnInteraction: true` to stop autoplay permanently on any drag or click.

### Minimal — no chrome

```vue
<PhotoCarousel
  :photos="photos"
  :show-arrows="false"
  :show-thumbnails="false"
  :show-counter="false"
/>
```

Bare carousel, dragged by mouse/touch, no UI. Useful inside a design-heavy hero section.

### Multiple slides per view

```vue
<PhotoCarousel :photos="photos" slide-size="50%" gap="12px" />
```

Each slide takes 50% of the rail — users see two at a time with 12px between them.

### Custom slide aspect ratio

```vue
<PhotoCarousel :photos="photos" slide-aspect="21/9" />
```

Forces each slide to 21:9 regardless of the source aspect ratio.

### Carousel that opens a lightbox

```vue
<PhotoCarousel :photos="photos" :lightbox="true" />
```

Tap a slide — the lightbox opens at that photo. Swipe continues to work; the lightbox has its own navigation.

### Disable autoplay plugin conflicts

If you pass your own Autoplay plugin via `plugins` *and* set `autoplay`, Nuxt Photo drops the user-supplied one and warns in dev. Pick one:

```vue
<!-- prop form -->
<PhotoCarousel :photos="photos" :autoplay="{ delay: 3000 }" />

<!-- plugin form -->
<script setup lang="ts">
import Autoplay from 'embla-carousel-autoplay'
const plugins = [Autoplay({ delay: 3000 })]
</script>

<template>
  <PhotoCarousel :photos="photos" :plugins="plugins" />
</template>
```

## See also

:::read-more{to="/docs/components/photo-album" title="PhotoAlbum"}
:::

:::read-more{to="https://www.embla-carousel.com/api/options/" title="Embla options reference"}
:::
</file>
<file name="5.photo-trigger.md" path="/docs/content/docs/3.components/5.photo-trigger.md">
---
title: PhotoTrigger
description: A headless click target that opens the lightbox at a given photo.
---

`<PhotoTrigger>` is the smallest piece that bridges a thumbnail and a lightbox. Drop it inside a `<LightboxRoot>` (or any component that provides the lightbox context) and it renders an interactive, keyboard-accessible wrapper that opens the right slide on click.

```vue
<LightboxRoot :photos="photos">
  <PhotoTrigger
    v-for="(photo, i) in photos"
    :key="photo.id"
    :photo="photo"
    :index="i"
  >
    <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
  </PhotoTrigger>

  <!-- … rest of the lightbox primitives … -->
</LightboxRoot>
```

You rarely use this directly — `<Photo>` and `<PhotoAlbum>` already wrap your thumbnails with trigger behavior. Reach for `<PhotoTrigger>` when you're building a custom layout *and* composing the lightbox from primitives.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `photo` | `PhotoItem` | **Required.** The photo this trigger represents. |
| `index` | `number` | **Required.** The photo's position in the lightbox's photo list. |

## Slots

| Slot | Slot props | Description |
| --- | --- | --- |
| default | `{ photo, index, hidden }` | Your thumbnail content. `hidden` is `true` during the FLIP transition. |

## Behavior

- Renders a `<div role="button" tabindex="0">` — keyboard focusable, reachable by screen readers.
- Click, `Enter`, or `Space` open the lightbox at `index`.
- Sets the thumbnail ref on the lightbox context so the FLIP transition has the right source rect.
- `aria-label` defaults to `photo.alt` or `"View photo N"`.

## Attrs

All HTML attributes pass through to the root `<div>`. Use this to add classes, styles, data attributes, or additional handlers without losing the trigger behavior.

```vue
<PhotoTrigger
  :photo="photo"
  :index="i"
  class="my-thumb"
  :style="{ gridColumn: `span ${photo.meta?.span ?? 1}` }"
  @mouseenter="preload(photo)"
>
  <img :src="photo.thumbSrc" :alt="photo.alt" />
</PhotoTrigger>
```

## The `hidden` slot prop

When the lightbox opens with a FLIP transition, the underlying thumbnail becomes invisible so the ghost image can morph in its place. Use the `hidden` slot prop to hide any *overlay* content you've stacked over the image.

```vue
<PhotoTrigger :photo="photo" :index="i" v-slot="{ photo, hidden }">
  <div class="thumb" :style="{ opacity: hidden ? 0 : 1 }">
    <img :src="photo.thumbSrc" :alt="photo.alt" />
    <span class="badge">{{ photo.meta?.tag }}</span>
  </div>
</PhotoTrigger>
```

If you skip this, the badge stays visible on top of the FLIP-animated ghost image — a visual glitch.

## Example — custom layout

```vue
<script setup lang="ts">
import {
  LightboxRoot,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  PhotoTrigger
} from '@nuxt-photo/vue'
</script>

<template>
  <LightboxRoot :photos="photos">
    <div class="timeline">
      <PhotoTrigger
        v-for="(photo, i) in photos"
        :key="photo.id"
        :photo="photo"
        :index="i"
        :style="{ left: `${photo.meta.year * 10}px` }"
      >
        <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
      </PhotoTrigger>
    </div>

    <LightboxOverlay>
      <LightboxViewport v-slot="{ photos, viewportRef }">
        <div :ref="viewportRef" class="embla">
          <div class="embla__container">
            <LightboxSlide
              v-for="(photo, i) in photos"
              :key="photo.id"
              :photo="photo"
              :index="i"
            />
          </div>
        </div>
      </LightboxViewport>

      <LightboxControls v-slot="{ close, next, prev }">
        <button @click="prev">←</button>
        <button @click="close">×</button>
        <button @click="next">→</button>
      </LightboxControls>
    </LightboxOverlay>
  </LightboxRoot>
</template>
```

## See also

:::read-more{to="/docs/components/lightbox-primitives" title="Lightbox primitives"}
:::

:::read-more{to="/docs/guides/custom-lightbox" title="Build a custom lightbox"}
:::
</file>
<file name="6.photo-image.md" path="/docs/content/docs/3.components/6.photo-image.md">
---
title: PhotoImage
description: The universal image renderer — routes through whichever adapter you've configured.
---

`<PhotoImage>` is the `<img>` wrapper every Nuxt Photo component uses under the hood. It takes a `PhotoItem`, asks the configured image adapter for a source, and renders the result. Most apps never instantiate it directly — `<Photo>`, `<PhotoAlbum>`, and `<PhotoCarousel>` do it for you.

Reach for it when you're building a custom thumbnail or slide and want provider integration without reimplementing adapter routing.

```vue
<PhotoImage :photo="photo" context="thumb" />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `photo` | `PhotoItem` | — | **Required.** The photo to render. |
| `context` | `'thumb' \| 'slide' \| 'preload'` | `'thumb'` | Rendering context — adapters may return different URLs per context. |
| `adapter` | `ImageAdapter` | provided/module default | Per-instance adapter override. |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Passed through to the `<img>`. |
| `sizes` | `string` | — | Override the adapter-computed `<img sizes>`. |

## Why go through an adapter?

The underlying adapter is what makes switching between `@nuxt/image`, a native `<img>`, or a custom CMS transform a single-line config change:

```ts
nuxtPhoto: { image: { provider: 'nuxt-image' } }
```

`<PhotoImage>` asks the current adapter for this photo's `src`, `srcset`, and `sizes` — so the same component in the same template renders a native `<img>` or a `<NuxtImg>`-backed `<img>` depending on your setup.

:::read-more{to="/docs/concepts/image-providers" title="Image providers"}
:::

## Examples

### Thumbnail in a custom layout

```vue
<script setup lang="ts">
import { PhotoImage } from '@nuxt-photo/vue'
</script>

<template>
  <div class="grid">
    <figure v-for="photo in photos" :key="photo.id">
      <PhotoImage :photo="photo" context="thumb" loading="lazy" />
      <figcaption>{{ photo.caption }}</figcaption>
    </figure>
  </div>
</template>
```

### Full-size slide inside a custom lightbox

```vue
<LightboxSlide v-slot="{ photo }" :photo="photo" :index="i">
  <PhotoImage :photo="photo" context="slide" loading="eager" />
</LightboxSlide>
```

Use `context="slide"` so adapters that return different sizes per context (e.g. `@nuxt/image`) generate a full-resolution `srcset`.

### Custom per-album adapter

```vue
<PhotoImage
  :photo="photo"
  context="thumb"
  :adapter="myCmsAdapter"
/>
```

The per-instance adapter wins over any injected or module-level default. Useful when one gallery on a page pulls from a different provider.

## See also

:::read-more{to="/docs/concepts/image-providers" title="Image providers"}
:::

:::read-more{to="/docs/guides/custom-adapter" title="Write a custom image adapter"}
:::
</file>
<file name="7.lightbox-primitives.md" path="/docs/content/docs/3.components/7.lightbox-primitives.md">
---
title: Lightbox primitives
description: The headless building blocks behind every lightbox in Nuxt Photo.
---

The built-in lightbox isn't magic — it's six small primitives composed together. Import them from `@nuxt-photo/vue` and you can build your own lightbox with any UI you want, reusing our gestures, FLIP transitions, zoom, and state machine.

```ts
import {
  LightboxRoot,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxCaption,
  LightboxPortal
} from '@nuxt-photo/vue'
```

::callout{icon="i-lucide-info"}
If you're new to the primitives, start with the [custom lightbox guide](/docs/guides/custom-lightbox) — it walks through the smallest working example step by step.
::

## Composition overview

The primitives have a strict nesting order:

```
<LightboxRoot>                              ← provides context, teleports to body
  <LightboxOverlay>                         ← backdrop + click-to-close
    <LightboxViewport>                      ← gestures, embla container
      <LightboxSlide>                       ← one photo's frame, zoom, pan
    </LightboxViewport>
    <LightboxControls>                      ← next/prev/close buttons, a11y live region
    <LightboxCaption>                       ← caption/description text
    <LightboxPortal>                        ← ghost image for FLIP transitions
  </LightboxOverlay>
</LightboxRoot>
```

Every primitive is `inheritAttrs: false` — pass classes, styles, and data attributes through freely without breaking internal wiring.

## `<LightboxRoot>`

Provides the lightbox context to its descendants and teleports the subtree to `document.body` when open.

```vue
<LightboxRoot :photos="photos">
  <!-- everything else -->
</LightboxRoot>
```

Typically you don't render `<LightboxRoot>` yourself — `useLightboxProvider()` (used by `<Photo>`, `<PhotoAlbum>`, `<PhotoGroup>`) provides the same context. Use `<LightboxRoot>` when you're driving the lightbox from a composable or a custom component and need a scoped context.

## `<LightboxOverlay>`

The semi-transparent backdrop. Clicking it closes the lightbox (configurable via gesture mode).

```vue
<LightboxOverlay class="my-overlay">
  <!-- viewport, controls, etc. -->
</LightboxOverlay>
```

The `backdropStyle` the primitive applies is computed — it tracks the swipe-to-dismiss gesture, so the backdrop fades out naturally as the user drags down.

## `<LightboxViewport>`

The gesture area. Receives pointer/touch/wheel events and drives the Embla carousel underneath. Exposes a `viewport-ref` you wire to Embla's container element.

```vue
<LightboxViewport v-slot="{ photos, viewportRef, mediaOpacity }">
  <div :ref="viewportRef" class="embla" :style="{ opacity: mediaOpacity }">
    <div class="embla__container">
      <LightboxSlide
        v-for="(photo, i) in photos"
        :key="photo.id"
        :photo="photo"
        :index="i"
      />
    </div>
  </div>
</LightboxViewport>
```

Slot props:

- `photos` — the photos list.
- `viewportRef` — ref you attach to the Embla container.
- `mediaOpacity` — current opacity (tracks the open/close transition).

## `<LightboxSlide>`

Renders one slide. Handles zoom state, pan bounds, and the FLIP frame.

```vue
<LightboxSlide :photo="photo" :index="i" />
```

Props:

| Prop | Type | Description |
| --- | --- | --- |
| `photo` | `PhotoItem` | The slide's photo. |
| `index` | `number` | Index within the photo list. |
| `effectClass` | `string` | Classes for the effect wrapper. |
| `frameClass` | `string` | Classes for the frame element. |
| `zoomClass` | `string` | Classes applied when zoomed in. |
| `imgClass` | `string` | Classes on the inner `<img>`. |

If the context has a custom slide renderer (via `useLightboxProvider`'s `resolveSlide` option or a parent's `#slide` slot), `<LightboxSlide>` delegates to it.

## `<LightboxControls>`

Render any UI you want — close button, prev/next arrows, zoom toggle, counter, share button. The primitive wires up the state and hands it to the default slot.

```vue
<LightboxControls v-slot="{ activeIndex, count, close, next, prev, toggleZoom, isZoomedIn, zoomAllowed }">
  <button @click="close" aria-label="Close">×</button>
  <div>{{ activeIndex + 1 }} / {{ count }}</div>
  <button @click="prev" aria-label="Previous">←</button>
  <button @click="next" aria-label="Next">→</button>
  <button v-if="zoomAllowed" @click="toggleZoom">
    {{ isZoomedIn ? 'Zoom out' : 'Zoom in' }}
  </button>
</LightboxControls>
```

The primitive also renders a live region announcing `Photo 3 of 12` for screen readers.

## `<LightboxCaption>`

Renders caption/description text for the active photo. Default slot gives you `photo` and `activeIndex` so you can render whatever the photo's metadata supports.

```vue
<LightboxCaption v-slot="{ photo }">
  <h2 v-if="photo.caption">{{ photo.caption }}</h2>
  <p v-if="photo.description">{{ photo.description }}</p>
</LightboxCaption>
```

## `<LightboxPortal>`

Renders the **ghost image** — the element that morphs between the thumbnail and the slide during a FLIP transition. No slot, no children; mount it inside `<LightboxOverlay>` so it paints above the backdrop.

```vue
<LightboxPortal />
```

Without it, the open animation has nothing to animate and falls back to a fade.

## Minimal working example

```vue
<script setup lang="ts">
import {
  LightboxRoot,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxCaption,
  LightboxPortal,
  PhotoTrigger
} from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [/* … */]
</script>

<template>
  <LightboxRoot :photos="photos">
    <!-- your layout -->
    <div class="grid">
      <PhotoTrigger
        v-for="(photo, i) in photos"
        :key="photo.id"
        :photo="photo"
        :index="i"
      >
        <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
      </PhotoTrigger>
    </div>

    <!-- the lightbox -->
    <LightboxOverlay class="fixed inset-0 bg-black/90 z-50 grid place-items-center">
      <LightboxPortal />

      <LightboxViewport v-slot="{ photos, viewportRef }" class="w-full h-full">
        <div :ref="viewportRef" class="embla h-full">
          <div class="embla__container flex h-full">
            <LightboxSlide
              v-for="(photo, i) in photos"
              :key="photo.id"
              :photo="photo"
              :index="i"
              class="embla__slide flex-[0_0_100%]"
            />
          </div>
        </div>
      </LightboxViewport>

      <LightboxControls
        v-slot="{ close, next, prev, activeIndex, count }"
        class="absolute inset-x-0 top-0 flex justify-between p-4 text-white"
      >
        <button @click="close">Close</button>
        <span>{{ activeIndex + 1 }} / {{ count }}</span>
        <div class="flex gap-2">
          <button @click="prev">Prev</button>
          <button @click="next">Next</button>
        </div>
      </LightboxControls>

      <LightboxCaption
        v-slot="{ photo }"
        class="absolute inset-x-0 bottom-0 p-6 text-white"
      >
        <h2>{{ photo?.caption }}</h2>
        <p>{{ photo?.description }}</p>
      </LightboxCaption>
    </LightboxOverlay>
  </LightboxRoot>
</template>
```

## See also

:::read-more{to="/docs/guides/custom-lightbox" title="Build a custom lightbox"}
:::

:::read-more{to="/docs/composables/use-lightbox-provider" title="useLightboxProvider"}
:::

:::read-more{to="/docs/reference/extension-api" title="Extension API (@nuxt-photo/vue/extend)"}
:::
</file>
<file name=".navigation.yml" path="/docs/content/docs/4.composables/.navigation.yml">
title: Composables
icon: i-lucide-function-square
</file>
<file name="1.use-lightbox.md" path="/docs/content/docs/4.composables/1.use-lightbox.md">
---
title: useLightbox
description: Read lightbox state and drive it from any component.
---

`useLightbox()` is the **consumer** composable. It creates a lightbox context (or reuses the one provided by a parent) and gives you the minimum surface to read state and trigger actions: open, close, navigate.

Use it when you want to open the lightbox from somewhere that isn't a photo thumbnail — a button in the navbar, a list item, a deep-linked URL.

```ts
import { useLightbox } from '@nuxt-photo/vue'
```

## Signature

```ts
function useLightbox(
  photos: MaybeRef<PhotoItem | PhotoItem[]>
): {
  open: (index: number, sourceEl?: HTMLElement) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  isOpen: Ref<boolean>
  activeIndex: Ref<number>
  activePhoto: Ref<PhotoItem | null>
  count: Ref<number>
}
```

## Basic use

```vue
<script setup lang="ts">
import { useLightbox } from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [/* … */]
const lightbox = useLightbox(photos)
</script>

<template>
  <button @click="lightbox.open(0)">Open first photo</button>

  <div v-if="lightbox.isOpen.value">
    Viewing {{ lightbox.activeIndex.value + 1 }} / {{ lightbox.count.value }}
  </div>
</template>
```

## Returned API

### Actions

- `open(index, sourceEl?)` — open the lightbox at `index`. If you pass `sourceEl`, the FLIP transition uses its bounding rect as the source.
- `close()` — close the lightbox.
- `next()` / `prev()` — navigate between slides.

`open` and `close` are async — they resolve when the transition settles. Useful for chaining:

```ts
await lightbox.open(3)
logAnalytics('lightbox_opened', { index: 3 })
```

### Reactive state

- `isOpen` — `true` when the lightbox is open or opening.
- `activeIndex` — current slide index.
- `activePhoto` — the `PhotoItem` at `activeIndex`, or `null`.
- `count` — total photos.

All four are `Ref`s; unwrap them in templates as usual (`lightbox.activeIndex.value`).

## Single photo

Pass one `PhotoItem` instead of an array when you only want a solo lightbox:

```ts
const hero: PhotoItem = {
  id: 'hero',
  src: '/photos/hero.jpg',
  width: 1280,
  height: 800
}

const lightbox = useLightbox(hero)
```

Equivalent to passing a one-element array.

## Reactive photos

The `photos` argument is a `MaybeRef`, so it can be a plain value or a reactive ref:

```ts
const filter = ref('all')
const filtered = computed(() => photos.filter(p => filter.value === 'all' || p.meta?.tag === filter.value))

const lightbox = useLightbox(filtered)
```

When `filtered` changes, the lightbox's list updates. If the active photo survives the update, the active index is remapped to its new position; if it disappears, the lightbox closes.

## Scope: consumer vs provider

`useLightbox` creates a new lightbox context **scoped to the calling component**. Each component that calls it gets its own lightbox.

If you want multiple components to share *one* lightbox, use `useLightboxProvider` at the top and `useLightbox` (or injection) below. The convention in Nuxt Photo:

| Where | What to call |
| --- | --- |
| Building a custom lightbox | `useLightboxProvider` |
| Consuming a lightbox your parent provided | `useLightbox` |
| Inside a primitive (`LightboxControls`, etc.) | `useLightboxInject` |

## Deep-linking example

```vue
<script setup lang="ts">
import { useLightbox } from '@nuxt-photo/vue'

const route = useRoute()
const router = useRouter()

const lightbox = useLightbox(photos)

// Open on mount if ?photo=<id> is present
onMounted(() => {
  const id = route.query.photo
  if (!id) return
  const index = photos.findIndex(p => String(p.id) === String(id))
  if (index >= 0) lightbox.open(index)
})

// Sync URL with active photo while open
watch([lightbox.isOpen, lightbox.activePhoto], ([open, photo]) => {
  if (open && photo) {
    router.replace({ query: { ...route.query, photo: photo.id } })
  } else {
    router.replace({ query: { ...route.query, photo: undefined } })
  }
})
</script>

<template>
  <PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
    <div class="grid">
      <img
        v-for="(p, i) in photos"
        :key="p.id"
        v-bind="trigger(p, i)"
        :src="p.thumbSrc ?? p.src"
      />
    </div>
  </PhotoGroup>
</template>
```

## See also

:::read-more{to="/docs/composables/use-lightbox-provider" title="useLightboxProvider"}
:::

:::read-more{to="/docs/guides/programmatic-control" title="Programmatic control"}
:::
</file>
<file name="2.use-lightbox-provider.md" path="/docs/content/docs/4.composables/2.use-lightbox-provider.md">
---
title: useLightboxProvider
description: Create a lightbox context and provide it to descendants. The composable behind every custom lightbox.
---

`useLightboxProvider()` is the **builder** composable. Call it in the root of a custom lightbox component — it creates the full lightbox state and injects it down the tree so primitives like `<LightboxOverlay>` or `<PhotoTrigger>` can pick it up.

Every high-level component in Nuxt Photo (`<Photo>`, `<PhotoAlbum>`, `<PhotoGroup>`) wraps this composable. Use it directly when you're writing your own.

```ts
import { useLightboxProvider } from '@nuxt-photo/vue'
```

## Signature

```ts
function useLightboxProvider(
  photos: MaybeRef<PhotoItem | PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
  }
): {
  open: (index: number, sourceEl?: HTMLElement) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  isOpen: Ref<boolean>
  activeIndex: Ref<number>
  activePhoto: Ref<PhotoItem | null>
  photos: Ref<PhotoItem[]>
  count: Ref<number>
  setThumbRef: (index: number) => (el: Element | null) => void
  hiddenThumbIndex: Ref<number | null>
}
```

## When to use

Reach for `useLightboxProvider` when you're composing a **custom lightbox** from primitives — a different layout, different controls, different gestures. The provider creates the context; the primitives consume it.

If you're just opening the default lightbox from a button, use `useLightbox` instead. If you're inside a primitive that already has a parent provider, use `useLightboxInject`.

## Options

### `transition`

Controls the FLIP transition mode — covered in [Transitions](/docs/concepts/transitions).

```ts
useLightboxProvider(photos, {
  transition: { mode: 'auto', autoThreshold: 0.7 }
})
```

### `resolveSlide`

A callback that returns a custom slide renderer for a given photo, or `null` to use the default. Let different photos render different slide content.

```ts
useLightboxProvider(photos, {
  resolveSlide: (photo) => {
    if (photo.meta?.kind === 'video') return renderVideo
    return null // default image renderer
  }
})

function renderVideo({ photo }) {
  return h('video', { src: photo.src, controls: true, autoplay: true })
}
```

### `minZoom`

Minimum zoom scale. Default `1` (fit-to-frame). Raise it to allow zooming slightly past the fit size.

```ts
useLightboxProvider(photos, { minZoom: 1.2 })
```

## Building a custom lightbox

```vue
<script setup lang="ts">
import {
  useLightboxProvider,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxPortal,
  PhotoTrigger
} from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'

const props = defineProps<{ photos: PhotoItem[] }>()

const lightbox = useLightboxProvider(() => props.photos, {
  transition: 'auto',
  minZoom: 1
})

defineExpose({
  open: lightbox.open,
  close: lightbox.close
})
</script>

<template>
  <div class="gallery">
    <PhotoTrigger
      v-for="(photo, i) in photos"
      :key="photo.id"
      :photo="photo"
      :index="i"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </PhotoTrigger>
  </div>

  <Teleport to="body">
    <LightboxOverlay v-if="lightbox.isOpen.value" class="my-overlay">
      <LightboxPortal />
      <LightboxViewport v-slot="{ photos, viewportRef }">
        <div :ref="viewportRef" class="embla">
          <div class="embla__container">
            <LightboxSlide
              v-for="(photo, i) in photos"
              :key="photo.id"
              :photo="photo"
              :index="i"
            />
          </div>
        </div>
      </LightboxViewport>
      <LightboxControls v-slot="{ close, next, prev }" class="controls">
        <button @click="close">×</button>
        <button @click="prev">←</button>
        <button @click="next">→</button>
      </LightboxControls>
    </LightboxOverlay>
  </Teleport>
</template>
```

:::read-more{to="/docs/guides/custom-lightbox" title="Custom lightbox walkthrough"}
:::

## Returned API

Same surface as `useLightbox`, plus two extras useful for custom layouts:

### `setThumbRef(index)`

Returns a ref setter that records the thumbnail element for FLIP transitions. Attach it to the element that should animate into the lightbox.

```vue
<div
  v-for="(photo, i) in photos"
  :ref="setThumbRef(i)"
  @click="open(i)"
>
  <img :src="photo.thumbSrc" />
</div>
```

`<PhotoTrigger>` wires this automatically — only call `setThumbRef` manually when you're not using the primitive.

### `hiddenThumbIndex`

Ref to the index of the thumbnail currently hidden during a FLIP transition (or `null`). Use it to stage `opacity: 0` on the source thumb so the ghost image can morph in its place.

```vue
<div
  v-for="(photo, i) in photos"
  :ref="setThumbRef(i)"
  :style="{ opacity: hiddenThumbIndex === i ? 0 : 1 }"
>
  <img :src="photo.thumbSrc" />
</div>
```

## When you need more — `useLightboxContext`

For advanced extension, `useLightboxContext` (from `@nuxt-photo/vue/extend`) returns the full internal state: zoom controller, pan bounds, gesture phase, transition planner, debug channels. Most users don't need it.

:::read-more{to="/docs/reference/extension-api" title="Extension API"}
:::

## See also

:::read-more{to="/docs/components/lightbox-primitives" title="Lightbox primitives"}
:::

:::read-more{to="/docs/composables/use-lightbox" title="useLightbox"}
:::
</file>
<file name="3.responsive.md" path="/docs/content/docs/4.composables/3.responsive.md">
---
title: responsive
description: Turn a breakpoint map into a responsive parameter.
---

`responsive()` converts a plain object of `{ minWidth: value }` pairs into a function that resolves the right value for the current container width. Use it anywhere a prop accepts a `ResponsiveParameter`.

```ts
import { responsive } from '@nuxt-photo/vue'
```

## Signature

```ts
function responsive<T>(
  breakpoints: Record<number, T>
): ResponsiveResolver<T>
```

Returns a function `(containerWidth: number) => T`. Nuxt Photo calls it for you whenever it re-lays-out.

## Basic use

```vue
<script setup lang="ts">
import { responsive } from '@nuxt-photo/vue'
</script>

<template>
  <PhotoAlbum
    :photos="photos"
    :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
  />
</template>
```

## How it resolves

Keys are **minimum container widths** in pixels. Values are the parameter at that width. The resolver picks the **largest key ≤ containerWidth** (mobile-first).

```ts
const spacing = responsive({ 0: 4, 640: 8, 1024: 12 })

spacing(320)  // 4
spacing(640)  // 8
spacing(900)  // 8  (still under 1024)
spacing(1024) // 12
spacing(9999) // 12
```

A key of `0` acts as the fallback when the container is narrower than every other breakpoint. Always include one.

## Typed values

`responsive` is generic — it preserves your value type:

```ts
responsive<number>({ 0: 2, 768: 3, 1200: 4 })       // ResponsiveResolver<number>
responsive<'row' | 'col'>({ 0: 'col', 768: 'row' }) // ResponsiveResolver<'row' | 'col'>
```

In practice, Nuxt Photo props only accept numbers via `ResponsiveParameter<number>`, but the function itself is general.

## Inline function vs `responsive()`

These are equivalent:

```ts
// Breakpoint map — concise, declarative
:spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"

// Inline function — full control
:spacing="w => w < 640 ? 4 : w < 1024 ? 8 : 12"
```

Use `responsive()` when the mapping is a simple step function — 95% of the time. Use an inline function when you want interpolation, a formula, or min/max clamping:

```ts
// Spacing that scales linearly with container width
:spacing="w => Math.max(4, Math.min(16, w / 80))"
```

## SSR-aware breakpoints

`responsive()` quietly tags the returned function with its breakpoint set, so `<PhotoAlbum>` can feed them into its layout engine on the server. That means:

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
  :default-container-width="1024"
/>
```

…runs the rows layout on the server with `spacing=12` (because 1024 ≥ 1024), producing matching HTML client-side and no CLS.

Inline functions lose this — if you need SSR-exact breakpoints, either use `responsive()` or pass an explicit `:breakpoints` prop:

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="w => w < 640 ? 4 : w < 1024 ? 8 : 12"
  :breakpoints="[640, 1024]"
/>
```

:::read-more{to="/docs/guides/ssr-and-cls" title="SSR and CLS"}
:::

## Error cases

```ts
responsive({}) // ❌ throws — at least one breakpoint required
```

```ts
responsive({ 0: 4, 100: 8 })(-50) // ✅ returns 4 (floor clamp)
```

Negative or infinite keys are ignored when the breakpoint set is computed for SSR.

## See also

:::read-more{to="/docs/concepts/responsive" title="Responsive parameters"}
:::

:::read-more{to="/docs/guides/responsive-tuning" title="Tuning responsive layouts"}
:::
</file>
<file name=".navigation.yml" path="/docs/content/docs/5.guides/.navigation.yml">
title: Guides
icon: i-lucide-book-open
</file>
<file name="1.nuxt-image.md" path="/docs/content/docs/5.guides/1.nuxt-image.md">
---
title: Using @nuxt/image
description: Route every thumbnail and slide through @nuxt/image for automatic responsive sizes and provider integrations.
---

`@nuxt/image` gives you responsive images, on-the-fly optimization, and a pluggable provider system (Cloudinary, Vercel, IPX, Netlify, …). Nuxt Photo integrates with it automatically — install it, and every thumbnail and lightbox slide routes through it with no further configuration.

## 1. Install

::pm-install{name="@nuxt/image"}
::

## 2. Register both modules

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt-photo/nuxt'
  ]
})
```

Order doesn't matter — Nuxt Photo detects `@nuxt/image` regardless of position.

## 3. (Optional) Pick a provider

By default `@nuxt/image` uses IPX (local optimization). For a CDN, configure its provider block:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
  image: {
    provider: 'cloudinary',
    cloudinary: {
      baseURL: 'https://res.cloudinary.com/your-cloud/image/upload/'
    }
  }
})
```

See the [`@nuxt/image` provider docs](https://image.nuxt.com/providers) for every supported target.

## 4. Verify it's working

Drop a `<PhotoAlbum>` on a page:

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [
  { id: '1', src: '/photos/desert.jpg', width: 1280, height: 800 }
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Open DevTools → Network. The `<img>` request goes to `/_ipx/...` (or your CDN), not `/photos/desert.jpg` directly. That's the integration working.

## How it decides

The module option `image.provider` picks the adapter:

| Value | Behavior |
| --- | --- |
| `'auto'` (default) | Use `@nuxt/image` if present, else `native`. |
| `'nuxt-image'` | Force `@nuxt/image`. Error if it isn't installed. |
| `'native'` | Use raw `<img>` — skip `@nuxt/image` even if it's installed. |
| `'custom'` | Use your own adapter via `provide(ImageAdapterKey, …)`. |

```ts [nuxt.config.ts]
nuxtPhoto: {
  image: { provider: 'nuxt-image' } // force even in auto-detect fails
}
```

## What gets generated

For every photo, the `@nuxt/image` adapter emits:

- **`<img srcset>`** — multiple widths matching the current layout's breakpoints.
- **`<img sizes>`** — computed from the album's container width and the photo's ratio (rows layout only; columns use the adapter default).
- **`<img src>`** — falls back to the provider-resolved URL at the default width.

Grid thumbnails use `context='thumb'` (smaller srcset); lightbox slides use `context='slide'` (viewport-wide srcset). One adapter, two outputs.

## Photo dimensions still required

`@nuxt/image` doesn't replace the need for `width` and `height` on your `PhotoItem`. Nuxt Photo uses them for layout and FLIP transitions before any image loads — the provider can't help there.

```ts
const photos: PhotoItem[] = [
  {
    id: '1',
    src: '/photos/desert.jpg',
    width: 1280,      // ← still required
    height: 800       // ← still required
  }
]
```

## Using a remote source

`@nuxt/image` supports remote sources out of the box. Just use the full URL:

```ts
const photos: PhotoItem[] = [
  {
    id: '1',
    src: 'https://cdn.example.com/photos/desert.jpg',
    width: 1280,
    height: 800
  }
]
```

If your provider needs domain whitelisting (e.g. IPX's `domains` option), configure it in the `image` block — not in `nuxtPhoto`.

## Per-album override

Switch providers for a specific album by passing a custom `adapter`:

```vue
<script setup lang="ts">
import { createNuxtImageAdapter } from '@nuxt-photo/nuxt/runtime'

const cdnAdapter = createNuxtImageAdapter() // uses the configured @nuxt/image
</script>

<template>
  <PhotoAlbum :photos="photos" :adapter="cdnAdapter" />
</template>
```

Or write a fully custom adapter and pass it as a prop — see [Custom adapter](/docs/guides/custom-adapter).

## Troubleshooting

**My images still load from `/photos/*.jpg` directly.**  
`@nuxt/image` isn't in the modules array, or `image.provider` is set to `'native'`. Check both.

**I get a build error about `@nuxt/image` not found.**  
You set `image.provider: 'nuxt-image'` without installing the package. Either install it or switch to `'auto'`.

**IPX returns 404s in production.**  
The IPX provider needs write access to a cache directory. On serverless hosts, switch to a remote provider or set `ipx.alias` per the [IPX docs](https://image.nuxt.com/providers/ipx).

## See also

:::read-more{to="/docs/concepts/image-providers" title="Image providers"}
:::

:::read-more{to="/docs/guides/custom-adapter" title="Custom image adapter"}
:::
</file>
<file name="2.custom-layout.md" path="/docs/content/docs/5.guides/2.custom-layout.md">
---
title: Custom layout
description: Render photos in any layout you invent — keep the default lightbox.
---

`<PhotoAlbum>` covers rows, columns, and masonry. When your design needs something else — a hex grid, map pins, timeline entries, a 3D carousel — drop one layer down to `<PhotoGroup>` in **headless mode**. You write the layout; Nuxt Photo still handles the lightbox, gestures, and FLIP transitions.

## The pattern

```vue
<PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
  <!-- your layout here -->
  <div class="my-custom-layout">
    <figure
      v-for="(photo, i) in photos"
      :key="photo.id"
      v-bind="trigger(photo, i)"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </figure>
  </div>
</PhotoGroup>
```

Two things matter:

1. Pass `:photos` explicitly — that switches `<PhotoGroup>` into headless mode.
2. Spread `v-bind="trigger(photo, i)"` on each thumbnail — this attaches the click handler, keyboard focus, and the FLIP source ref in one go.

That's it. Clicks open the default lightbox; FLIP transitions animate from your custom layout.

## Example — hex grid

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [/* … */]

function hexPosition(i: number) {
  const cols = 4
  const col = i % cols
  const row = Math.floor(i / cols)
  const x = col * 120 + (row % 2 ? 60 : 0)
  const y = row * 104
  return { left: `${x}px`, top: `${y}px` }
}
</script>

<template>
  <PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
    <div class="hex-grid">
      <div
        v-for="(photo, i) in photos"
        :key="photo.id"
        class="hex"
        :style="hexPosition(i)"
        v-bind="trigger(photo, i)"
      >
        <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
      </div>
    </div>
  </PhotoGroup>
</template>

<style>
.hex-grid { position: relative; height: 500px; }
.hex {
  position: absolute;
  width: 120px;
  height: 104px;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  overflow: hidden;
  cursor: pointer;
}
.hex img { width: 100%; height: 100%; object-fit: cover; }
</style>
```

Clicking any hex opens the default lightbox at the right photo; arrow keys cycle through all of them.

## Example — map pins

```vue
<script setup lang="ts">
type GeoPhoto = PhotoItem & { meta: { lat: number; lng: number } }

const photos: GeoPhoto[] = [/* … */]

function pinPosition(photo: GeoPhoto) {
  const x = (photo.meta.lng + 180) * (100 / 360)
  const y = (90 - photo.meta.lat) * (100 / 180)
  return { left: `${x}%`, top: `${y}%` }
}
</script>

<template>
  <PhotoGroup :photos="photos" v-slot="{ trigger, photos }">
    <div class="map">
      <img src="/world-map.svg" class="map__bg" />
      <button
        v-for="(photo, i) in photos"
        :key="photo.id"
        class="pin"
        :style="pinPosition(photo as GeoPhoto)"
        v-bind="trigger(photo, i)"
        :title="photo.caption"
      >
        <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
      </button>
    </div>
  </PhotoGroup>
</template>
```

## Using `trigger()` props

`trigger(photo, index)` returns an object like:

```ts
{
  ref: (el: Element | null) => void,  // FLIP source ref
  role: 'button',
  tabindex: 0,
  onClick: () => void,
  onKeydown: (e: KeyboardEvent) => void,
  'aria-label': string
}
```

`v-bind` spreads all of it onto your element. You can still layer your own handlers on top — Vue will call both:

```vue
<figure
  v-bind="trigger(photo, i)"
  @mouseenter="preload(photo)"
  @mouseleave="showStats(photo)"
>
  <!-- … -->
</figure>
```

## Hiding thumbnails during FLIP

When the lightbox opens, the source thumb needs to hide so the ghost image can morph in its place. If you stack captions, badges, or buttons over the image, fade them out too:

```vue
<PhotoGroup :photos="photos" v-slot="{ trigger, photos, setThumbRef }">
  <div class="grid">
    <figure
      v-for="(photo, i) in photos"
      :key="photo.id"
      :ref="setThumbRef(i)"
      :style="{ opacity: hiddenIndex === i ? 0 : 1 }"
      v-bind="trigger(photo, i)"
    >
      <img :src="photo.thumbSrc" :alt="photo.alt" />
      <figcaption>{{ photo.caption }}</figcaption>
    </figure>
  </div>
</PhotoGroup>
```

For simpler cases, `trigger()` already sets the ref — `hiddenIndex` tracking is only needed when you want to fade overlay content.

## Using PhotoTrigger directly

`trigger()` is a shorthand for `<PhotoTrigger>`. You can use the primitive instead when that reads more naturally:

```vue
<PhotoGroup :photos="photos" v-slot="{ photos }">
  <div class="my-layout">
    <PhotoTrigger
      v-for="(photo, i) in photos"
      :key="photo.id"
      :photo="photo"
      :index="i"
    >
      <img :src="photo.thumbSrc" :alt="photo.alt" />
    </PhotoTrigger>
  </div>
</PhotoGroup>
```

`<PhotoTrigger>` wraps its children in a focusable `<div role="button">` — fine for most cases. `trigger()` lets you attach the behavior to whatever element you want.

:::read-more{to="/docs/components/photo-trigger" title="PhotoTrigger reference"}
:::

## When a custom lightbox too?

Headless mode gives you a custom **layout** but keeps the default lightbox. If you also want a different lightbox UI — side panel, before/after slider, zoom HUD — compose the primitives yourself.

:::read-more{to="/docs/guides/custom-lightbox" title="Custom lightbox walkthrough"}
:::

## See also

:::read-more{to="/docs/components/photo-group" title="PhotoGroup reference"}
:::

:::read-more{to="/docs/concepts/layers" title="Layers of the API"}
:::
</file>
<file name="3.custom-lightbox.md" path="/docs/content/docs/5.guides/3.custom-lightbox.md">
---
title: Custom lightbox
description: Replace the built-in lightbox with your own UI while keeping the gestures, zoom, and transitions.
---

The default lightbox is opinionated: a dark overlay, a centered frame, arrows, a caption. When your design needs something else — a side panel, before/after comparison, inline metadata, a bespoke zoom HUD — compose the primitives yourself.

You keep:

- Swipe, pinch-to-zoom, pan, drag-to-dismiss gestures
- Spring-physics FLIP transitions (with auto-fallback)
- State machine (opening / open / closing / closed)
- Keyboard support and focus trapping
- `<@nuxt/image>` integration via the image adapter

You write:

- The DOM layout
- Which controls exist and where they sit
- Styles, colors, typography, animations

## 1. Scaffolding

Start from `useLightboxProvider` — it creates the state and provides it to the descendant primitives.

```vue [components/MyLightbox.vue]
<script setup lang="ts">
import {
  useLightboxProvider,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxCaption,
  LightboxPortal,
  PhotoTrigger
} from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'

const props = defineProps<{ photos: PhotoItem[] }>()

const lightbox = useLightboxProvider(() => props.photos)

defineExpose({
  open: lightbox.open,
  close: lightbox.close
})
</script>

<template>
  <!-- the gallery -->
  <div class="grid grid-cols-3 gap-2">
    <PhotoTrigger
      v-for="(photo, i) in photos"
      :key="photo.id"
      :photo="photo"
      :index="i"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </PhotoTrigger>
  </div>

  <!-- the lightbox -->
  <Teleport to="body">
    <LightboxOverlay
      v-if="lightbox.isOpen.value"
      class="fixed inset-0 z-50 bg-neutral-950/95"
    >
      <LightboxPortal />

      <LightboxViewport v-slot="{ photos, viewportRef }" class="h-full w-full">
        <div :ref="viewportRef" class="h-full embla">
          <div class="flex h-full embla__container">
            <LightboxSlide
              v-for="(photo, i) in photos"
              :key="photo.id"
              :photo="photo"
              :index="i"
              class="flex-[0_0_100%] h-full"
            />
          </div>
        </div>
      </LightboxViewport>

      <LightboxControls
        v-slot="{ close, next, prev, activeIndex, count, toggleZoom, isZoomedIn, zoomAllowed }"
        class="absolute inset-x-0 top-0 flex items-center gap-2 p-4 text-white"
      >
        <button @click="close" aria-label="Close">✕</button>
        <div class="flex-1 text-center text-sm opacity-60">
          {{ activeIndex + 1 }} / {{ count }}
        </div>
        <button v-if="zoomAllowed" @click="toggleZoom">
          {{ isZoomedIn ? 'Reset' : 'Zoom' }}
        </button>
        <button @click="prev" aria-label="Previous">←</button>
        <button @click="next" aria-label="Next">→</button>
      </LightboxControls>

      <LightboxCaption
        v-slot="{ photo }"
        class="absolute inset-x-0 bottom-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent"
      >
        <h2 v-if="photo?.caption" class="text-lg font-medium">{{ photo.caption }}</h2>
        <p v-if="photo?.description" class="text-sm opacity-80">{{ photo.description }}</p>
      </LightboxCaption>
    </LightboxOverlay>
  </Teleport>
</template>
```

Use it like any component:

```vue
<MyLightbox :photos="photos" />
```

## 2. Nesting rules

The primitives have a strict composition order:

```
LightboxRoot / useLightboxProvider   ← creates context
  LightboxOverlay                    ← the backdrop
    LightboxPortal                   ← ghost image (for FLIP)
    LightboxViewport                 ← gestures, embla container
      LightboxSlide (×n)             ← each photo
    LightboxControls                 ← buttons, counter
    LightboxCaption                  ← caption/description
```

Deviations that break things:

- Controls/Caption outside `<LightboxOverlay>` — they won't receive the swipe-to-dismiss gesture that fades them out.
- `<LightboxPortal>` outside `<LightboxOverlay>` — the ghost image paints behind the backdrop.
- `<LightboxSlide>` outside `<LightboxViewport>` — no Embla container, so swiping doesn't work.

## 3. Custom slide rendering

Want videos, before/after sliders, or map overlays as slides? Two options.

### Per-lightbox: `resolveSlide`

Pass a resolver at provider creation:

```ts
useLightboxProvider(photos, {
  resolveSlide: (photo) => {
    if (photo.meta?.kind === 'video') return renderVideo
    if (photo.meta?.kind === 'compare') return renderCompare
    return null // fall through to default image rendering
  }
})

function renderVideo({ photo }) {
  return h('video', { src: photo.src, controls: true, autoplay: true, class: 'w-full h-full object-contain' })
}
```

The resolver receives the `PhotoItem` and returns a renderer function (or `null`).

### Per-photo: `#slide` slot

Using the default `<PhotoAlbum>` or `<PhotoGroup>`, pass a `#slide` slot:

```vue
<PhotoGroup>
  <PhotoAlbum :photos="photos" />

  <template #slide="{ photo, close }">
    <div v-if="photo.meta?.kind === 'video'">
      <video :src="photo.src" controls autoplay />
      <button @click="close">Done</button>
    </div>
  </template>
</PhotoGroup>
```

This goes through `resolveSlide` internally — same effect, more convenient syntax when the lightbox is provided by a parent.

## 4. Styling the FLIP frame

The `<LightboxSlide>` renders three nested elements:

```
.effectClass       → outer wrapper (pan/zoom target)
  .frameClass      → the sized frame (match the photo's aspect ratio)
    .zoomClass     → zoomed-in container (only when isZoomedIn)
      .imgClass    → the actual <img>
```

Pass classes via the slide's props:

```vue
<LightboxSlide
  :photo="photo"
  :index="i"
  frame-class="rounded-lg shadow-2xl"
  img-class="object-contain"
/>
```

## 5. Gestures

Swipe, pinch-zoom, pan, and drag-to-close all come for free — they attach to `<LightboxViewport>`. You don't need to wire them.

If you want to tweak behavior — e.g. a higher `minZoom`:

```ts
useLightboxProvider(photos, { minZoom: 1.5 })
```

For deeper customization (pinch thresholds, swipe velocity), reach into the full extension API.

:::read-more{to="/docs/reference/extension-api" title="Extension API"}
:::

## 6. Accessibility

Built-in primitives handle most of the a11y baseline:

- Focus trap on open, restore focus on close
- `aria-live` announcement for "Photo 3 of 12"
- Keyboard: `Esc` closes, `←/→` navigate
- Triggers have `role="button"` and `tabindex="0"`

You're responsible for:

- Button labels (`aria-label`) on any custom controls
- Readable contrast in your color scheme
- Respecting reduced-motion (Nuxt Photo skips FLIP automatically; respect it in your own CSS too)

## See also

:::read-more{to="/docs/components/lightbox-primitives" title="Lightbox primitives reference"}
:::

:::read-more{to="/docs/composables/use-lightbox-provider" title="useLightboxProvider"}
:::

:::read-more{to="/docs/reference/extension-api" title="Extension API"}
:::
</file>
<file name="4.custom-adapter.md" path="/docs/content/docs/5.guides/4.custom-adapter.md">
---
title: Custom image adapter
description: Route every image through your own CMS, signing logic, or format-selection rules.
---

The built-in `'native'` and `'nuxt-image'` providers cover most cases. When they don't — signed URLs with short TTLs, a bespoke image API, WebP + AVIF negotiation with your own logic — you can write a custom **image adapter**.

An adapter is a single function:

```ts
type ImageAdapter = (
  photo: PhotoItem,
  context: 'thumb' | 'slide' | 'preload'
) => ImageSource

type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}
```

Given a photo and the context it'll render in, return what the `<img>` should use.

## 1. Disable the built-in adapter

```ts [nuxt.config.ts]
nuxtPhoto: {
  image: false
}
```

This stops Nuxt Photo from auto-wiring an adapter on app start. You'll provide your own.

## 2. Write the adapter

```ts [utils/photoAdapter.ts]
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'

const BASE = 'https://cdn.example.com/transform'

function url(photo: PhotoItem, w: number, fmt = 'webp') {
  return `${BASE}/${photo.id}?w=${w}&fmt=${fmt}`
}

export const cmsAdapter: ImageAdapter = (photo, context) => {
  if (context === 'thumb') {
    return {
      src: url(photo, 480),
      srcset: `${url(photo, 480)} 480w, ${url(photo, 960)} 960w`,
      width: photo.width,
      height: photo.height
    }
  }

  // slide / preload
  return {
    src: url(photo, 1920),
    srcset: [480, 960, 1440, 1920, 2560]
      .map(w => `${url(photo, w)} ${w}w`)
      .join(', '),
    sizes: '100vw',
    width: photo.width,
    height: photo.height
  }
}
```

A few principles:

- **Branch on `context`.** Grid thumbnails don't need full-res srcsets. Lightbox slides do.
- **Always return `width` and `height`.** The slide primitive uses them to size the frame before the image loads.
- **Never return `undefined` src.** If a photo is missing, fall back to a placeholder — throwing here breaks the grid.

## 3. Provide it globally

Use a Nuxt plugin that runs once on the client:

```ts [plugins/photo-adapter.ts]
import { ImageAdapterKey } from '@nuxt-photo/vue'
import { cmsAdapter } from '~/utils/photoAdapter'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(ImageAdapterKey, cmsAdapter)
})
```

Every `<PhotoImage>` in the app now routes through `cmsAdapter`.

## 4. Per-instance override

Pass an `:adapter` prop to any component:

```vue
<script setup lang="ts">
import { cmsAdapter } from '~/utils/photoAdapter'
import { stockAdapter } from '~/utils/stockAdapter'
</script>

<template>
  <PhotoAlbum :photos="cmsPhotos" :adapter="cmsAdapter" />
  <PhotoAlbum :photos="stockPhotos" :adapter="stockAdapter" />
</template>
```

Prop wins over the provided adapter, which wins over the module default.

## Common adapter recipes

### Signed URLs with expiration

```ts
const signedAdapter: ImageAdapter = (photo, context) => {
  const expires = Math.floor(Date.now() / 1000) + 3600
  const signature = signUrl(photo.id, expires)
  const width = context === 'thumb' ? 480 : 1920
  return {
    src: `/i/${photo.id}?w=${width}&exp=${expires}&sig=${signature}`,
    width: photo.width,
    height: photo.height
  }
}
```

### Format negotiation (AVIF → WebP → JPEG)

Return a `<picture>`-style srcset isn't possible through the image adapter (`<img>` only). Instead, let the server negotiate via the `Accept` header and return one URL per context.

### Cloudinary via hand-written URL

If you don't want to depend on `@nuxt/image` but still want Cloudinary:

```ts
const CLOUD = 'your-cloud'

const cloudinaryAdapter: ImageAdapter = (photo, context) => {
  const transform = context === 'thumb'
    ? 'c_fill,w_480,h_360,q_auto,f_auto'
    : 'c_limit,w_1920,q_auto,f_auto'
  return {
    src: `https://res.cloudinary.com/${CLOUD}/image/upload/${transform}/${photo.src}`,
    width: photo.width,
    height: photo.height
  }
}
```

### Fallback when a photo has no source

```ts
const safeAdapter: ImageAdapter = (photo, context) => {
  if (!photo.src) {
    return {
      src: '/placeholder.svg',
      width: photo.width,
      height: photo.height
    }
  }
  // delegate to another adapter
  return cmsAdapter(photo, context)
}
```

## Testing an adapter

Adapters are pure functions — unit-test them without Vue:

```ts
import { describe, it, expect } from 'vitest'
import { cmsAdapter } from '~/utils/photoAdapter'

const photo = { id: '1', src: 'x', width: 1280, height: 800 }

describe('cmsAdapter', () => {
  it('emits a small srcset for thumbs', () => {
    const result = cmsAdapter(photo, 'thumb')
    expect(result.src).toContain('w=480')
    expect(result.srcset).toMatch(/480w.*960w/)
  })

  it('emits a full srcset for slides', () => {
    const result = cmsAdapter(photo, 'slide')
    expect(result.srcset?.split(', ').length).toBeGreaterThan(3)
  })
})
```

## See also

:::read-more{to="/docs/concepts/image-providers" title="Image providers"}
:::

:::read-more{to="/docs/reference/types" title="ImageAdapter type reference"}
:::
</file>
<file name="5.responsive-tuning.md" path="/docs/content/docs/5.guides/5.responsive-tuning.md">
---
title: Tuning responsive layouts
description: Spacing, column counts, row heights — how to pick the right values for every viewport.
---

Every layout prop that accepts a number also accepts a **responsive parameter**: a breakpoint map or a function of the container width. This guide walks through how to tune them for real projects.

## Start with breakpoints that match your design

If your app already has breakpoints (from Tailwind, UnoCSS, your design tokens), mirror them here:

```ts
const bp = { sm: 640, md: 768, lg: 1024, xl: 1280 }
```

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, [bp.md]: 3, [bp.lg]: 4, [bp.xl]: 5 })
  }"
  :spacing="responsive({ 0: 4, [bp.md]: 8, [bp.lg]: 12 })"
/>
```

Reusing your existing breakpoints keeps the gallery visually consistent with the rest of the page.

## Rows layout — tuning `targetRowHeight`

The rows layout tries to hit a target height per row, stretching photos horizontally to fit. Bigger targets = fewer photos per row, more "editorial" feel. Smaller targets = denser feed.

```ts
// Editorial — large photos, 1–2 per row
:layout="{ type: 'rows', targetRowHeight: responsive({ 0: 240, 768: 320, 1200: 420 }) }"

// Feed — small, dense
:layout="{ type: 'rows', targetRowHeight: responsive({ 0: 120, 768: 160, 1200: 200 }) }"
```

Rule of thumb: aim for 2–4 photos per row on desktop, 1–2 on mobile. That means a target height around **container width / 4** on desktop and **container width / 2** on mobile.

## Columns layout — picking a count

Columns are fixed-count. Raise the count gradually as the container grows:

```ts
responsive({
  0: 2,     // phones
  640: 3,   // small tablets
  1024: 4,  // desktops
  1440: 5   // wide screens
})
```

If your images are portraits (or heterogeneous), fewer columns read better. Landscapes can tolerate more.

## Masonry layout — same controls, different feel

Masonry uses the same `columns` responsive parameter, but stacks shortest-first rather than row-by-row. Reading order breaks — users scroll and scan, they don't read top-to-bottom.

Good for: portfolios with mixed aspect ratios, Pinterest-style feeds.  
Bad for: narrative sequences (event photos, before/after).

## Spacing — small numbers, big impact

Spacing below 4px feels cramped; above 16px looks like separate photos not a gallery. Stick to 4–12px:

```ts
:spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
```

Match `padding` (outer container padding) to your page gutter, not to the spacing. They're different visual cues.

## Padding per item

Padding wraps each photo with empty space — useful for mat-board frames or "card" looks:

```ts
:padding="8" // 8px frame around every photo
```

Combined with a `background` on the item wrapper (via `:item-class`), you get an instant gallery-frame aesthetic.

## Combining props

Spacing and target row height interact. A taller row with the same spacing looks *more* separated; a denser row with the same spacing looks *less*. Change them together:

```ts
// Sparse, roomy
:layout="{ type: 'rows', targetRowHeight: 320 }"
:spacing="12"

// Dense, tight
:layout="{ type: 'rows', targetRowHeight: 160 }"
:spacing="4"
```

## Using a function for smooth scaling

Breakpoint maps jump. Sometimes you want smooth interpolation — spacing that *grows* with the container:

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="w => Math.round(Math.max(4, Math.min(16, w / 80)))"
/>
```

At 320px: 4px spacing. At 1280px: 16px spacing. Linear between.

Downside: no SSR breakpoints (see the note in [Responsive](/docs/concepts/responsive#ssr-and-breakpoints)). Pair with an explicit `:breakpoints` prop if SSR exactness matters.

## Snapping to breakpoints

Without `breakpoints`, the layout recomputes on every pixel change of the container. For most UIs this is fine — but resize events from a scrollbar appearing can cause flicker. Snapping fixes it:

```ts
:breakpoints="[320, 640, 1024, 1280]"
```

The layout only re-runs when the observed width crosses a boundary. Pair with matching `responsive()` keys so visual breakpoints and layout breakpoints match.

## Container vs viewport

The responsive prop sees **container** width — the `<PhotoAlbum>` element's measured width. That's what you want when albums sit in sidebars or cards with their own max-widths.

If you genuinely need viewport-based breakpoints (rare — usually a smell), use `useWindowSize`:

```vue
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const columns = computed(() => width.value < 640 ? 2 : width.value < 1024 ? 3 : 4)
</script>

<template>
  <PhotoAlbum :photos="photos" :layout="{ type: 'columns', columns }" />
</template>
```

## Debugging

Drop a small status strip during tuning:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const album = ref<HTMLElement>()
const containerWidth = ref(0)

onMounted(() => {
  const obs = new ResizeObserver(([entry]) => {
    containerWidth.value = Math.round(entry.contentRect.width)
  })
  obs.observe(album.value!)
})
</script>

<template>
  <div ref="album">
    <div class="debug">Container: {{ containerWidth }}px</div>
    <PhotoAlbum :photos="photos" />
  </div>
</template>
```

Now you can see the exact container width as you resize, and pick breakpoint keys that land where you want them.

## See also

:::read-more{to="/docs/concepts/responsive" title="Responsive parameters"}
:::

:::read-more{to="/docs/composables/responsive" title="responsive()"}
:::

:::read-more{to="/docs/guides/ssr-and-cls" title="SSR and CLS"}
:::
</file>
<file name="6.ssr-and-cls.md" path="/docs/content/docs/5.guides/6.ssr-and-cls.md">
---
title: SSR and CLS
description: Render the right layout on the server so the page doesn't jump on hydration.
---

Cumulative Layout Shift (CLS) is the web-vitals metric that punishes pages for re-arranging content after load. Image galleries are prime offenders — the server doesn't know the container width, so it can't lay photos out correctly; then the client hydrates and everything moves.

Nuxt Photo has three knobs for keeping SSR and the client in lockstep.

## The three tools

| Tool | What it does |
| --- | --- |
| Photo `width` + `height` | Reserves correct aspect ratio per thumbnail. **Always required.** |
| `:defaultContainerWidth` | Runs the JS layout on the server assuming this container width. |
| `:breakpoints` (or `responsive()`) | Snap the observed width to a discrete set so SSR and client pick the same one. |

### Why width/height matter before anything else

Before the adapter, before any responsive logic, Nuxt Photo reserves each thumb with a correct CSS aspect ratio. The rows layout uses `flex-grow` math against the intrinsic ratio; columns and masonry size by ratio.

Miss `width` or `height` and the container shrinks to zero until the image loads — the classic CLS spike.

## Level 0 — no SSR tuning

You just render the component:

```vue
<PhotoAlbum :photos="photos" />
```

The server emits a CSS-only flex-grow fallback for rows layout. It won't match the final layout exactly — close, but the last row will probably re-shuffle on hydration.

That's acceptable for pages where the gallery is below the fold. If it's above the fold (and visible at LCP), tune further.

## Level 1 — assumed container width

```vue
<PhotoAlbum
  :photos="photos"
  :default-container-width="1200"
/>
```

The rows layout runs on the server at 1200px. The HTML is exact — width, height, flex-basis, flex-grow all match what the client will compute.

Pick a value that matches your **common viewport**:

| Target audience | Good default |
| --- | --- |
| Desktop-first marketing site | 1200–1280 |
| Mobile-first consumer app | 375 |
| Mixed | The midpoint of your most common breakpoints |

The trade-off is simple: clients whose actual width matches see zero CLS; clients off from the assumption see one re-layout on hydration (no worse than Level 0).

::callout{icon="i-lucide-triangle-alert"}
A value of `0` is silently ignored and warns in dev — it's almost always a bug. If you want no SSR tuning, omit the prop.
::

## Level 2 — snapping to breakpoints

The client's observed container width is usually pixel-exact. The server only knows whole numbers. Without breakpoints, the SSR and client layouts can differ by 1–2 pixels → re-layout → CLS.

Snap both to the same discrete set:

```vue
<PhotoAlbum
  :photos="photos"
  :default-container-width="1200"
  :breakpoints="[375, 640, 1024, 1280, 1440]"
/>
```

The client picks the largest breakpoint ≤ its actual width — 1280 for a 1300px viewport, 1024 for a 1100px viewport. The server picks 1200 → 1024 (or 1280, depending on your `defaultContainerWidth`). When those match, SSR and hydration produce identical HTML.

Best practice: set `defaultContainerWidth` to one of your breakpoints. That way the server's choice is guaranteed to match a breakpoint the client might also pick.

## `responsive()` tags its own breakpoints

When you use the `responsive()` helper, Nuxt Photo extracts the breakpoint keys automatically — you don't need a separate `:breakpoints` prop:

```vue
<PhotoAlbum
  :photos="photos"
  :default-container-width="1280"
  :spacing="responsive({ 0: 4, 640: 8, 1024: 12, 1280: 16 })"
/>
```

The server and client both snap to `[640, 1024, 1280]`. Clean.

If multiple responsive props define different keys, they merge:

```vue
<PhotoAlbum
  :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, 768: 3, 1200: 4 })
  }"
/>
```

Merged breakpoints: `[640, 768, 1024, 1200]`.

## Columns and masonry

The columns and masonry layouts don't use `flex-grow` — they're CSS-flexbox columns where each column's width is fixed. SSR renders them correctly by default, *if* the JS layout runs.

Set `:default-container-width` so the server can pick the right column count when `columns` is responsive.

## Carousel and SSR

`<PhotoCarousel>` uses CSS-only sizing (Embla hydrates the scroll behavior on mount). There's no CLS risk from the layout itself — just make sure photo `width`/`height` match your `slideAspect`.

## A full SSR-ready example

```vue
<script setup lang="ts">
import { responsive } from '@nuxt-photo/vue'
</script>

<template>
  <PhotoAlbum
    :photos="photos"
    :default-container-width="1280"
    layout="rows"
    :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
    :padding="responsive({ 0: 0, 1024: 4 })"
    sizes="{ size: '100vw', sizes: [
      { viewport: '(max-width: 640px)', size: '100vw' },
      { viewport: '(max-width: 1024px)', size: '100vw' }
    ] }"
  />
</template>
```

- `defaultContainerWidth: 1280` — matches the `1024` breakpoint's upper range.
- `responsive()` tags breakpoints `[640, 1024]` for both server and client.
- `sizes` hint prevents the browser from downloading oversized images on small viewports.

## Verifying in Lighthouse

1. Run Lighthouse on the page in a cold-cache mobile emulation.
2. Look at the "Avoid large layout shifts" audit — it shows which DOM subtree shifted and by how much.
3. If the gallery shows up, either the assumed width is wrong, breakpoints don't match, or the photos are missing `width`/`height`.

CLS scores under **0.1** are good; under **0.05** is excellent. A correctly-tuned gallery contributes **0.00**.

## See also

:::read-more{to="/docs/concepts/responsive" title="Responsive parameters"}
:::

:::read-more{to="/docs/guides/responsive-tuning" title="Responsive tuning"}
:::
</file>
<file name="7.programmatic-control.md" path="/docs/content/docs/5.guides/7.programmatic-control.md">
---
title: Programmatic control
description: Open, close, and navigate the lightbox from code — buttons, URLs, keyboard shortcuts, analytics.
---

Every lightbox Nuxt Photo creates exposes the same action surface: `open`, `close`, `next`, `prev`. You can reach them from outside the gallery, which makes non-thumbnail entry points straightforward — a CTA button, a deep link, a keyboard shortcut, an analytics handler.

## Three ways to get a handle

### 1. Template ref on a recipe component

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [/* … */]
const groupRef = ref()

function openFirst() {
  groupRef.value.open(0)
}
</script>

<template>
  <PhotoGroup ref="groupRef" :photos="photos" v-slot="{ trigger, photos }">
    <div class="grid">
      <img
        v-for="(p, i) in photos"
        :key="p.id"
        v-bind="trigger(p, i)"
        :src="p.thumbSrc ?? p.src"
      />
    </div>
  </PhotoGroup>

  <button @click="openFirst">Start the tour</button>
</template>
```

`<PhotoGroup>` exposes `open` and `close`. `<PhotoCarousel>` exposes `goTo`, `goToNext`, `goToPrev` instead. `<PhotoAlbum>` and `<Photo>` don't expose an explicit API — wrap them in a `<PhotoGroup>` when you need one.

### 2. `useLightbox` in a parent

```vue
<script setup lang="ts">
import { useLightbox } from '@nuxt-photo/vue'

const photos = [/* … */]
const lightbox = useLightbox(photos)
</script>

<template>
  <button @click="lightbox.open(0)">Open first</button>
  <!-- render thumbnails with PhotoTrigger wired to the same lightbox -->
</template>
```

Use this when a single component needs to both render triggers and drive the lightbox from buttons. `useLightbox` creates the context; `<PhotoTrigger>` inside the same subtree picks it up via injection.

### 3. `useLightboxProvider` in a custom lightbox

You get the same API on the object returned by `useLightboxProvider`. Expose it:

```ts
const lightbox = useLightboxProvider(photos)

defineExpose({
  open: lightbox.open,
  close: lightbox.close,
  next: lightbox.next,
  prev: lightbox.prev
})
```

## The action API

```ts
open(photoOrIndex: number | PhotoItem | string, sourceEl?: HTMLElement): Promise<void>
close(): Promise<void>
next(): void
prev(): void
```

- `open` accepts an **index**, a **`PhotoItem`**, or a **photo id** (on `<PhotoGroup>`). Using an id is nice for deep links: the caller doesn't need to know the index.
- `open` and `close` are async — they resolve when the transition settles.
- `next` and `prev` no-op when the lightbox is closed.

## Recipes

### Deep-linking via URL

```vue
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const groupRef = ref()

// Open on mount if ?photo=<id> is in the URL
onMounted(() => {
  const id = route.query.photo
  if (id) groupRef.value.open(id)
})

// Sync URL with active photo
watch(
  () => groupRef.value?.activePhoto?.value,
  (photo) => {
    router.replace({ query: { ...route.query, photo: photo?.id } })
  }
)
</script>
```

### Keyboard shortcut

```ts
import { onKeyStroke } from '@vueuse/core'

onKeyStroke('o', (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault()
    groupRef.value?.open(0)
  }
})
```

### Analytics on each open

```vue
<script setup lang="ts">
const lightbox = useLightbox(photos)

watch(lightbox.isOpen, (open) => {
  if (open && lightbox.activePhoto.value) {
    analytics.track('lightbox_opened', { id: lightbox.activePhoto.value.id })
  }
})

watch(lightbox.activeIndex, (i) => {
  if (lightbox.isOpen.value) {
    analytics.track('lightbox_navigated', { index: i })
  }
})
</script>
```

### Timed slideshow

```ts
let timer: ReturnType<typeof setInterval>

function startSlideshow() {
  timer = setInterval(() => lightbox.next(), 3000)
}
function stopSlideshow() {
  clearInterval(timer)
}

watch(lightbox.isOpen, (open) => open ? startSlideshow() : stopSlideshow())
```

For carousels, use the built-in Autoplay plugin instead — it handles pause-on-hover and reduced-motion for you.

### Opening to a specific photo with FLIP

Without a `sourceEl`, `open(id)` falls back to a fade transition. If you want FLIP from a specific element:

```ts
const el = document.querySelector<HTMLElement>('#featured-thumb')
await lightbox.open(3, el)
```

In practice this matters when the "thumbnail" for FLIP purposes isn't inside the gallery — a featured card in a sidebar, for example.

### Chaining opens

```ts
async function tour() {
  await groupRef.value.open(0)
  await new Promise(r => setTimeout(r, 2000))
  groupRef.value.next()
  await new Promise(r => setTimeout(r, 2000))
  groupRef.value.next()
}
```

Because `open` awaits the transition, the timing is deterministic.

## See also

:::read-more{to="/docs/composables/use-lightbox" title="useLightbox"}
:::

:::read-more{to="/docs/components/photo-group" title="PhotoGroup"}
:::

:::read-more{to="/docs/components/photo-carousel" title="PhotoCarousel"}
:::
</file>
<file name=".navigation.yml" path="/docs/content/docs/6.reference/.navigation.yml">
title: Reference
icon: i-lucide-library
</file>
<file name="1.types.md" path="/docs/content/docs/6.reference/1.types.md">
---
title: Types
description: Every public type, with its shape and where it comes from.
---

All types below are exported from `@nuxt-photo/core` unless otherwise noted.

```ts
import type {
  PhotoItem,
  PhotoAdapter,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
  ImageAdapter,
  ImageSource,
  ImageContext,
  TransitionMode,
  ResponsiveParameter
} from '@nuxt-photo/core'
```

## `PhotoItem<TMeta>`

```ts
type PhotoItem<TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  id: string | number
  src: string
  width: number
  height: number
  thumbSrc?: string
  alt?: string
  caption?: string
  description?: string
  srcset?: string
  blurhash?: string
  meta?: TMeta
}
```

The data shape every component accepts. `id`, `src`, `width`, `height` are required.

:::read-more{to="/docs/concepts/photo-item" title="PhotoItem concept page"}
:::

## `PhotoAdapter<T>`

```ts
type PhotoAdapter<T = any> = (item: T) => PhotoItem
```

Transforms an external data shape (e.g. a CMS response) into a `PhotoItem`. Pass via the `:photoAdapter` prop of `<PhotoAlbum>`, `<PhotoGroup>`, or `<PhotoCarousel>`.

## `AlbumLayout`

Discriminated union of the three layout variants.

```ts
type RowsAlbumLayout = {
  type: 'rows'
  targetRowHeight?: ResponsiveParameter<number>
}

type ColumnsAlbumLayout = {
  type: 'columns'
  columns?: ResponsiveParameter<number>
}

type MasonryAlbumLayout = {
  type: 'masonry'
  columns?: ResponsiveParameter<number>
}

type AlbumLayout = RowsAlbumLayout | ColumnsAlbumLayout | MasonryAlbumLayout
```

TypeScript enforces that `targetRowHeight` is only valid on `rows` and `columns` is only valid on `columns`/`masonry`.

## `ImageAdapter`

```ts
type ImageAdapter = (
  photo: PhotoItem,
  context: ImageContext
) => ImageSource
```

The contract for routing images through a provider. Receives a photo and the render context, returns the `<img>`-ready source data.

## `ImageSource`

```ts
type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}
```

The return type of `ImageAdapter`. Nuxt Photo copies these attributes onto the rendered `<img>`.

## `ImageContext`

```ts
type ImageContext = 'thumb' | 'slide' | 'preload'
```

Tells an adapter whether the image is being rendered as:

- `'thumb'` — a grid thumbnail (smaller target sizes)
- `'slide'` — a full lightbox slide (viewport-wide sizes)
- `'preload'` — reserved for future preloading support; most adapters treat it the same as `'slide'`.

## `TransitionMode`

```ts
type TransitionMode = 'flip' | 'fade' | 'auto' | 'none'
```

The FLIP transition strategy — `'auto'` (default) picks FLIP when the thumbnail is visible enough, otherwise fades.

:::read-more{to="/docs/concepts/transitions" title="Transitions"}
:::

## `LightboxTransitionOption`

From `@nuxt-photo/vue`.

```ts
import type { LightboxTransitionOption } from '@nuxt-photo/vue'

type LightboxTransitionOption = TransitionMode | {
  mode: TransitionMode
  autoThreshold?: number
}
```

Either a mode string or an object with a custom `autoThreshold` (the intersection ratio above which `'auto'` uses FLIP). Default `autoThreshold` is `0.55`.

## `ResponsiveParameter<T>`

```ts
type ResponsiveParameter<T = number> = T | ((containerWidth: number) => T)
```

A prop value that's either static or responsive to the current container width. Build one with `responsive()`.

:::read-more{to="/docs/concepts/responsive" title="Responsive parameters"}
:::

## `CarouselStyle`

```ts
type CarouselStyle = 'classic' | 'parallax' | 'fade'
```

## `ViewerState`

Internal state machine for the lightbox.

```ts
type ViewerState =
  | { status: 'closed' }
  | { status: 'opening'; activeId: string | number }
  | { status: 'open'; activeId: string | number }
  | { status: 'closing'; activeId: string | number }
```

Exposed via `useLightboxContext` for advanced extension.

## `RectLike` and `AreaMetrics`

```ts
type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

type AreaMetrics = RectLike
```

Bounding-rect shape used throughout the gesture and transition systems.

## `DebugChannel`

```ts
type DebugChannel = 'transitions' | 'gestures' | 'zoom' | 'slides' | 'geometry' | 'rects'
```

Channels you can turn on via the `debug` option to trace specific subsystems during development.

## See also

:::read-more{to="/docs/reference/extension-api" title="Extension API"}
:::

:::read-more{to="/docs/getting-started/configuration" title="Module configuration"}
:::
</file>
<file name="2.css.md" path="/docs/content/docs/6.reference/2.css.md">
---
title: CSS reference
description: Class hooks and CSS variables for theming the default components.
---

Nuxt Photo ships three CSS strategies, controlled by the `css` module option:

```ts [nuxt.config.ts]
nuxtPhoto: {
  css: 'structure' // 'none' | 'structure' | 'all'
}
```

| Value | What's loaded |
| --- | --- |
| `'none'` | No stylesheets. You write every rule yourself. |
| `'structure'` | Layout + geometry only. **Default.** |
| `'all'` | Structure + the default theme (amber-friendly neutral palette). |

## Class naming

Every rendered element uses the `np-` prefix plus BEM-style double-underscore / double-dash notation:

```
.np-album                 → the album root
.np-album--rows           → layout variant modifier
.np-album__item           → each photo wrapper
.np-album__img            → the inner <img>

.np-photo                 → <Photo> root
.np-photo__img
.np-photo__caption

.np-lightbox              → the lightbox root
.np-lightbox__backdrop
.np-lightbox__viewport
.np-lightbox__slide
.np-lightbox__caption
.np-lightbox__btn
.np-lightbox__btn--close
.np-lightbox__ghost       → the FLIP ghost img

.np-carousel              → carousel root
.np-carousel__viewport
.np-carousel__slide
.np-carousel__thumb
.np-carousel__thumb--selected
.np-carousel__dot
.np-carousel__dot--selected
```

You don't need to override these directly — most customization should go through CSS variables (below) and the `itemClass` / `imgClass` / `slideClass` / `controlsClass` props.

## CSS variables

The theme CSS uses variables scoped to the relevant root. Override them globally in your app CSS or per-component.

### Lightbox

```css
.np-lightbox {
  --np-backdrop-bg: rgba(0, 0, 0, 0.85);
  --np-backdrop-blur: 16px;

  --np-btn-radius: 999px;
  --np-btn-bg: rgba(255, 255, 255, 0.1);
  --np-btn-hover-bg: rgba(255, 255, 255, 0.16);
  --np-btn-color: white;
  --np-btn-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 16px 40px rgba(0, 0, 0, 0.24);
  --np-btn-blur: 8px;
  --np-btn-disabled-opacity: 0.45;

  --np-counter-color: rgba(255, 255, 255, 0.72);
  --np-img-radius: 16px;

  --np-caption-color: white;
  --np-caption-heading-size: 22px;
  --np-caption-secondary: rgba(255, 255, 255, 0.72);
}
```

Override any of them in your global CSS:

```css
/* Warmer lightbox chrome */
.np-lightbox {
  --np-backdrop-bg: rgba(40, 20, 10, 0.92);
  --np-btn-bg: rgba(255, 255, 255, 0.08);
  --np-img-radius: 4px;
}
```

### Carousel

```css
.np-carousel {
  --np-carousel-gap: 0.75rem;
  --np-carousel-slide-size: 100%;
  --np-carousel-slide-aspect: 16 / 10;
  --np-carousel-thumb-size: 5.5rem;
  --np-carousel-thumb-gap: 0.5rem;
  --np-carousel-radius: 0.5rem;
  --np-carousel-surface: rgba(0, 0, 0, 0.55);
  --np-carousel-surface-fg: #fff;
  --np-carousel-thumb-border: rgba(0, 0, 0, 0.1);
}
```

Slide size, aspect, and thumb size can also be set via props (`slideSize`, `slideAspect`, `thumbSize`). The prop wins over the variable.

### Album

Albums are mostly structural — spacing and padding come from props. The structure CSS owns layout math; theme CSS is minimal for albums.

## Why `'structure'` is the minimum

The structure CSS encodes layout rules you can't replicate cleanly with Tailwind or utility CSS:

- Rows layout uses a trailing `<span style="flex-grow:9999">` ghost to absorb remaining space.
- Columns and masonry use nested `.np-album__column` children with explicit gap math.
- The lightbox viewport coordinates CSS custom properties set by JavaScript (zoom state, pan offsets, gesture translate).

Setting `css: 'none'` and trying to recreate this is real work. Only do it if you're shipping a completely bespoke gallery CSS system.

## Overriding with `itemClass` / `imgClass` / etc.

Every recipe accepts class-targeting props. They stack onto the default `.np-album__item` et al., so you extend rather than replace:

```vue
<PhotoAlbum
  :photos="photos"
  item-class="rounded-lg overflow-hidden shadow-lg"
  img-class="transition-transform hover:scale-105"
/>
```

Use this for hover states, border treatments, and shadow effects — anything that doesn't need you to hand-roll layout math.

## Scoped styles in your components

Because Vue's scoped styles rewrite class selectors, targeting `.np-album__item` from a `<style scoped>` block won't work directly. Use `:deep()`:

```vue
<style scoped>
.my-album :deep(.np-album__item) {
  border: 2px solid var(--accent);
}
</style>
```

## Turning off everything

```ts [nuxt.config.ts]
nuxtPhoto: {
  css: 'none'
}
```

::callout{icon="i-lucide-triangle-alert"}
Without structure CSS the grid math breaks — photos collapse to zero-size boxes. Only pick `'none'` if you're providing a full replacement.
::

## See also

:::read-more{to="/docs/getting-started/configuration" title="Module configuration"}
:::
</file>
<file name="3.extension-api.md" path="/docs/content/docs/6.reference/3.extension-api.md">
---
title: Extension API
description: Low-level surface for building wrappers, plugins, or alternative front-ends.
---

`@nuxt-photo/vue/extend` exposes internals that aren't part of the default API — they exist for people building custom lightboxes, alternative UI toolkits, or integrations with other libraries.

```ts
import {
  useLightboxContext,
  useLightboxInject,
  provideLightboxContexts,
  // Context types and injection keys
  LightboxContextKey,
  LightboxSlideRendererKey,
  ImageAdapterKey,
  PhotoGroupContextKey,
  LightboxComponentKey,
  LightboxDefaultsKey,
  LightboxSlotsKey,
  type LightboxContext,
  type LightboxConsumerAPI,
  type LightboxRenderState,
  type LightboxDOMBindings,
  type LightboxSlideRenderer,
  type LightboxSlotOverrides,
  type LightboxDefaults,
  type LightboxTransitionOption,
  type PhotoGroupContext
} from '@nuxt-photo/vue/extend'
```

::callout{icon="i-lucide-alert-triangle"}
These symbols have weaker stability guarantees than the public API. We won't break them casually, but if we ship a major version we may refactor the surface — so prefer the public `useLightbox` / `useLightboxProvider` when they do the job.
::

## `useLightboxContext`

```ts
function useLightboxContext(
  photos: MaybeRef<PhotoItem | PhotoItem[]>,
  transition?: LightboxTransitionOption,
  minZoom?: number
): LightboxContext
```

The **full engine** composable — everything `useLightboxProvider` returns, plus the internal state. Use it when you need:

- Direct access to the zoom controller (`ctx.zoom`)
- The pan state and bounds (`ctx.panzoom`)
- Gesture phase tracking (`ctx.gesturePhase`)
- Transition planner output (`ctx.openTransition`, `ctx.closeTransition`)
- The Embla carousel ref (`ctx.emblaRef`, `ctx.emblaApi`)
- Debug channels (`ctx.debug`)

## `useLightboxInject`

```ts
function useLightboxInject(tag: string): LightboxContext
```

The typed injection helper. Every primitive (`<LightboxOverlay>`, `<LightboxViewport>`, …) uses this to pull the current context. The `tag` argument shows up in error messages when the primitive is used outside a provider — keep it human-readable.

```ts
const ctx = useLightboxInject('MyCustomPrimitive')
```

## `provideLightboxContexts`

```ts
function provideLightboxContexts(
  ctx: LightboxContext,
  options?: { resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null }
): void
```

Manually inject a context created by `useLightboxContext`. `useLightboxProvider` calls this for you — reach for it when you're constructing the context in an unusual place (plugin, worker, or a component that splits context creation from context providing).

## Injection keys

Provide any of these to customize behavior globally. Use in a plugin for app-wide defaults:

```ts [plugins/photo.ts]
import {
  ImageAdapterKey,
  LightboxComponentKey,
  LightboxDefaultsKey
} from '@nuxt-photo/vue/extend'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(ImageAdapterKey, myAdapter)
  nuxtApp.vueApp.provide(LightboxComponentKey, MyCustomLightbox)
  nuxtApp.vueApp.provide(LightboxDefaultsKey, { minZoom: 1.2 })
})
```

| Key | Type | Effect |
| --- | --- | --- |
| `ImageAdapterKey` | `ImageAdapter` | Global image adapter. |
| `LightboxComponentKey` | `Component` | Replaces the default internal lightbox app-wide. |
| `LightboxDefaultsKey` | `LightboxDefaults` | Global defaults: `minZoom`, transition options, etc. |
| `LightboxSlideRendererKey` | `(photo: PhotoItem) => LightboxSlideRenderer \| null` | Scoped custom slide renderer. |
| `LightboxSlotsKey` | `ComputedRef<LightboxSlotOverrides>` | Forwarded `#toolbar` / `#caption` / `#slide` slots. |
| `PhotoGroupContextKey` | `PhotoGroupContext` | Internal — used by `<PhotoGroup>` to expose its registration API. |
| `LightboxContextKey` | `LightboxContext` | Internal — the lightbox context itself. |

## Types

### `LightboxContext`

The shape returned by `useLightboxContext`. Composed of three sub-interfaces:

- `LightboxConsumerAPI` — what `useLightbox` exposes (`open`, `close`, `next`, `prev`, `isOpen`, `activeIndex`, `activePhoto`, `count`).
- `LightboxRenderState` — refs the primitives consume (`photos`, `backdropStyle`, `chromeStyle`, `isZoomedIn`, `zoomAllowed`, `mediaOpacity`, `gesturePhase`, …).
- `LightboxDOMBindings` — the pointer/gesture handlers attached to `<LightboxViewport>` and friends (`onMediaPointerDown`, `onWheel`, `setThumbRef`, `handleBackdropClick`, …).

Full type definitions live in `packages/vue/src/provide/keys.ts`.

### `LightboxSlideRenderer`

```ts
type LightboxSlideRenderer = (props: {
  photo: PhotoItem
  index: number
  close: () => Promise<void>
  next: () => void
  prev: () => void
}) => VNode | VNode[] | null
```

A function that returns VNode(s) — the replacement slide content. Register via `useLightboxProvider({ resolveSlide })` or `provide(LightboxSlideRendererKey, …)`.

### `LightboxSlotOverrides`

```ts
type LightboxSlotOverrides = {
  toolbar?: (slotProps: ToolbarSlotProps) => VNode | VNode[]
  caption?: (slotProps: CaptionSlotProps) => VNode | VNode[]
  slide?: (slotProps: SlideSlotProps) => VNode | VNode[]
}
```

The bag forwarded from `<PhotoGroup>` or `<PhotoAlbum>` into the internal lightbox when you use the `#toolbar`, `#caption`, or `#slide` slots on those components.

### `LightboxDefaults`

```ts
type LightboxDefaults = {
  minZoom?: number
  transition?: LightboxTransitionOption
}
```

Values injected at `LightboxDefaultsKey` merge into every lightbox instance unless overridden locally. The module option `nuxtPhoto.lightbox.minZoom` flows through this mechanism.

### `PhotoGroupContext`

The context `<PhotoGroup>` provides to descendant `<Photo>` / `<PhotoAlbum>` components so they can auto-register photos and open the shared lightbox. You don't need to construct this yourself.

## When you shouldn't use this

- If you're just opening a lightbox — use `useLightbox`.
- If you're building a custom lightbox component — use `useLightboxProvider`.
- If you're adding a custom slide — use the `#slide` slot.
- If you're adding a custom adapter — use the `ImageAdapterKey` (covered in the [custom adapter guide](/docs/guides/custom-adapter)).

Reach for this API when the public surface genuinely can't express what you need — e.g. wrapping Nuxt Photo inside another component library, rebuilding the entire lightbox UI around our state machine, or exposing new debugging instrumentation.

## See also

:::read-more{to="/docs/composables/use-lightbox-provider" title="useLightboxProvider"}
:::

:::read-more{to="/docs/components/lightbox-primitives" title="Lightbox primitives"}
:::

:::read-more{to="/docs/reference/types" title="Types reference"}
:::
</file>
<file name="4.bundle-size.md" path="/docs/content/docs/6.reference/4.bundle-size.md">
---
navigation:
  title: Bundle Size
title: Bundle size and tree-shaking
description: How Nuxt Photo measures client bundle impact across core, Vue, and Nuxt usage paths.
---

Nuxt Photo reports bundle size the modern way: by measuring what a consumer import adds to a production bundle.

We do **not** treat npm publish size or raw `dist/` output as the primary number. Those numbers are easy to quote and easy to misuse.

## What we measure

The repo ships a size harness behind `pnpm size` with three measurement modes:

- **`@nuxt-photo/core`** uses `size-limit` for stable CI checks on direct library entrypoints.
- **`@nuxt-photo/vue`** uses tiny Vite fixtures, because the public surface includes Vue SFC exports and should be measured with a Vue-aware bundler.
- **`@nuxt-photo/nuxt`** uses tiny Nuxt fixtures and reports the emitted client-bundle delta versus a baseline app.

This keeps the measurement aligned with how each layer is actually consumed.

## Current reference numbers

These numbers come from the in-repo harness and are expected to move over time. The current thresholds are stored in the repo and re-checked in CI.

| Surface | Scenario | Current brotli |
| --- | --- | ---: |
| `@nuxt-photo/core` | `import { responsive }` | `283 B` |
| `@nuxt-photo/core` | `import * as core` | `6.86 kB` |
| `@nuxt-photo/vue` | `import { PhotoImage }` | `718 B` |
| `@nuxt-photo/vue` | `import { useLightbox }` | `17.8 kB` |
| `@nuxt-photo/vue` | `import * as NuxtPhoto` | `20.1 kB` |
| `@nuxt-photo/nuxt` | module enabled, no usage | effectively flat in the current fixture |
| `@nuxt-photo/nuxt` | one `PhotoImage` usage | `+292 B` over baseline |

## How to interpret them

- Prefer the number for the exact surface you plan to import.
- Treat `core` and focused Vue primitives as the low-overhead path.
- Treat `useLightbox` as the real lightbox engine cost, not as a helper utility.
- Treat `<PhotoCarousel>` separately from the lightbox and image primitives. It uses full Embla, so it is intentionally a richer import path.

## Commands

```bash
pnpm size
pnpm size:core
pnpm size:vue
pnpm size:nuxt
pnpm size:analyze
```

- `pnpm size` runs the full report.
- `pnpm size:analyze` writes analyzer output to `test-results/size-analyze` for debugging regressions.

## Policy

When we talk about size in docs, we prefer statements like:

- “`PhotoImage` is currently about `718 B` brotli in the fixture build.”
- “Enabling the Nuxt module alone is effectively flat in the current fixture.”
- “`PhotoCarousel` uses full Embla and should be evaluated as a richer carousel feature.”

We avoid statements like:

- “Nuxt Photo is only X kB.”
- “The whole library is tree-shaken to almost nothing.”

Those are too coarse to be trustworthy.
</file>
<file name=".navigation.yml" path="/docs/content/docs/.navigation.yml">
title: Docs
icon: i-lucide-book
</file>
<file name="index.md" path="/docs/content/index.md">
---
title: "Photo galleries for Nuxt."
navigation: false
description: "Justified albums, a shared lightbox with pinch-to-zoom, an Embla-powered carousel, and headless primitives — auto-imported into any Nuxt 3 or 4 app."
seo:
  ogImage: '/social-card.png'
---

::u-page-hero
---
orientation: 'horizontal'
ui:
  container: 'lg:items-start'
---
#headline
  :::u-button
  ---
  size: sm
  to: /docs/getting-started/introduction
  variant: outline
  trailing-icon: i-lucide-arrow-right
  ---
  Albums, lightbox, carousel, primitives — for Nuxt
  :::

#title
Photo galleries for Nuxt, [done right]{.text-primary}.

#description
Nuxt Photo drops in a single module and gives you justified row layouts, shared lightbox with pinch-to-zoom, and an Embla carousel — all SSR-safe and wired to `@nuxt/image` when you need it.

#links
  :::u-button
  ---
  size: lg
  to: /docs/getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :u-input-copy{value="npx nuxi module add @nuxt-photo/nuxt"}

#default
::tabs{class="xl:-mt-10"}
  :::tabs-item{label="Album" icon="i-lucide-grid-3x3"}
  ```vue
  <script setup lang="ts">
  import type { PhotoItem } from '@nuxt-photo/core'

  const photos: PhotoItem[] = [
    { id: '1', src: '/photos/desert.jpg', width: 1280, height: 800, alt: 'Desert' },
    { id: '2', src: '/photos/ocean.jpg', width: 960, height: 1200, alt: 'Ocean' }
  ]
  </script>

  <template>
    <PhotoAlbum :photos="photos" layout="rows" :target-row-height="240" />
  </template>
  ```
  :::
  :::tabs-item{label="Photo" icon="i-lucide-image"}
  ```vue
  <template>
    <Photo
      :photo="{
        id: 'hero',
        src: '/photos/hero.jpg',
        width: 1600,
        height: 1000,
        alt: 'Hero image'
      }"
      lightbox
    />
  </template>
  ```
  :::
  :::tabs-item{label="Group" icon="i-lucide-layers"}
  ```vue
  <template>
    <!-- One lightbox, shared across both albums -->
    <PhotoGroup>
      <PhotoAlbum :photos="landscape" layout="rows" />
      <PhotoAlbum :photos="studies" layout="rows" />
    </PhotoGroup>
  </template>
  ```
  :::
  :::tabs-item{label="Carousel" icon="i-lucide-images"}
  ```vue
  <template>
    <PhotoCarousel
      :photos="photos"
      :options="{ loop: true }"
      show-thumbnails
      :lightbox="true"
    />
  </template>
  ```
  :::
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
Justified rows, in one line

#description
Drop `<PhotoAlbum>` with a photo array. The layout algorithm keeps rows visually balanced across every breakpoint, the lightbox opens with a FLIP transition, and zoom-and-pan work on touch.

#default
::demo-album-rows
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
One lightbox, many albums

#description
Wrap any number of `<PhotoAlbum>` in a `<PhotoGroup>` and they share a single lightbox. Click a photo in either album below — navigation flows across both.

#default
::demo-group
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
Carousel with a lightbox on top

#description
`<PhotoCarousel>` wraps Embla with first-class support for thumbnails, counter, autoplay, and a lightbox overlay. Works on desktop and touch.

#default
::demo-carousel
::
::

::u-container
  :::u-page-grid{class="pb-12 xl:pb-24"}
    :::landing-feature
    ---
    title: Justified rows, columns, masonry
    description: Three built-in layouts with responsive breakpoints and function-based spacing.
    icon: i-lucide-layout-grid
    to: /docs/components/photo-album
    ---
    :::
    :::landing-feature
    ---
    title: Shared lightbox
    description: One `<PhotoGroup>` lets any number of albums share a single lightbox and navigation.
    icon: i-lucide-layers
    to: /docs/components/photo-group
    ---
    :::
    :::landing-feature
    ---
    title: Pinch, pan, zoom
    description: Touch-first lightbox with spring physics, pinch-to-zoom, pan, and swipe-to-dismiss.
    icon: i-lucide-hand
    to: /docs/concepts/transitions
    ---
    :::
    :::landing-feature
    ---
    title: Embla carousel
    description: A carousel with thumbnails, counter, autoplay, and lightbox integration out of the box.
    icon: i-lucide-images
    to: /docs/components/photo-carousel
    ---
    :::
    :::landing-feature
    ---
    title: @nuxt/image ready
    description: Detects `@nuxt/image`, routes all images through it, and emits proper `srcset` and `sizes`.
    icon: i-lucide-image
    to: /docs/concepts/image-providers
    ---
    :::
    :::landing-feature
    ---
    title: Headless primitives
    description: Build your own layout or custom lightbox with the same primitives the recipes ship on.
    icon: i-lucide-blocks
    to: /docs/guides/custom-lightbox
    ---
    :::
  :::
::

::page-section-cta
::
</file>
<file name="collection.ts" path="/packages/core/src/collection/collection.ts">
import { getLoopedIndex } from '../geometry/rect'

export type CollectionItem = { id: string | number }

export interface Collection<T extends CollectionItem> {
  readonly items: readonly T[]
  readonly count: number
  getByIndex(index: number): T | undefined
  getById(id: string | number): T | undefined
  indexOfId(id: string | number): number
  next(currentIndex: number, wrap?: boolean): number
  prev(currentIndex: number, wrap?: boolean): number
  preloadCandidates(currentIndex: number, range?: number): T[]
}

export function createCollection<T extends CollectionItem>(items: readonly T[]): Collection<T> {
  const idToIndex = new Map<string | number, number>()
  for (let i = 0; i < items.length; i++) {
    idToIndex.set(items[i]!.id, i)
  }

  return {
    items,
    count: items.length,

    getByIndex(index: number): T | undefined {
      return items[index]
    },

    getById(id: string | number): T | undefined {
      const index = idToIndex.get(id)
      return index !== undefined ? items[index] : undefined
    },

    indexOfId(id: string | number): number {
      return idToIndex.get(id) ?? -1
    },

    next(currentIndex: number, wrap = true): number {
      if (items.length === 0) return -1
      if (wrap) return getLoopedIndex(currentIndex + 1, items.length)
      return Math.min(currentIndex + 1, items.length - 1)
    },

    prev(currentIndex: number, wrap = true): number {
      if (items.length === 0) return -1
      if (wrap) return getLoopedIndex(currentIndex - 1, items.length)
      return Math.max(currentIndex - 1, 0)
    },

    preloadCandidates(currentIndex: number, range = 1): T[] {
      const candidates: T[] = []
      for (let offset = 1; offset <= range; offset++) {
        const nextIdx = getLoopedIndex(currentIndex + offset, items.length)
        const prevIdx = getLoopedIndex(currentIndex - offset, items.length)
        if (items[nextIdx]) candidates.push(items[nextIdx])
        if (prevIdx !== nextIdx && items[prevIdx]) candidates.push(items[prevIdx])
      }
      return candidates
    },
  }
}
</file>
<file name="index.ts" path="/packages/core/src/collection/index.ts">
export { createCollection, type Collection, type CollectionItem } from './collection'
</file>
<file name="index.ts" path="/packages/core/src/debug/index.ts">
export { createDebug, type DebugLogger, type DebugFlags } from './logger'
</file>
<file name="logger.ts" path="/packages/core/src/debug/logger.ts">
import type { DebugChannel } from '../types'

export type DebugFlags = Record<DebugChannel, boolean> & { all: boolean }

export type DebugLogger = {
  flags: DebugFlags
  log: (channel: DebugChannel, ...args: unknown[]) => void
  warn: (channel: DebugChannel, ...args: unknown[]) => void
  table: (channel: DebugChannel, data: Record<string, unknown>) => void
  group: (channel: DebugChannel, label: string) => void
  groupEnd: (channel: DebugChannel) => void
}

const CHANNEL_COLORS: Record<DebugChannel, string> = {
  transitions: '#a78bfa',
  gestures: '#34d399',
  zoom: '#fbbf24',
  slides: '#60a5fa',
  geometry: '#f87171',
  rects: '#fb923c',
}

export function createDebug(): DebugLogger {
  const flags: DebugFlags = {
    transitions: false,
    gestures: false,
    zoom: false,
    slides: false,
    geometry: false,
    rects: false,
    all: false,
  }

  function isEnabled(channel: DebugChannel): boolean {
    return flags.all || flags[channel]
  }

  function prefix(channel: DebugChannel): string[] {
    const color = CHANNEL_COLORS[channel]
    return [
      `%c[lightbox:${channel}]`,
      `color: ${color}; font-weight: bold`,
    ]
  }

  function log(channel: DebugChannel, ...args: unknown[]) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.log(fmt, style, ...args)
  }

  function warn(channel: DebugChannel, ...args: unknown[]) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.warn(fmt, style, ...args)
  }

  function table(channel: DebugChannel, data: Record<string, unknown>) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.log(fmt, style)
    console.table(data)
  }

  function group(channel: DebugChannel, label: string) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.groupCollapsed(`${fmt} ${label}`, style)
  }

  function groupEnd(channel: DebugChannel) {
    if (!isEnabled(channel)) return
    console.groupEnd()
  }

  return { flags, log, warn, table, group, groupEnd }
}
</file>
<file name="body-scroll.ts" path="/packages/core/src/dom/body-scroll.ts">
let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

export function lockBodyScroll(locked: boolean): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (locked) {
    lockCount++
    if (lockCount === 1) {
      savedOverflow = document.body.style.overflow
      savedPaddingRight = document.body.style.paddingRight

      const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
      const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0

      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    }
    return
  }

  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow
    document.body.style.paddingRight = savedPaddingRight
  }
}
</file>
<file name="index.ts" path="/packages/core/src/dom/index.ts">
export { wait, nextFrame } from './timing'
export { lockBodyScroll } from './body-scroll'
</file>
<file name="timing.ts" path="/packages/core/src/dom/timing.ts">
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}
</file>
<file name="index.ts" path="/packages/core/src/geometry/index.ts">
export { isUsableRect, getLoopedIndex, fitRect, flipTransform, makeGhostBaseStyle, rubberband } from './rect'
</file>
<file name="rect.ts" path="/packages/core/src/geometry/rect.ts">
import type { RectLike } from '../types'

export function isUsableRect(rect: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null): boolean {
  if (!rect) return false
  if (rect.width < 24 || rect.height < 24) return false
  if (rect.bottom < 0 || rect.right < 0) return false
  if (typeof window !== 'undefined') {
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false
  }
  return true
}

export function getLoopedIndex(index: number, length: number): number {
  return (index + length) % length
}

export function fitRect(container: RectLike, aspect: number): RectLike {
  let width = container.width
  let height = width / aspect

  if (height > container.height) {
    height = container.height
    width = height * aspect
  }

  return {
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
    width,
    height,
  }
}

export function flipTransform(from: RectLike, to: RectLike): string {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = from.width / to.width
  const sy = from.height / to.height
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

export function makeGhostBaseStyle(to: RectLike): Record<string, string> {
  return {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  }
}

export function rubberband(value: number, min: number, max: number): number {
  if (value < min) {
    return min + (value - min) * 0.2
  }

  if (value > max) {
    return max + (value - max) * 0.2
  }

  return value
}
</file>
<file name="adapter.ts" path="/packages/core/src/image/adapter.ts">
import type { ImageAdapter, ImageSource, PhotoItem } from '../types'
import { round } from '../utils/math'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 * Returns the same singleton instance on every call.
 */
const _nativeAdapter: ImageAdapter = (photo: PhotoItem, context): ImageSource => {
  if (context === 'thumb' && photo.thumbSrc) {
    return {
      src: photo.thumbSrc,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: photo.src,
    srcset: photo.srcset,
    width: photo.width,
    height: photo.height,
  }
}

export function createNativeImageAdapter(): ImageAdapter {
  return _nativeAdapter
}

/**
 * Compute an `<img sizes>` string for a photo rendered within a justified-rows layout.
 *
 * The default size uses the photo's fraction of the container:
 * `calc((containerSize - gaps) / divisor)` where `divisor = containerWidth / photoWidth`.
 *
 * Viewport-specific overrides (e.g. `(max-width: 600px) 100vw`) are prepended in order
 * so the browser matches the first one that applies.
 *
 * Returns `undefined` when `responsiveSizes` is not provided so callers can fall back to
 * adapter-computed sizes without extra checks.
 */
export function computePhotoSizes(
  photoWidth: number,
  containerWidth: number,
  itemsInRow: number,
  spacing: number,
  padding: number,
  responsiveSizes?: {
    /** CSS size of the album container, e.g. `'100vw'` or `'calc(100vw - 240px)'`. */
    size: string
    /** Optional viewport-specific overrides, listed from smallest to largest breakpoint. */
    sizes?: Array<{ viewport: string; size: string }>
  },
): string | undefined {
  if (!responsiveSizes) return undefined

  const gaps = spacing * (itemsInRow - 1) + 2 * padding * itemsInRow
  const divisor = round((containerWidth - gaps) / photoWidth, 5)
  const defaultSize = `calc((${responsiveSizes.size} - ${gaps}px) / ${divisor})`

  if (!responsiveSizes.sizes?.length) return defaultSize

  const parts = responsiveSizes.sizes.map(({ viewport, size }) => `${viewport} ${size}`)
  parts.push(defaultSize)
  return parts.join(', ')
}
</file>
<file name="index.ts" path="/packages/core/src/image/index.ts">
export { ensureImageLoaded } from './loader'
export { createNativeImageAdapter, computePhotoSizes } from './adapter'
</file>
<file name="loader.ts" path="/packages/core/src/image/loader.ts">
const MAX_CACHE_SIZE = 500
const imageLoadCache = new Map<string, Promise<void>>()

export function ensureImageLoaded(src: string): Promise<void> {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => {
      imageLoadCache.delete(src)
      resolve()
    }
    image.src = src

    if (image.decode) {
      image.decode().catch(() => { imageLoadCache.delete(src) }).finally(resolve)
      return
    }

    if (image.complete) {
      resolve()
    }
  })

  imageLoadCache.set(src, promise)
  if (imageLoadCache.size > MAX_CACHE_SIZE) {
    imageLoadCache.delete(imageLoadCache.keys().next().value!)
  }
  return promise
}
</file>
<file name="containerQueries.ts" path="/packages/core/src/layout/rows/containerQueries.ts">
import { computeRowsLayout } from './index'
import { round } from '../../utils/math'
import { resolveResponsiveParameter } from '../../types'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../../types'

export interface BreakpointStylesOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  targetRowHeight?: ResponsiveParameter<number>
  containerName: string
}

function rowSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries[g.entries.length - 1]!.index).join(',')
}

/**
 * Generates CSS `@container` rules for each unique Knuth-Plass row layout across the provided
 * breakpoints. Adjacent breakpoints that produce identical row assignments are deduplicated into
 * a single rule — this is mathematically valid because the `calc()` divisor equals
 * `totalAspectRatio / ratio(photo)`, which is independent of container width.
 *
 * The output is scoped to `containerName` so multiple albums on the same page never conflict.
 * Items must carry class `np-item-{index}` for the rules to apply.
 */
export function computeBreakpointStyles(opts: BreakpointStylesOptions): string {
  const { photos, containerName } = opts
  if (photos.length === 0 || opts.breakpoints.length === 0) return ''

  const sorted = [...opts.breakpoints].filter(bp => bp > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return ''

  // 1. Compute layout at each breakpoint
  type BpEntry = { bp: number; sig: string; groups: LayoutGroup[] }
  const bpEntries: BpEntry[] = []
  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const targetRowHeight = resolveResponsiveParameter(opts.targetRowHeight, bp, 300)
    const groups = computeRowsLayout({ photos, containerWidth: bp, spacing, padding, targetRowHeight })
    if (groups.length === 0 && photos.length > 0) continue
    bpEntries.push({ bp, sig: rowSignature(groups), groups })
  }
  if (bpEntries.length === 0) return ''

  // 2. Collapse adjacent identical layouts into spans
  type Span = { sig: string; fromIdx: number; toIdx: number; groups: LayoutGroup[]; sampleBp: number }
  const spans: Span[] = []
  for (let i = 0; i < bpEntries.length; i++) {
    const e = bpEntries[i]!
    const last = spans[spans.length - 1]
    if (last && last.sig === e.sig) {
      last.toIdx = i
    }
    else {
      spans.push({ sig: e.sig, fromIdx: i, toIdx: i, groups: e.groups, sampleBp: e.bp })
    }
  }

  // 3. Generate CSS rules for each unique span
  const rules: string[] = []
  for (let s = 0; s < spans.length; s++) {
    const span = spans[s]!
    const isFirst = s === 0
    const isLast = s === spans.length - 1
    const sampleBp = span.sampleBp

    const spacing = resolveResponsiveParameter(opts.spacing, sampleBp, 8)
    const padding = resolveResponsiveParameter(opts.padding, sampleBp, 0)

    // Build the @container condition
    let condition: string
    if (spans.length === 1) {
      // Single span: bare @container — always applies within this container
      condition = containerName
    }
    else if (isFirst) {
      const nextBp = bpEntries[span.toIdx + 1]!.bp
      condition = `${containerName} (max-width: ${nextBp - 1}px)`
    }
    else if (isLast) {
      const fromBp = bpEntries[span.fromIdx]!.bp
      condition = `${containerName} (min-width: ${fromBp}px)`
    }
    else {
      const fromBp = bpEntries[span.fromIdx]!.bp
      const nextBp = bpEntries[span.toIdx + 1]!.bp
      condition = `${containerName} (min-width: ${fromBp}px) and (max-width: ${nextBp - 1}px)`
    }

    const itemRules: string[] = []
    for (const group of span.groups) {
      for (const entry of group.entries) {
        const gaps = spacing * (entry.itemsCount - 1) + 2 * padding * entry.itemsCount
        const divisor = round((sampleBp - gaps) / entry.width, 5)
        const paddingPart = padding > 0 ? `padding:${padding}px;` : ''
        itemRules.push(
          `.np-item-${entry.index}{flex:0 0 auto;box-sizing:content-box;${paddingPart}overflow:hidden;width:calc((100% - ${gaps}px) / ${divisor})}`,
        )
      }
    }

    rules.push(`@container ${condition}{\n${itemRules.join('\n')}\n}`)
  }

  return rules.join('\n')
}
</file>
<file name="helpers.ts" path="/packages/core/src/layout/rows/helpers.ts">
import type { PhotoItem } from '../../types'
import { round } from '../../utils/math'

export function ratio(item: PhotoItem) {
  return item.width / item.height
}

export function findIdealNodeSearch(
  items: PhotoItem[],
  targetRowHeight: number,
  containerWidth: number,
) {
  const minRatio = items.reduce(
    (acc, item) => Math.min(acc, ratio(item)),
    Number.MAX_VALUE,
  )
  return round(containerWidth / targetRowHeight / minRatio) + 2
}

export function getCommonHeight(
  row: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return rowWidth / totalAspectRatio
}

export function cost(
  items: PhotoItem[],
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const row = items.slice(start, end)
  const commonHeight = getCommonHeight(row, width, spacing, padding)
  if (commonHeight <= 0) return undefined
  return (commonHeight - targetRowHeight) ** 2 * row.length
}
</file>
<file name="index.ts" path="/packages/core/src/layout/rows/index.ts">
import type { LayoutGroup, RowsLayoutOptions } from '../../types'
import { validatePhotoDimensions } from '../types'
import { findRowBreaks } from './knuthPlass'
import { pathToGroups } from './pathToGroups'

export function computeRowsLayout(options: RowsLayoutOptions): LayoutGroup[] {
  const {
    containerWidth,
    spacing = 8,
    padding = 0,
    targetRowHeight = 300,
  } = options

  const photos = validatePhotoDimensions(options.photos)

  if (photos.length === 0) return []

  const path = findRowBreaks(photos, containerWidth, targetRowHeight, spacing, padding)
  if (path === undefined) return []

  return pathToGroups(path, photos, containerWidth, spacing, padding)
}
</file>
<file name="knuthPlass.ts" path="/packages/core/src/layout/rows/knuthPlass.ts">
import type { PhotoItem } from '../../types'
import { cost, findIdealNodeSearch } from './helpers'

/**
 * Knuth-Plass DP — O(N·K) with typed arrays.
 * Globally optimal like Dijkstra but with no heap or graph overhead.
 * dp[i] = minimum total cost for laying out photos[0..i-1].
 */
export function findRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const N = photos.length
  if (N === 0) return undefined

  const limitNodeSearch = findIdealNodeSearch(photos, targetRowHeight, containerWidth)

  const minCost = new Float64Array(N + 1).fill(Infinity)
  const pointers = new Int32Array(N + 1).fill(0)
  minCost[0] = 0

  for (let i = 1; i <= N; i++) {
    const start = Math.max(0, i - limitNodeSearch)
    for (let j = i - 1; j >= start; j--) {
      const currentCost = cost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
      if (currentCost === undefined) continue

      const totalCost = minCost[j]! + currentCost
      if (totalCost < minCost[i]!) {
        minCost[i] = totalCost
        pointers[i] = j
      }
    }
  }

  if (minCost[N] === Infinity) return undefined

  // Reconstruct path by walking backwards
  const path: number[] = []
  let curr = N
  while (curr > 0) {
    path.push(curr)
    curr = pointers[curr]!
  }
  path.push(0)
  path.reverse()

  return path
}
</file>
<file name="pathToGroups.ts" path="/packages/core/src/layout/rows/pathToGroups.ts">
import type { LayoutGroup, PhotoItem } from '../../types'
import { getCommonHeight, ratio } from './helpers'

export function pathToGroups(
  path: number[],
  photos: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
): LayoutGroup[] {
  const groups: LayoutGroup[] = []

  for (let rowIndex = 1; rowIndex < path.length; rowIndex += 1) {
    const rowItems = photos
      .map((photo, index) => ({ photo, index }))
      .slice(path[rowIndex - 1], path[rowIndex])

    const height = getCommonHeight(
      rowItems.map(({ photo }) => photo),
      containerWidth,
      spacing,
      padding,
    )

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries: rowItems.map(({ photo, index }, positionIndex) => ({
        index,
        photo,
        width: height * ratio(photo),
        height,
        positionIndex,
        itemsCount: rowItems.length,
      })),
    })
  }

  return groups
}
</file>
<file name="columns.ts" path="/packages/core/src/layout/columns.ts">
import type { ColumnsLayoutOptions, LayoutEntry, LayoutGroup, PhotoItem } from '../types'
import { validatePhotoDimensions } from './types'
import { findShortestPathLengthN, type GraphFunction } from './shortestPath'

function ratio(item: PhotoItem) {
  return item.width / item.height
}

function makeGetColumnNeighbors({
  items,
  spacing,
  padding,
  targetColumnWidth,
  targetColumnHeight,
}: {
  items: PhotoItem[]
  spacing: number
  padding: number
  targetColumnWidth: number
  targetColumnHeight: number
}): GraphFunction<number> {
  return (node: number) => {
    const results: Array<{ neighbor: number; weight: number }> = []
    const cutOffHeight = targetColumnHeight * 1.5
    const firstItem = items[node]
    if (!firstItem) return results

    let height = targetColumnWidth / ratio(firstItem) + 2 * padding

    for (let index = node + 1; index < items.length + 1; index += 1) {
      results.push({
        neighbor: index,
        weight: (targetColumnHeight - height) ** 2,
      })

      if (height > cutOffHeight || index === items.length) break

      const nextItem = items[index]
      if (!nextItem) break

      height += targetColumnWidth / ratio(nextItem) + spacing + 2 * padding
    }

    return results
  }
}

function computeColumnsModel(
  items: PhotoItem[],
  columns: number,
  containerWidth: number,
  spacing: number,
  padding: number,
  targetColumnWidth: number,
): { columnsGaps: number[]; columnsRatios: number[]; columnGroups: { photo: PhotoItem; index: number }[][] } | undefined {
  const columnsGaps: number[] = []
  const columnsRatios: number[] = []

  if (items.length <= columns) {
    const averageRatio = items.length > 0
      ? items.reduce((acc, item) => acc + ratio(item), 0) / items.length
      : 1

    for (let col = 0; col < columns; col++) {
      columnsGaps[col] = 2 * padding
      columnsRatios[col] = col < items.length && items[col] ? ratio(items[col]!) : averageRatio
    }

    const path = Array.from({ length: columns + 1 }, (_, i) => Math.min(i, items.length))
    const columnGroups = buildColumnGroups(path, items)
    return { columnsGaps, columnsRatios, columnGroups }
  }

  const targetColumnHeight = (
    items.reduce((acc, item) => acc + targetColumnWidth / ratio(item), 0)
    + spacing * (items.length - columns)
    + 2 * padding * items.length
  ) / columns

  const path = findShortestPathLengthN(
    makeGetColumnNeighbors({ items, targetColumnWidth, targetColumnHeight, spacing, padding }),
    columns,
    0,
    items.length,
  )

  for (let col = 0; col < path.length - 1; col++) {
    const columnItems = items.slice(path[col], path[col + 1])
    columnsGaps[col] = spacing * (columnItems.length - 1) + 2 * padding * columnItems.length
    columnsRatios[col] = 1 / columnItems.reduce((acc, item) => acc + 1 / ratio(item), 0)
  }

  const columnGroups = buildColumnGroups(path, items)
  return { columnsGaps, columnsRatios, columnGroups }
}

function buildColumnGroups(path: number[], items: PhotoItem[]) {
  const groups: { photo: PhotoItem; index: number }[][] = []
  for (let col = 0; col < path.length - 1; col++) {
    groups.push(
      items.slice(path[col], path[col + 1]).map((photo, i) => ({
        photo,
        index: path[col]! + i,
      })),
    )
  }
  return groups
}

/**
 * Columns layout — distributes photos into balanced columns using
 * shortest-path algorithm for optimal distribution. Returns LayoutGroup[]
 * with columnsGaps and columnsRatios metadata for CSS calc() widths.
 */
export function computeColumnsLayout(options: ColumnsLayoutOptions): LayoutGroup[] {
  const { containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || columns < 1) return []

  const targetColumnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns

  const result = computeColumnsModel(photos, columns, containerWidth, spacing, padding, targetColumnWidth)
  if (!result) return []

  const totalRatio = result.columnsRatios.reduce((acc, r) => acc + r, 0)

  const groups: LayoutGroup[] = []
  for (let col = 0; col < result.columnGroups.length; col++) {
    const columnItems = result.columnGroups[col]!
    if (columnItems.length === 0) continue

    const totalAdjustedGaps = result.columnsRatios.reduce(
      (acc, colRatio, ratioIndex) =>
        acc + ((result.columnsGaps[col] ?? 0) - (result.columnsGaps[ratioIndex] ?? 0)) * colRatio,
      0,
    )

    const columnWidth = (
      (containerWidth - (result.columnGroups.length - 1) * spacing - 2 * result.columnGroups.length * padding - totalAdjustedGaps)
      * (result.columnsRatios[col] ?? 0)
    ) / totalRatio

    const entries: LayoutEntry[] = columnItems.map(({ photo, index }, positionIndex) => ({
      index,
      photo,
      width: columnWidth,
      height: columnWidth / ratio(photo),
      positionIndex,
      itemsCount: columnItems.length,
    }))

    if (entries.some(e => e.width <= 0 || e.height <= 0)) {
      if (columns > 1) {
        return computeColumnsLayout({ ...options, columns: columns - 1 })
      }
      return []
    }

    groups.push({
      type: 'column',
      index: col,
      entries,
      columnsGaps: result.columnsGaps,
      columnsRatios: result.columnsRatios,
    })
  }

  return groups
}
</file>
<file name="columnsContainerQueries.ts" path="/packages/core/src/layout/columnsContainerQueries.ts">
import { computeColumnsLayout } from './columns'
import { resolveResponsiveParameter } from '../types'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../types'

export interface ColumnsBreakpointSnapshot {
  /** Stable key used as `data-bp` attribute, e.g. "320-639", "1120-inf" */
  spanKey: string
  /** `@container` condition text without the "@container <name>" prefix, e.g. "(min-width: 600px) and (max-width: 1119px)" */
  condition: string
  /** Sample breakpoint width used when computing this snapshot */
  containerWidth: number
  /** Resolved spacing at this breakpoint */
  spacing: number
  /** Resolved padding at this breakpoint */
  padding: number
  /** Layout groups produced by `computeColumnsLayout` at `containerWidth` */
  groups: LayoutGroup[]
}

export interface ColumnsBreakpointSnapshotsOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}

function groupSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries.map(e => e.index).join('.')).join('|')
}

/**
 * Computes per-breakpoint `columns` layout snapshots for SSR.
 * Adjacent breakpoints are merged only when group assignment, spacing, and padding all match.
 */
export function computeColumnsBreakpointSnapshots(
  opts: ColumnsBreakpointSnapshotsOptions,
): ColumnsBreakpointSnapshot[] {
  if (opts.photos.length === 0 || opts.breakpoints.length === 0) return []

  const sorted = [...opts.breakpoints].filter(bp => bp > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return []

  type Entry = { bp: number; sig: string; groups: LayoutGroup[]; spacing: number; padding: number }
  const entries: Entry[] = []
  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const columns = resolveResponsiveParameter(opts.columns, bp, 3)
    const groups = computeColumnsLayout({ photos: opts.photos, containerWidth: bp, spacing, padding, columns })
    if (groups.length === 0) continue
    entries.push({ bp, sig: groupSignature(groups), groups, spacing, padding })
  }
  if (entries.length === 0) return []

  type Span = { fromIdx: number; toIdx: number; sig: string; spacing: number; padding: number; groups: LayoutGroup[] }
  const spans: Span[] = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!
    const last = spans[spans.length - 1]
    if (last && last.sig === e.sig && last.spacing === e.spacing && last.padding === e.padding) {
      last.toIdx = i
    }
    else {
      spans.push({ fromIdx: i, toIdx: i, sig: e.sig, spacing: e.spacing, padding: e.padding, groups: e.groups })
    }
  }

  return spans.map((span, s) => {
    const isFirst = s === 0
    const isLast = s === spans.length - 1
    const fromBp = entries[span.fromIdx]!.bp
    const nextBp = !isLast ? entries[spans[s + 1]!.fromIdx]!.bp : null

    let spanKey: string
    let condition: string
    if (spans.length === 1) {
      spanKey = 'bp-all'
      condition = ''
    }
    else if (isFirst) {
      spanKey = `bp-0-${nextBp! - 1}`
      condition = `(max-width: ${nextBp! - 1}px)`
    }
    else if (isLast) {
      spanKey = `bp-${fromBp}-inf`
      condition = `(min-width: ${fromBp}px)`
    }
    else {
      spanKey = `bp-${fromBp}-${nextBp! - 1}`
      condition = `(min-width: ${fromBp}px) and (max-width: ${nextBp! - 1}px)`
    }

    return {
      spanKey,
      condition,
      containerWidth: fromBp,
      spacing: span.spacing,
      padding: span.padding,
      groups: span.groups,
    }
  })
}
</file>
<file name="index.ts" path="/packages/core/src/layout/index.ts">
export { computeRowsLayout } from './rows/index'
export { computeBreakpointStyles } from './rows/containerQueries'
export type { BreakpointStylesOptions } from './rows/containerQueries'
export { computeColumnsLayout } from './columns'
export { computeMasonryLayout } from './masonry'
export { computeColumnsBreakpointSnapshots } from './columnsContainerQueries'
export type {
  ColumnsBreakpointSnapshot,
  ColumnsBreakpointSnapshotsOptions,
} from './columnsContainerQueries'
export { computeMasonryBreakpointSnapshots } from './masonryContainerQueries'
export type {
  MasonryBreakpointSnapshot,
  MasonryBreakpointSnapshotsOptions,
} from './masonryContainerQueries'
export { computeBreakpointVisibilityCSS } from './snapshotVisibility'
export type { SnapshotVisibilityInput } from './snapshotVisibility'
</file>
<file name="masonry.ts" path="/packages/core/src/layout/masonry.ts">
import type { LayoutEntry, LayoutGroup, MasonryLayoutOptions } from '../types'
import { validatePhotoDimensions } from './types'

/**
 * Masonry layout — places photos into equal-width columns using greedy
 * shortest-column assignment with local search optimization to flatten
 * the bottom edge. Chronological order is preserved within each column.
 * Returns LayoutGroup[] for flexbox rendering.
 */
export function computeMasonryLayout(options: MasonryLayoutOptions): LayoutGroup[] {
  const { containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || columns < 1) return []

  const columnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
  const photoHeights = photos.map(p => columnWidth / (p.width / p.height))

  const colItems: number[][] = Array.from({ length: columns }, () => [])
  const colHeights: number[] = new Array(columns).fill(0)

  for (let i = 0; i < photos.length; i++) {
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    colItems[shortest]!.push(i)
    colHeights[shortest]! += photoHeights[i]! + spacing
  }

  // Local search optimization — minimize max-min column height delta
  let improved = true
  let iterations = 0
  while (improved && iterations < 50) {
    improved = false
    iterations++
    let tallest = 0
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! > colHeights[tallest]!) tallest = c
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    const currentDelta = colHeights[tallest]! - colHeights[shortest]!
    if (currentDelta <= 2) break

    let bestMove: { type: 'transfer'; idx: number; pos: number } | { type: 'swap'; tPos: number; sPos: number } | null = null
    let bestReduction = 0

    for (let i = 0; i < colItems[tallest]!.length; i++) {
      const item = colItems[tallest]![i]!
      const h = photoHeights[item]! + spacing
      const newTH = colHeights[tallest]! - h
      const newSH = colHeights[shortest]! + h
      let newMax = newTH
      let newMin = newSH
      for (let c = 0; c < columns; c++) {
        if (c === tallest || c === shortest) continue
        if (colHeights[c]! > newMax) newMax = colHeights[c]!
        if (colHeights[c]! < newMin) newMin = colHeights[c]!
      }
      const reduction = currentDelta - (newMax - newMin)
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestMove = { type: 'transfer', idx: item, pos: i }
      }
    }

    for (let i = 0; i < colItems[tallest]!.length; i++) {
      for (let j = 0; j < colItems[shortest]!.length; j++) {
        const itemT = colItems[tallest]![i]!
        const itemS = colItems[shortest]![j]!
        const hT = photoHeights[itemT]! + spacing
        const hS = photoHeights[itemS]! + spacing
        if (hT <= hS) continue
        const newTH = colHeights[tallest]! - hT + hS
        const newSH = colHeights[shortest]! - hS + hT
        let newMax = Math.max(newTH, newSH)
        let newMin = Math.min(newTH, newSH)
        for (let c = 0; c < columns; c++) {
          if (c === tallest || c === shortest) continue
          if (colHeights[c]! > newMax) newMax = colHeights[c]!
          if (colHeights[c]! < newMin) newMin = colHeights[c]!
        }
        const reduction = currentDelta - (newMax - newMin)
        if (reduction > bestReduction) {
          bestReduction = reduction
          bestMove = { type: 'swap', tPos: i, sPos: j }
        }
      }
    }

    if (bestMove) {
      if (bestMove.type === 'transfer') {
        colItems[tallest]!.splice(bestMove.pos, 1)
        colItems[shortest]!.push(bestMove.idx)
        colHeights[tallest]! -= photoHeights[bestMove.idx]! + spacing
        colHeights[shortest]! += photoHeights[bestMove.idx]! + spacing
      } else {
        const itemT = colItems[tallest]![bestMove.tPos]!
        const itemS = colItems[shortest]![bestMove.sPos]!
        colItems[tallest]![bestMove.tPos] = itemS
        colItems[shortest]![bestMove.sPos] = itemT
        const diff = photoHeights[itemT]! - photoHeights[itemS]!
        colHeights[tallest]! -= diff
        colHeights[shortest]! += diff
      }
      improved = true
    }
  }

  const groups: LayoutGroup[] = []
  for (let c = 0; c < columns; c++) {
    colItems[c]!.sort((a, b) => a - b)
    const entries: LayoutEntry[] = colItems[c]!.map((idx, positionIndex) => ({
      index: idx,
      photo: photos[idx]!,
      width: columnWidth,
      height: photoHeights[idx]!,
      positionIndex,
      itemsCount: colItems[c]!.length,
    }))
    groups.push({ type: 'column', index: c, entries })
  }

  return groups
}
</file>
<file name="masonryContainerQueries.ts" path="/packages/core/src/layout/masonryContainerQueries.ts">
import { computeMasonryLayout } from './masonry'
import { resolveResponsiveParameter } from '../types'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../types'

export interface MasonryBreakpointSnapshot {
  spanKey: string
  condition: string
  containerWidth: number
  spacing: number
  padding: number
  groups: LayoutGroup[]
}

export interface MasonryBreakpointSnapshotsOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}

function groupSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries.map(e => e.index).join('.')).join('|')
}

/**
 * Computes per-breakpoint `masonry` layout snapshots for SSR.
 * Adjacent breakpoints are merged only when group assignment, spacing, and padding all match.
 */
export function computeMasonryBreakpointSnapshots(
  opts: MasonryBreakpointSnapshotsOptions,
): MasonryBreakpointSnapshot[] {
  if (opts.photos.length === 0 || opts.breakpoints.length === 0) return []

  const sorted = [...opts.breakpoints].filter(bp => bp > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return []

  type Entry = { bp: number; sig: string; groups: LayoutGroup[]; spacing: number; padding: number }
  const entries: Entry[] = []
  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const columns = resolveResponsiveParameter(opts.columns, bp, 3)
    const groups = computeMasonryLayout({ photos: opts.photos, containerWidth: bp, spacing, padding, columns })
    if (groups.length === 0) continue
    entries.push({ bp, sig: groupSignature(groups), groups, spacing, padding })
  }
  if (entries.length === 0) return []

  type Span = { fromIdx: number; toIdx: number; sig: string; spacing: number; padding: number; groups: LayoutGroup[] }
  const spans: Span[] = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!
    const last = spans[spans.length - 1]
    if (last && last.sig === e.sig && last.spacing === e.spacing && last.padding === e.padding) {
      last.toIdx = i
    }
    else {
      spans.push({ fromIdx: i, toIdx: i, sig: e.sig, spacing: e.spacing, padding: e.padding, groups: e.groups })
    }
  }

  return spans.map((span, s) => {
    const isFirst = s === 0
    const isLast = s === spans.length - 1
    const fromBp = entries[span.fromIdx]!.bp
    const nextBp = !isLast ? entries[spans[s + 1]!.fromIdx]!.bp : null

    let spanKey: string
    let condition: string
    if (spans.length === 1) {
      spanKey = 'bp-all'
      condition = ''
    }
    else if (isFirst) {
      spanKey = `bp-0-${nextBp! - 1}`
      condition = `(max-width: ${nextBp! - 1}px)`
    }
    else if (isLast) {
      spanKey = `bp-${fromBp}-inf`
      condition = `(min-width: ${fromBp}px)`
    }
    else {
      spanKey = `bp-${fromBp}-${nextBp! - 1}`
      condition = `(min-width: ${fromBp}px) and (max-width: ${nextBp! - 1}px)`
    }

    return {
      spanKey,
      condition,
      containerWidth: fromBp,
      spacing: span.spacing,
      padding: span.padding,
      groups: span.groups,
    }
  })
}
</file>
<file name="shortestPath.ts" path="/packages/core/src/layout/shortestPath.ts">
export type GraphFunction<T> = (
  node: T,
) => Array<{ neighbor: T; weight: number }>

type Matrix<T> = Map<T, Array<{ node: T; weight: number }>>

function computeShortestPath<T>(
  graph: GraphFunction<T>,
  pathLength: number,
  startNode: T,
  endNode: T,
) {
  const matrix: Matrix<T> = new Map()

  const queue = new Set<T>()
  queue.add(startNode)

  for (let length = 0; length < pathLength; length += 1) {
    const currentQueue = [...queue.keys()]

    queue.clear()
    currentQueue.forEach((node) => {
      const pathsAtNode = matrix.get(node)
      const accWeight = length > 0 ? (pathsAtNode?.[length]?.weight ?? 0) : 0

      graph(node).forEach(({ neighbor, weight }) => {
        let paths = matrix.get(neighbor)
        if (paths === undefined) {
          paths = []
          matrix.set(neighbor, paths)
        }

        const newWeight = accWeight + weight
        const nextPath = paths[length + 1]
        if (
          nextPath === undefined
          || (nextPath.weight > newWeight
            && (nextPath.weight / newWeight > 1.0001 || node < nextPath.node))
        ) {
          paths[length + 1] = { node, weight: newWeight }
        }

        if (length < pathLength - 1 && neighbor !== endNode) {
          queue.add(neighbor)
        }
      })
    })
  }

  return matrix
}

function reconstructShortestPath<T>(
  matrix: Matrix<T>,
  pathLength: number,
  endNode: T,
) {
  const path = [endNode]
  for (let node = endNode, length = pathLength; length > 0; length -= 1) {
    const previousNode = matrix.get(node)?.[length]?.node
    if (previousNode === undefined) {
      break
    }

    node = previousNode
    path.push(node)
  }
  return path.reverse()
}

export function findShortestPathLengthN<T>(
  graph: GraphFunction<T>,
  pathLength: number,
  startNode: T,
  endNode: T,
) {
  return reconstructShortestPath(
    computeShortestPath(graph, pathLength, startNode, endNode),
    pathLength,
    endNode,
  )
}
</file>
<file name="snapshotVisibility.ts" path="/packages/core/src/layout/snapshotVisibility.ts">
export interface SnapshotVisibilityInput {
  spanKey: string
  condition: string
}

/**
 * Emits `@container` hide/show CSS for per-breakpoint SSR snapshots.
 *
 * Strategy:
 *   - A base rule inside `@container <name> (min-width: 0)` hides every snapshot in the container.
 *   - One rule per span inside the span's own `@container <name> <condition>` shows the matching
 *     snapshot via attribute selector, which has higher specificity than the base class rule.
 *
 * Scoping is handled entirely by `@container <name>` — no root-class selector is needed.
 * Single-span input returns an empty string; the caller should just render the snapshot with
 * no `display:none` and skip the stylesheet.
 */
export function computeBreakpointVisibilityCSS(
  snapshots: readonly SnapshotVisibilityInput[],
  containerName: string,
  snapshotClass: string,
): string {
  if (snapshots.length <= 1) return ''

  const selector = `.${snapshotClass}`
  const rules: string[] = [
    `@container ${containerName} (min-width: 0){${selector}{display:none}}`,
  ]
  for (const snap of snapshots) {
    if (!snap.condition) continue
    rules.push(
      `@container ${containerName} ${snap.condition}{${selector}[data-bp=${snap.spanKey}]{display:flex}}`,
    )
  }
  return rules.join('\n')
}
</file>
<file name="types.ts" path="/packages/core/src/layout/types.ts">
import type { LayoutInput, RowsLayoutOptions, ColumnsLayoutOptions, MasonryLayoutOptions, LayoutEntry, LayoutGroup, PhotoItem } from '../types'

/** Guard against photos with invalid dimensions that would produce NaN layout values. */
export function validatePhotoDimensions(photos: PhotoItem[]): PhotoItem[] {
  return photos.map((p) => {
    if (p.width > 0 && p.height > 0) return p
    if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
      console.warn(`[nuxt-photo] Photo "${p.id}" has invalid dimensions (${p.width}x${p.height}), using 1:1 fallback`)
    }
    return { ...p, width: 1, height: 1 }
  })
}
</file>
<file name="animation.ts" path="/packages/core/src/physics/animation.ts">
import { easeInOutCubic } from './easing'

export async function animateNumber(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing = easeInOutCubic,
): Promise<void> {
  if (duration <= 0 || from === to) {
    onUpdate(to)
    return
  }

  const start = performance.now()

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      onUpdate(from + (to - from) * easing(progress))

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(tick)
  })
}
</file>
<file name="easing.ts" path="/packages/core/src/physics/easing.ts">
export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

export function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}
</file>
<file name="index.ts" path="/packages/core/src/physics/index.ts">
export { type Spring1D, createSpring1D, stopSpring, springStep, runSpring } from './spring'
export { VelocityTracker } from './velocity'
export { animateNumber } from './animation'
export { easeOutCubic, easeInOutCubic } from './easing'
</file>
<file name="spring.ts" path="/packages/core/src/physics/spring.ts">
export type Spring1D = {
  value: number
  target: number
  velocity: number
  tension: number
  friction: number
  rafId: number
}

export function createSpring1D(tension = 260, friction = 22): Spring1D {
  return { value: 0, target: 0, velocity: 0, tension, friction, rafId: 0 }
}

export function stopSpring(spring: Spring1D) {
  if (spring.rafId) {
    cancelAnimationFrame(spring.rafId)
    spring.rafId = 0
  }
}

export function springStep(
  current: number,
  target: number,
  velocity: number,
  tension: number,
  friction: number,
  dt: number,
): { value: number; velocity: number } {
  const distance = target - current
  const newVelocity = velocity + (distance * tension - velocity * friction) * dt
  return { value: current + newVelocity * dt, velocity: newVelocity }
}

export function runSpring(
  spring: Spring1D,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
  positionThreshold = 0.5,
  velocityThreshold = 0.1,
) {
  stopSpring(spring)
  let lastTime = performance.now()

  const step = (now: number) => {
    const dt = Math.min(0.064, (now - lastTime) / 1000)
    lastTime = now

    const result = springStep(spring.value, spring.target, spring.velocity, spring.tension, spring.friction, dt)
    spring.value = result.value
    spring.velocity = result.velocity

    onUpdate(spring.value)

    const distance = Math.abs(spring.target - spring.value)
    const done = distance < positionThreshold && Math.abs(spring.velocity) < velocityThreshold

    if (done) {
      spring.value = spring.target
      spring.velocity = 0
      spring.rafId = 0
      onUpdate(spring.value)
      onComplete?.()
      return
    }

    spring.rafId = requestAnimationFrame(step)
  }

  spring.rafId = requestAnimationFrame(step)
}
</file>
<file name="velocity.ts" path="/packages/core/src/physics/velocity.ts">
const CAPACITY = 32

type Sample = { x: number; y: number; time: number }

export class VelocityTracker {
  private readonly buffer: (Sample | undefined)[] = new Array(CAPACITY)
  private head = 0
  private count = 0
  private readonly windowMs: number

  constructor(windowMs = 100) {
    this.windowMs = windowMs
  }

  reset() {
    this.head = 0
    this.count = 0
  }

  addSample(x: number, y: number, time: number) {
    this.buffer[this.head] = { x, y, time }
    this.head = (this.head + 1) % CAPACITY
    if (this.count < CAPACITY) this.count++
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.count < 2) return { vx: 0, vy: 0 }

    const newestSlot = (this.head - 1 + CAPACITY) % CAPACITY
    const newest = this.buffer[newestSlot]!
    const cutoff = newest.time - this.windowMs

    // Iterate from oldest to newest to find the oldest sample still within window
    const startSlot = (this.head - this.count + CAPACITY) % CAPACITY
    let oldest = newest
    for (let i = 0; i < this.count; i++) {
      const slot = (startSlot + i) % CAPACITY
      const s = this.buffer[slot]!
      if (s.time >= cutoff) {
        oldest = s
        break
      }
    }

    const elapsed = newest.time - oldest.time
    if (elapsed < 1) return { vx: 0, vy: 0 }

    return {
      vx: (newest.x - oldest.x) / elapsed,
      vy: (newest.y - oldest.y) / elapsed,
    }
  }
}
</file>
<file name="index.ts" path="/packages/core/src/transition/index.ts">
export { createTransitionMode, getVisibilityRatio, shouldUseFlip, planCloseTransition, type TransitionModeConfig } from './planner'
</file>
<file name="planner.ts" path="/packages/core/src/transition/planner.ts">
import type { TransitionMode, CloseTransitionPlan, RectLike } from '../types'
import type { DebugLogger } from '../debug/logger'
import { isUsableRect } from '../geometry/rect'
import { getWindowDimensions } from '../utils/dom'

export type TransitionModeConfig = {
  mode: TransitionMode
  autoThreshold: number
}

const MIN_VISIBLE_DIMENSION = 80

export function createTransitionMode(): TransitionModeConfig {
  return {
    mode: 'auto',
    autoThreshold: 0.55,
  }
}

type ViewportRect = { left: number; top: number; right: number; bottom: number; width: number; height: number }

function getVisibleDimensions(rect: ViewportRect, vw: number, vh: number): { width: number; height: number } {
  return {
    width: Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0)),
    height: Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0)),
  }
}

export function getVisibilityRatio(rect: ViewportRect | null): number {
  if (!rect || rect.width <= 0 || rect.height <= 0) return 0

  const { width: vw, height: vh } = getWindowDimensions()
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(rect, vw, vh)
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = rect.width * rect.height

  return totalArea > 0 ? visibleArea / totalArea : 0
}

export function shouldUseFlip(
  rect: ViewportRect | null,
  config: TransitionModeConfig,
  debug?: DebugLogger,
): boolean {
  if (config.mode === 'none') {
    debug?.log('transitions', 'mode=none → skip FLIP (instant)')
    return false
  }

  if (config.mode === 'fade') {
    debug?.log('transitions', 'mode=fade → skip FLIP')
    return false
  }

  if (config.mode === 'flip') {
    debug?.log('transitions', 'mode=flip → force FLIP')
    return true
  }

  // auto mode — check visibility ratio AND minimum visible dimensions
  if (!rect) {
    debug?.log('transitions', 'mode=auto → no rect → FADE')
    return false
  }

  const { width: vw, height: vh } = getWindowDimensions()
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(rect, vw, vh)

  if (visibleWidth < MIN_VISIBLE_DIMENSION || visibleHeight < MIN_VISIBLE_DIMENSION) {
    debug?.log('transitions',
      `mode=auto → visible size ${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px < ${MIN_VISIBLE_DIMENSION}px min → FADE`,
    )
    return false
  }

  const ratio = getVisibilityRatio(rect)
  const useFlip = ratio >= config.autoThreshold

  debug?.log('transitions',
    `mode=auto → visibility=${(ratio * 100).toFixed(1)}% (${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px) threshold=${(config.autoThreshold * 100).toFixed(0)}% → ${useFlip ? 'FLIP' : 'FADE'}`,
  )

  return useFlip
}

const CLOSE_FLIP_DURATION_MS = 380
const CLOSE_FADE_DURATION_MS = 200

export function planCloseTransition(opts: {
  fromRect: RectLike | null
  toRect: DOMRect | null
  thumbRefExists: boolean
  config: TransitionModeConfig
  debug?: DebugLogger
}): CloseTransitionPlan {
  const { fromRect, toRect, thumbRefExists, config, debug } = opts

  if (config.mode === 'none') {
    debug?.log('transitions', 'planClose: mode=none → INSTANT')
    return { mode: 'instant', durationMs: 0, reason: 'mode-forced-none' }
  }

  if (config.mode === 'fade') {
    debug?.log('transitions', 'planClose: mode=fade → FADE')
    return { mode: 'fade', durationMs: CLOSE_FADE_DURATION_MS, reason: 'mode-forced-fade' }
  }

  if (!fromRect) {
    debug?.log('transitions', 'planClose: no fromRect (lightbox frame) → FADE')
    return { mode: 'fade', durationMs: CLOSE_FADE_DURATION_MS, reason: 'missing-frame-rect' }
  }

  if (!thumbRefExists) {
    debug?.log('transitions', 'planClose: no thumb ref registered → FADE')
    return { mode: 'fade', durationMs: CLOSE_FADE_DURATION_MS, reason: 'missing-thumb-ref' }
  }

  if (!toRect || !isUsableRect(toRect)) {
    debug?.log('transitions', `planClose: thumb rect unusable (${toRect ? `${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} at ${toRect.left.toFixed(0)},${toRect.top.toFixed(0)}` : 'null'}) → FADE`)
    return { mode: 'fade', durationMs: CLOSE_FADE_DURATION_MS, reason: 'thumb-off-screen', fromRect }
  }

  if (config.mode === 'auto') {
    if (!shouldUseFlip(toRect, config, debug)) {
      return { mode: 'fade', durationMs: CLOSE_FADE_DURATION_MS, reason: 'visibility-below-threshold', fromRect }
    }
  }

  debug?.log('transitions', 'planClose: all checks passed → FLIP')
  return { mode: 'flip', durationMs: CLOSE_FLIP_DURATION_MS, fromRect, toRect, reason: 'ok' }
}
</file>
<file name="dom.ts" path="/packages/core/src/utils/dom.ts">
export function getWindowDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return { width: window.innerWidth, height: window.innerHeight }
}
</file>
<file name="index.ts" path="/packages/core/src/utils/index.ts">
export { round } from './math'
export { getWindowDimensions } from './dom'
</file>
<file name="math.ts" path="/packages/core/src/utils/math.ts">
export function round(value: number, digits = 0): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
</file>
<file name="gestures.ts" path="/packages/core/src/viewer/gestures.ts">
import type { GestureMode, PanState } from '../types'

/**
 * Classify a gesture based on pointer movement delta.
 * Returns the gesture mode: idle, slide, pan, or close.
 */
export function classifyGesture(
  deltaX: number,
  deltaY: number,
  pointerType: string,
  isZoomedIn: boolean,
  panBounds: { x: number; y: number },
  currentPan: PanState,
): GestureMode {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const threshold = pointerType === 'touch' ? 10 : 6

  if (absX < threshold && absY < threshold) return 'idle'

  const horizontalIntent = absX > absY * 1.1
  const verticalIntent = absY > absX * 1.1

  if (isZoomedIn) {
    const canPanX = panBounds.x > 0.5
    const canPanY = panBounds.y > 0.5
    const atLeftEdge = currentPan.x >= panBounds.x - 1
    const atRightEdge = currentPan.x <= -panBounds.x + 1
    const wantsOutwardSlide = horizontalIntent
      && (!canPanX || (deltaX > 0 && atLeftEdge) || (deltaX < 0 && atRightEdge))

    if (!wantsOutwardSlide && (canPanX || canPanY)) return 'pan'
    if (horizontalIntent) return 'slide'
    return 'pan'
  }

  if (horizontalIntent) return 'slide'
  if (verticalIntent) return 'close'
  return absX >= absY ? 'slide' : 'close'
}

/**
 * Detect a double-tap based on timing and proximity.
 */
export function isDoubleTap(
  now: number,
  lastTap: { time: number; clientX: number; clientY: number } | null,
  clientX: number,
  clientY: number,
  maxInterval = 260,
  maxDistance = 24,
): boolean {
  if (!lastTap) return false
  return (
    now - lastTap.time < maxInterval
    && Math.abs(clientX - lastTap.clientX) < maxDistance
    && Math.abs(clientY - lastTap.clientY) < maxDistance
  )
}

/**
 * Compute the close-drag ratio (0 to 0.75) from vertical drag distance.
 */
export function computeCloseDragRatio(closeDragY: number, areaHeight: number): number {
  return Math.min(0.75, Math.abs(closeDragY) / Math.max(240, areaHeight * 0.85))
}
</file>
<file name="index.ts" path="/packages/core/src/viewer/index.ts">
export {
  DEFAULT_MIN_ZOOM,
  computeFittedFrame,
  computeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
} from './zoom'

export {
  classifyGesture,
  isDoubleTap,
  computeCloseDragRatio,
} from './gestures'

export {
  viewerTransition,
  createViewerState,
  isViewerOpen,
  getActiveId,
  type ViewerAction,
} from './state-machine'
</file>
<file name="state-machine.ts" path="/packages/core/src/viewer/state-machine.ts">
import type { ViewerState } from '../types'

export type ViewerAction =
  | { type: 'open'; activeId: string | number }
  | { type: 'opened' }
  | { type: 'close' }
  | { type: 'closed' }
  | { type: 'setActive'; activeId: string | number }

/**
 * Pure state machine for the viewer lifecycle.
 * Returns the next state given a current state and action.
 */
export function viewerTransition(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'open':
      if (state.status === 'closed') {
        return { status: 'opening', activeId: action.activeId }
      }
      // Allow re-open if already open (switch to different item)
      if (state.status === 'open') {
        return { status: 'open', activeId: action.activeId }
      }
      return state

    case 'opened':
      if (state.status === 'opening') {
        return { status: 'open', activeId: state.activeId }
      }
      return state

    case 'close':
      if (state.status === 'open' || state.status === 'opening') {
        return { status: 'closing', activeId: state.activeId }
      }
      return state

    case 'closed':
      if (state.status === 'closing') {
        return { status: 'closed' }
      }
      return state

    case 'setActive':
      if (state.status === 'open') {
        return { status: 'open', activeId: action.activeId }
      }
      return state

    default:
      return state
  }
}

export function createViewerState(): ViewerState {
  return { status: 'closed' }
}

export function isViewerOpen(state: ViewerState): boolean {
  return state.status === 'open' || state.status === 'opening'
}

export function getActiveId(state: ViewerState): (string | number) | undefined {
  if ('activeId' in state) return state.activeId
  return undefined
}
</file>
<file name="zoom.ts" path="/packages/core/src/viewer/zoom.ts">
import type { PanState, PhotoItem, RectLike, ZoomState } from '../types'
import { fitRect, rubberband } from '../geometry/rect'

export const DEFAULT_MIN_ZOOM = 1.5

/**
 * Compute a frame rect (fitted to aspect ratio) relative to the container origin.
 */
export function computeFittedFrame(
  containerWidth: number,
  containerHeight: number,
  photoWidth: number,
  photoHeight: number,
): RectLike {
  return fitRect(
    { left: 0, top: 0, width: containerWidth, height: containerHeight },
    photoWidth / photoHeight,
  )
}

/**
 * Compute zoom levels for a photo within a given area.
 * Respects per-photo `photo.meta.maxZoom` / `photo.meta.minZoom` overrides,
 * and accepts a lightbox-level `options.minZoom` fallback.
 */
export function computeZoomLevels(
  photoWidth: number,
  photoHeight: number,
  areaWidth: number,
  areaHeight: number,
  photo?: PhotoItem,
  options?: { minZoom?: number },
): ZoomState {
  const frame = computeFittedFrame(areaWidth, areaHeight, photoWidth, photoHeight)

  const metaMax = typeof photo?.meta?.maxZoom === 'number' && (photo.meta.maxZoom as number) > 0
    ? (photo.meta.maxZoom as number)
    : null

  const minZoom = (typeof photo?.meta?.minZoom === 'number' && (photo.meta.minZoom as number) > 0
    ? (photo.meta.minZoom as number)
    : null) ?? options?.minZoom ?? DEFAULT_MIN_ZOOM

  const naturalMax = metaMax ?? Math.max(
    minZoom,
    Math.min(4, photoWidth / frame.width, photoHeight / frame.height),
  )
  const secondary = Math.min(2, naturalMax)

  return {
    fit: 1,
    secondary,
    max: Math.max(secondary, naturalMax),
    current: 1,
  }
}

/**
 * Compute pan bounds for a given zoom level.
 * Returns the maximum absolute pan offset in each axis.
 */
export function computePanBounds(
  photoWidth: number,
  photoHeight: number,
  areaWidth: number,
  areaHeight: number,
  zoom: number,
): { x: number; y: number } {
  const frame = computeFittedFrame(areaWidth, areaHeight, photoWidth, photoHeight)
  return {
    x: Math.max(0, (frame.width * zoom - areaWidth) / 2),
    y: Math.max(0, (frame.height * zoom - areaHeight) / 2),
  }
}

/**
 * Clamp pan position to bounds (hard clamp).
 */
export function clampPanToBounds(pan: PanState, bounds: { x: number; y: number }): PanState {
  return {
    x: Math.min(bounds.x, Math.max(-bounds.x, pan.x)),
    y: Math.min(bounds.y, Math.max(-bounds.y, pan.y)),
  }
}

/**
 * Clamp pan position to bounds with rubber-band resistance beyond edges.
 */
export function clampPanWithResistance(pan: PanState, bounds: { x: number; y: number }): PanState {
  return {
    x: rubberband(pan.x, -bounds.x, bounds.x),
    y: rubberband(pan.y, -bounds.y, bounds.y),
  }
}

/**
 * Convert client (screen) coordinates to a point relative to area center.
 */
export function clientToAreaPoint(
  clientX: number,
  clientY: number,
  areaLeft: number,
  areaTop: number,
  areaWidth: number,
  areaHeight: number,
): { x: number; y: number } {
  return {
    x: clientX - areaLeft - areaWidth / 2,
    y: clientY - areaTop - areaHeight / 2,
  }
}

/**
 * Compute the target pan position when zooming to a specific level,
 * keeping the given point stable on screen.
 */
export function computeTargetPanForZoom(
  targetZoom: number,
  currentZoom: number,
  currentPan: PanState,
  point: { x: number; y: number },
  fitZoom: number,
  panBounds: { x: number; y: number },
): PanState {
  if (targetZoom <= fitZoom + 0.01) {
    return { x: 0, y: 0 }
  }

  const targetPan = {
    x: point.x - ((point.x - currentPan.x) / currentZoom) * targetZoom,
    y: point.y - ((point.y - currentPan.y) / currentZoom) * targetZoom,
  }

  return clampPanToBounds(targetPan, panBounds)
}
</file>
<file name="index.ts" path="/packages/core/src/index.ts">
// @nuxt-photo/core — Framework-free TypeScript

// Types
export * from './types'

// Collection
export * from './collection'

// Layout
export * from './layout'

// Geometry
export * from './geometry'

// Physics
export * from './physics'

// Image
export * from './image'

// DOM utilities
export * from './dom'

// Debug
export * from './debug'

// Viewer
export * from './viewer'

// Transition
export * from './transition'

// Utilities
export * from './utils'
</file>
<file name="types.ts" path="/packages/core/src/types.ts">
// ─── Item types ───

export type PhotoItem<TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  id: string | number
  src: string
  thumbSrc?: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  blurhash?: string
  srcset?: string
  meta?: TMeta
}

/** Normalize photo id to string for reliable comparison across string/number types. */
export function photoId(photo: PhotoItem): string {
  return String(photo.id)
}

export type SlideItem =
  | { type: 'image'; photo: PhotoItem }
  | { type: 'custom'; id: string; data?: unknown; width?: number; height?: number }

// ─── Geometry ───

export type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

export type AreaMetrics = RectLike

export type PanState = {
  x: number
  y: number
}

export type PanBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// ─── Zoom ───

export type ZoomState = {
  fit: number
  secondary: number
  max: number
  current: number
}

// ─── Gestures ───

export type GestureMode = 'idle' | 'slide' | 'pan' | 'close'

// ─── Panzoom motion ───

export type PanzoomMotion = {
  x: number
  y: number
  scale: number
  targetX: number
  targetY: number
  targetScale: number
  velocityX: number
  velocityY: number
  velocityScale: number
  tension: number
  friction: number
  rafId: number
}

// ─── Carousel ───

export type CarouselStyle = 'classic' | 'parallax' | 'fade'

export type CarouselConfig = {
  style: CarouselStyle
  parallax: { amount: number; scale: number; opacity: number }
  fade: { minOpacity: number }
}

// ─── Viewer state machine ───

export type ViewerState =
  | { status: 'closed' }
  | { status: 'opening'; activeId: string | number }
  | { status: 'open'; activeId: string | number }
  | { status: 'closing'; activeId: string | number }

// ─── Transition ───

export type TransitionMode = 'flip' | 'fade' | 'auto' | 'none'

export type OpenTransitionPlan = {
  mode: 'connected' | 'fade' | 'scale-fade'
  sourceRect?: RectLike
  targetRect?: RectLike
  sourceAspectRatio?: number
  targetAspectRatio?: number
  durationMs: number
  easing: string
  reason?:
    | 'ok'
    | 'missing-source'
    | 'not-visible'
    | 'bad-geometry'
    | 'aspect-ratio-too-far'
    | 'decode-timeout'
    | 'reduced-motion'
}

export type CloseTransitionPlan = {
  mode: 'flip' | 'fade' | 'instant'
  fromRect?: RectLike
  toRect?: RectLike
  durationMs: number
  reason:
    | 'ok'
    | 'missing-thumb-ref'
    | 'thumb-off-screen'
    | 'missing-frame-rect'
    | 'mode-forced-fade'
    | 'mode-forced-none'
    | 'visibility-below-threshold'
    | 'scrolled-into-view'
}

// ─── Layout ───

export type LayoutInput = {
  photos: PhotoItem[]
  containerWidth: number
  spacing?: number
  padding?: number
}

export type RowsLayoutOptions = LayoutInput & {
  targetRowHeight?: number
}

export type ColumnsLayoutOptions = LayoutInput & {
  columns?: number
}

export type MasonryLayoutOptions = LayoutInput & {
  columns?: number
}

export type LayoutEntry = {
  index: number
  photo: PhotoItem
  width: number
  height: number
  positionIndex: number
  itemsCount: number
}

export type LayoutGroup = {
  type: 'row' | 'column'
  index: number
  entries: LayoutEntry[]
  columnsGaps?: number[]
  columnsRatios?: number[]
}

// ─── Album layout (discriminated union for PhotoAlbum) ───

export type RowsAlbumLayout = {
  type: 'rows'
  targetRowHeight?: ResponsiveParameter<number>
}

export type ColumnsAlbumLayout = {
  type: 'columns'
  columns?: ResponsiveParameter<number>
}

export type MasonryAlbumLayout = {
  type: 'masonry'
  columns?: ResponsiveParameter<number>
}

/**
 * Discriminated layout config for `PhotoAlbum`.
 * Each variant only accepts the props relevant to that layout type.
 *
 * @example
 * <PhotoAlbum :photos="photos" :layout="{ type: 'rows', targetRowHeight: 280 }" />
 */
export type AlbumLayout = RowsAlbumLayout | ColumnsAlbumLayout | MasonryAlbumLayout

// ─── Image adapter ───

export type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}

/**
 * Context in which an image is being rendered.
 * - `'thumb'` — grid thumbnail (smaller, responsive srcset)
 * - `'slide'` — lightbox slide (full-viewport srcset)
 * - `'preload'` — reserved for future preloading support; adapters may return a
 *   single low-res URL here. The native adapter treats it the same as `'slide'`.
 */
export type ImageContext = 'thumb' | 'slide' | 'preload'

export type ImageAdapter = (photo: PhotoItem, context: ImageContext) => ImageSource

// ─── Responsive parameters ───

/**
 * A prop value that can be a plain value or a function that receives the current
 * container width and returns a value. Allows per-breakpoint customisation without
 * needing explicit breakpoint arrays. Defaults to `number` but can be parameterized.
 *
 * @example
 * // Static value — same at every container width
 * :spacing="8"
 *
 * // Inline function — full control
 * :spacing="(w) => w < 600 ? 4 : 8"
 *
 * // Breakpoint map via responsive() helper — declarative shorthand
 * :spacing="responsive({ 0: 4, 600: 8, 900: 12 })"
 */
export type ResponsiveParameter<T = number> = T | ((containerWidth: number) => T)

const responsiveBreakpointsKey = Symbol('nuxt-photo:responsive-breakpoints')

export type ResponsiveResolver<T> = ((containerWidth: number) => T) & {
  readonly [responsiveBreakpointsKey]?: readonly number[]
}

/**
 * Resolve a `ResponsiveParameter` to its concrete value.
 * Returns `fallback` when `value` is `undefined`.
 */
export function resolveResponsiveParameter<T>(
  value: ResponsiveParameter<T> | undefined,
  containerWidth: number,
  fallback: T,
): T {
  if (value === undefined) return fallback
  return typeof value === 'function' ? (value as (w: number) => T)(containerWidth) : value
}

export function getResponsiveBreakpoints<T>(
  value: ResponsiveParameter<T> | undefined,
): readonly number[] | undefined {
  if (typeof value !== 'function') return undefined

  const breakpoints = (value as ResponsiveResolver<T>)[responsiveBreakpointsKey]
  return Array.isArray(breakpoints) && breakpoints.length > 0 ? breakpoints : undefined
}

export function mergeResponsiveBreakpoints(
  values: Array<ResponsiveParameter<any> | undefined>,
): readonly number[] | undefined {
  const positive = new Set<number>()
  let sawZeroBreakpoint = false

  for (const value of values) {
    const breakpoints = getResponsiveBreakpoints(value)
    if (!breakpoints) continue

    for (const breakpoint of breakpoints) {
      if (!Number.isFinite(breakpoint) || breakpoint < 0) continue
      if (breakpoint === 0) {
        sawZeroBreakpoint = true
        continue
      }
      positive.add(breakpoint)
    }
  }

  if (positive.size === 0) return undefined

  const merged = [...positive].sort((a, b) => a - b)
  if (!sawZeroBreakpoint) return merged

  const floor = Math.max(1, Math.floor(merged[0]! / 2))
  return merged[0] === floor ? merged : [floor, ...merged]
}

/**
 * Create a responsive parameter from a breakpoint map.
 * Keys are minimum container widths (px); values are the parameter at that width.
 * The largest matching breakpoint wins (mobile-first).
 *
 * @example
 * // 2 columns below 600px, 3 at 600-899px, 4 at 900px+
 * responsive({ 0: 2, 600: 3, 900: 4 })
 *
 * @example
 * // Use with PhotoAlbum
 * <PhotoAlbum
 *   :layout="{ type: 'columns', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
 *   :spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
 * />
 */
export function responsive<T>(breakpoints: Record<number, T>): ResponsiveResolver<T> {
  const sorted = Object.entries(breakpoints)
    .map(([k, v]) => [Number(k), v] as [number, T])
    .sort((a, b) => b[0] - a[0])

  if (sorted.length === 0) {
    throw new Error('[nuxt-photo] responsive() requires at least one breakpoint')
  }

  const resolver = ((containerWidth: number) => {
    for (const [minWidth, value] of sorted) {
      if (containerWidth >= minWidth) return value
    }
    return sorted[sorted.length - 1]![1]
  }) as ResponsiveResolver<T>

  Object.defineProperty(resolver, responsiveBreakpointsKey, {
    value: [...new Set(sorted.map(([minWidth]) => minWidth).filter(width => Number.isFinite(width) && width >= 0))].sort((a, b) => a - b),
    enumerable: false,
    configurable: false,
    writable: false,
  })

  return resolver
}

// ─── Photo adapter ───

/**
 * Transforms external data shapes into `PhotoItem`.
 * Pass to `PhotoAlbum` or `PhotoGroup` via the `:photoAdapter` prop so you can
 * feed CMS / API responses directly without manual mapping.
 *
 * @example
 * const fromUnsplash: PhotoAdapter<UnsplashPhoto> = (item) => ({
 *   id: item.id,
 *   src: item.urls.regular,
 *   thumbSrc: item.urls.thumb,
 *   width: item.width,
 *   height: item.height,
 *   alt: item.alt_description ?? undefined,
 * })
 */
export type PhotoAdapter<T = any> = (item: T) => PhotoItem

// ─── Debug ───

export type DebugChannel = 'transitions' | 'gestures' | 'zoom' | 'slides' | 'geometry' | 'rects'
</file>
<file name="collection.test.ts" path="/packages/core/test/collection.test.ts">
import { describe, expect, it } from 'vitest'
import { createCollection } from '@nuxt-photo/core'

describe('collection contract', () => {
  it('supports lookup, wraparound navigation, and preload candidates', () => {
    const collection = createCollection([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ])

    expect(collection.getById('c')).toEqual({ id: 'c' })
    expect(collection.indexOfId('b')).toBe(1)
    expect(collection.next(3)).toBe(0)
    expect(collection.prev(0)).toBe(3)
    expect(collection.preloadCandidates(1, 2)).toEqual([
      { id: 'c' },
      { id: 'a' },
      { id: 'd' },
    ])
  })
})
</file>
<file name="layout.test.ts" path="/packages/core/test/layout.test.ts">
import { describe, expect, it } from 'vitest'
import {
  computeColumnsLayout,
  computeMasonryLayout,
  computeRowsLayout,
} from '@nuxt-photo/core'
import { createPhotoSet } from '@test-fixtures/photos'

function totalGroupHeight(
  group: { entries: Array<{ height: number }> },
  spacing: number,
) {
  return group.entries.reduce((sum, entry) => sum + entry.height, 0) + spacing * Math.max(0, group.entries.length - 1)
}

function masonryGreedyDelta(
  widths: Array<{ width: number; height: number }>,
  columns: number,
  spacing: number,
) {
  const heights = new Array(columns).fill(0)

  for (const photo of widths) {
    let shortest = 0
    for (let index = 1; index < heights.length; index++) {
      if (heights[index]! < heights[shortest]!) shortest = index
    }
    heights[shortest] += photo.height + spacing
  }

  return Math.max(...heights) - Math.min(...heights)
}

describe('layout algorithms', () => {
  it('justifies rows to the container width and returns no invalid entries', () => {
    const containerWidth = 1000
    const spacing = 8
    const rows = computeRowsLayout({
      photos: createPhotoSet(),
      containerWidth,
      spacing,
      targetRowHeight: 280,
    })

    expect(computeRowsLayout({ photos: [], containerWidth })).toEqual([])
    expect(rows.length).toBeGreaterThan(0)

    for (const row of rows) {
      const totalWidth = row.entries.reduce((sum, entry) => sum + entry.width, 0) + spacing * (row.entries.length - 1)
      expect(totalWidth).toBeCloseTo(containerWidth, 4)
      expect(row.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
    }
  })

  it('balances columns while keeping per-column order and valid dimensions', () => {
    const spacing = 8
    const columns = computeColumnsLayout({
      photos: createPhotoSet(),
      containerWidth: 1000,
      spacing,
      columns: 3,
    })

    expect(columns).toHaveLength(3)

    for (const column of columns) {
      expect(column.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map(entry => entry.index)).toEqual([...column.entries.map(entry => entry.index)].sort((a, b) => a - b))
    }

    const heights = columns.map(column => totalGroupHeight(column, spacing))
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(60)
  })

  it('keeps masonry columns ordered and does not worsen the greedy baseline', () => {
    const photos = createPhotoSet()
    const containerWidth = 1000
    const columnsCount = 3
    const spacing = 8
    const columnWidth = (containerWidth - spacing * (columnsCount - 1)) / columnsCount
    const greedyDelta = masonryGreedyDelta(
      photos.map(photo => ({
        width: columnWidth,
        height: columnWidth / (photo.width / photo.height),
      })),
      columnsCount,
      spacing,
    )

    const masonry = computeMasonryLayout({
      photos,
      containerWidth,
      spacing,
      columns: columnsCount,
    })

    for (const column of masonry) {
      expect(column.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map(entry => entry.index)).toEqual([...column.entries.map(entry => entry.index)].sort((a, b) => a - b))
    }

    const heights = masonry.map(column => totalGroupHeight(column, spacing))
    const finalDelta = Math.max(...heights) - Math.min(...heights)

    expect(finalDelta).toBeLessThanOrEqual(greedyDelta)
  })
})
</file>
<file name="loader.test.ts" path="/packages/core/test/loader.test.ts">
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ensureImageLoaded } from '../src/image/loader'

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decode?: () => Promise<void>
  complete = false
  private _src = ''

  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value
    // Simulate async load
    queueMicrotask(() => {
      if (value.includes('broken')) {
        this.onerror?.()
      } else {
        this.complete = true
        this.onload?.()
      }
    })
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage)
  // We can't clear the module-level cache between tests,
  // so each test uses a unique URL via Date.now() to avoid cache collisions
})

describe('ensureImageLoaded', () => {
  it('resolves for a valid image', async () => {
    await expect(ensureImageLoaded(`/valid-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('resolves (does not reject) for a broken image', async () => {
    await expect(ensureImageLoaded(`/broken-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('does not cache failed loads so retries can succeed', async () => {
    const src = `/broken-retry-${Date.now()}.jpg`

    // First call: broken image
    await ensureImageLoaded(src)

    // Simulate fix: next load of same src should create a new Image
    // (not return a cached resolved promise from the failed load)
    let imageCreated = false
    const OrigImage = MockImage
    vi.stubGlobal('Image', class extends OrigImage {
      constructor() {
        super()
        imageCreated = true
      }
    })

    await ensureImageLoaded(src)
    expect(imageCreated).toBe(true)
  })

  it('resolves when image.decode() succeeds', async () => {
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.resolve()
    })
    await expect(ensureImageLoaded(`/decode-ok-${Date.now()}.jpg`)).resolves.toBeUndefined()
  })

  it('resolves when image.decode() rejects and evicts from cache', async () => {
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.reject(new Error('decode failed'))
    })

    const src = `/decode-fail-${Date.now()}.jpg`
    await ensureImageLoaded(src)

    // Should not be cached — next call should create a new Image
    let imageCreated = false
    vi.stubGlobal('Image', class extends MockImage {
      decode = () => Promise.resolve()
      constructor() {
        super()
        imageCreated = true
      }
    })

    await ensureImageLoaded(src)
    expect(imageCreated).toBe(true)
  })

  it('deduplicates concurrent loads for the same src', async () => {
    let imageCount = 0
    vi.stubGlobal('Image', class extends MockImage {
      constructor() {
        super()
        imageCount++
      }
    })

    const src = `/dedup-${Date.now()}.jpg`
    const p1 = ensureImageLoaded(src)
    const p2 = ensureImageLoaded(src)

    // Same promise reference (cache hit on second call)
    expect(p1).toBe(p2)
    expect(imageCount).toBe(1)

    await Promise.all([p1, p2])
  })
})
</file>
<file name="photoAdapter.test.ts" path="/packages/core/test/photoAdapter.test.ts">
import { describe, expect, it } from 'vitest'
import type { PhotoAdapter, PhotoItem } from '../src/types'

describe('PhotoAdapter type', () => {
  it('transforms external data into PhotoItem', () => {
    type UnsplashPhoto = {
      id: string
      urls: { regular: string; thumb: string }
      width: number
      height: number
      alt_description: string | null
    }

    const fromUnsplash: PhotoAdapter<UnsplashPhoto> = (item) => ({
      id: item.id,
      src: item.urls.regular,
      thumbSrc: item.urls.thumb,
      width: item.width,
      height: item.height,
      alt: item.alt_description ?? undefined,
    })

    const input: UnsplashPhoto = {
      id: 'abc123',
      urls: { regular: 'https://example.com/regular.jpg', thumb: 'https://example.com/thumb.jpg' },
      width: 1920,
      height: 1080,
      alt_description: 'A sunset',
    }

    const result: PhotoItem = fromUnsplash(input)

    expect(result).toEqual({
      id: 'abc123',
      src: 'https://example.com/regular.jpg',
      thumbSrc: 'https://example.com/thumb.jpg',
      width: 1920,
      height: 1080,
      alt: 'A sunset',
    })
  })

  it('works with array mapping', () => {
    const adapter: PhotoAdapter<{ url: string; w: number; h: number }> = (item) => ({
      id: item.url,
      src: item.url,
      width: item.w,
      height: item.h,
    })

    const items = [
      { url: '/a.jpg', w: 800, h: 600 },
      { url: '/b.jpg', w: 1200, h: 900 },
    ]

    const photos: PhotoItem[] = items.map(adapter)

    expect(photos).toHaveLength(2)
    expect(photos[0]!.id).toBe('/a.jpg')
    expect(photos[1]!.width).toBe(1200)
  })
})
</file>
<file name="responsive.test.ts" path="/packages/core/test/responsive.test.ts">
import { describe, expect, it } from 'vitest'
import {
  getResponsiveBreakpoints,
  mergeResponsiveBreakpoints,
  responsive,
  resolveResponsiveParameter,
} from '../src/types'

describe('responsive()', () => {
  it('returns the value for the largest matching breakpoint', () => {
    const fn = responsive({ 0: 2, 600: 3, 900: 4 })
    expect(fn(0)).toBe(2)
    expect(fn(599)).toBe(2)
    expect(fn(600)).toBe(3)
    expect(fn(899)).toBe(3)
    expect(fn(900)).toBe(4)
    expect(fn(1200)).toBe(4)
  })

  it('works with a single breakpoint', () => {
    const fn = responsive({ 0: 8 })
    expect(fn(0)).toBe(8)
    expect(fn(1000)).toBe(8)
  })

  it('works with non-zero minimum breakpoint', () => {
    const fn = responsive({ 400: 'small', 800: 'large' })
    // Below smallest breakpoint falls back to smallest value
    expect(fn(200)).toBe('small')
    expect(fn(400)).toBe('small')
    expect(fn(800)).toBe('large')
  })

  it('throws on empty breakpoints', () => {
    expect(() => responsive({})).toThrow('at least one breakpoint')
  })

  it('integrates with resolveResponsiveParameter', () => {
    const fn = responsive({ 0: 4, 600: 8 })
    expect(resolveResponsiveParameter(fn, 300, 0)).toBe(4)
    expect(resolveResponsiveParameter(fn, 700, 0)).toBe(8)
  })

  it('exposes breakpoint metadata for responsive() resolvers', () => {
    const fn = responsive({ 0: 4, 600: 8, 900: 12 })
    expect(getResponsiveBreakpoints(fn)).toEqual([0, 600, 900])
  })

  it('merges responsive breakpoint metadata across multiple parameters', () => {
    const spacing = responsive({ 0: 4, 600: 8 })
    const columns = responsive({ 0: 1, 840: 3, 1120: 4 })

    expect(mergeResponsiveBreakpoints([spacing, columns])).toEqual([300, 600, 840, 1120])
  })

  it('returns undefined when no responsive metadata is available', () => {
    expect(mergeResponsiveBreakpoints([8, undefined, (width: number) => width > 600 ? 8 : 4])).toBeUndefined()
  })
})
</file>
<file name="transition.test.ts" path="/packages/core/test/transition.test.ts">
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTransitionMode,
  getVisibilityRatio,
  planCloseTransition,
  shouldUseFlip,
} from '@nuxt-photo/core'

function rect({
  left,
  top,
  width,
  height,
}: {
  left: number
  top: number
  width: number
  height: number
}) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('transition planning', () => {
  it('computes visibility ratios against the viewport', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    expect(getVisibilityRatio(rect({ left: 0, top: 0, width: 200, height: 100 }))).toBe(1)
    expect(getVisibilityRatio(rect({ left: -100, top: 0, width: 200, height: 100 }))).toBe(0.5)
  })

  it('uses transition mode rules for FLIP eligibility', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'none', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'fade', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'flip', autoThreshold: 0.55 })).toBe(true)
    expect(shouldUseFlip(rect({ left: -220, top: 100, width: 400, height: 400 }), { mode: 'auto', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 40, top: 40, width: 300, height: 220 }), { mode: 'auto', autoThreshold: 0.55 })).toBe(true)
  })

  it('plans close transitions for forced modes, unusable thumbs, low visibility, and good geometry', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    const fromRect = { left: 100, top: 120, width: 900, height: 500 }

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: { mode: 'none', autoThreshold: 0.55 },
    })).toMatchObject({ mode: 'instant', reason: 'mode-forced-none' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: { mode: 'fade', autoThreshold: 0.55 },
    })).toMatchObject({ mode: 'fade', reason: 'mode-forced-fade' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 20, height: 20 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'fade', reason: 'thumb-off-screen' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: -220, top: 100, width: 400, height: 400 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'fade', reason: 'visibility-below-threshold' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'flip', reason: 'ok' })
  })
})
</file>
<file name="viewer-and-geometry.test.ts" path="/packages/core/test/viewer-and-geometry.test.ts">
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MIN_ZOOM,
  clampPanToBounds,
  classifyGesture,
  computeCloseDragRatio,
  computePanBounds,
  computeTargetPanForZoom,
  computeZoomLevels,
  fitRect,
  getActiveId,
  getLoopedIndex,
  isDoubleTap,
  isViewerOpen,
  rubberband,
  viewerTransition,
} from '@nuxt-photo/core'

describe('geometry and viewer utilities', () => {
  it('fits rectangles and loops indexes predictably', () => {
    expect(fitRect({ left: 0, top: 0, width: 100, height: 100 }, 2)).toEqual({
      left: 0,
      top: 25,
      width: 100,
      height: 50,
    })
    expect(getLoopedIndex(-1, 5)).toBe(4)
    expect(getLoopedIndex(5, 5)).toBe(0)
  })

  it('applies rubberbanding and zoom math correctly', () => {
    const zoom = computeZoomLevels(2400, 1600, 1200, 800)
    const bounds = computePanBounds(2400, 1600, 1200, 800, 2)

    expect(rubberband(-20, 0, 100)).toBe(-4)
    expect(zoom).toEqual({ fit: 1, secondary: 2, max: 2, current: 1 })
    expect(bounds).toEqual({ x: 600, y: 400 })
    expect(clampPanToBounds({ x: 700, y: -500 }, bounds)).toEqual({ x: 600, y: -400 })
  })

  it('applies the default minZoom, supports per-photo and options overrides', () => {
    // Near-native resolution: the default minZoom raises max above natural ratio
    const nearNative = computeZoomLevels(1280, 800, 1240, 775)
    expect(nearNative.max).toBe(DEFAULT_MIN_ZOOM)
    expect(nearNative.fit).toBe(1)
    expect(nearNative.current).toBe(1)

    // Photo smaller than display area: the default minZoom floor still applies
    const small = computeZoomLevels(600, 400, 1200, 800)
    expect(small.max).toBe(DEFAULT_MIN_ZOOM)
    expect(small.secondary).toBe(DEFAULT_MIN_ZOOM)

    // Large photo (>2x) — unchanged, natural resolution dominates
    const large = computeZoomLevels(4000, 2000, 1200, 800)
    expect(large.max).toBeCloseTo(3.33, 1)
    expect(large.secondary).toBe(2)

    // Per-photo maxZoom via meta
    const custom = computeZoomLevels(600, 400, 1200, 800, { id: '1', src: '', width: 600, height: 400, meta: { maxZoom: 3 } })
    expect(custom.max).toBe(3)
    expect(custom.secondary).toBe(2)

    // Per-photo minZoom via meta overrides default
    const metaMin = computeZoomLevels(600, 400, 1200, 800, { id: '1', src: '', width: 600, height: 400, meta: { minZoom: 2.5 } })
    expect(metaMin.max).toBe(2.5)

    // Lightbox-level minZoom via options
    const optMin = computeZoomLevels(600, 400, 1200, 800, undefined, { minZoom: 1 })
    expect(optMin.max).toBe(1)
    expect(optMin.secondary).toBe(1)
  })

  it('keeps zoom-out centered and clamps zoom-in targets to bounds', () => {
    expect(
      computeTargetPanForZoom(1, 2, { x: 120, y: -80 }, { x: 240, y: -160 }, 1, { x: 600, y: 400 }),
    ).toEqual({ x: 0, y: 0 })

    expect(
      computeTargetPanForZoom(2, 1, { x: 0, y: 0 }, { x: 500, y: -500 }, 1, { x: 300, y: 200 }),
    ).toEqual({ x: -300, y: 200 })
  })

  it('transitions viewer state through open, active change, and close', () => {
    const opening = viewerTransition({ status: 'closed' }, { type: 'open', activeId: 'one' })
    const opened = viewerTransition(opening, { type: 'opened' })
    const changed = viewerTransition(opened, { type: 'setActive', activeId: 'two' })
    const closing = viewerTransition(changed, { type: 'close' })
    const closed = viewerTransition(closing, { type: 'closed' })

    expect(opening).toEqual({ status: 'opening', activeId: 'one' })
    expect(isViewerOpen(opening)).toBe(true)
    expect(changed).toEqual({ status: 'open', activeId: 'two' })
    expect(getActiveId(changed)).toBe('two')
    expect(closed).toEqual({ status: 'closed' })
    expect(isViewerOpen(closed)).toBe(false)
    expect(getActiveId(closed)).toBeUndefined()
  })
})

describe('gesture helpers', () => {
  it('classifies idle, slide, close, pan, and edge-slide gestures', () => {
    expect(classifyGesture(4, 4, 'mouse', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('idle')
    expect(classifyGesture(40, 5, 'touch', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('slide')
    expect(classifyGesture(6, 40, 'touch', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('close')
    expect(classifyGesture(15, 12, 'touch', true, { x: 80, y: 40 }, { x: 0, y: 0 })).toBe('pan')
    expect(classifyGesture(24, 2, 'touch', true, { x: 80, y: 40 }, { x: 79, y: 0 })).toBe('slide')
  })

  it('detects double taps and close-drag ratios', () => {
    expect(isDoubleTap(200, { time: 0, clientX: 10, clientY: 10 }, 18, 14)).toBe(true)
    expect(isDoubleTap(300, { time: 0, clientX: 10, clientY: 10 }, 60, 60)).toBe(false)
    expect(computeCloseDragRatio(100, 1000)).toBeCloseTo(100 / 850, 6)
    expect(computeCloseDragRatio(1000, 300)).toBe(0.75)
  })
})
</file>
<file name="build.config.ts" path="/packages/core/build.config.ts">
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
  },
})
</file>
<file name="package.json" path="/packages/core/package.json">
{
  "name": "@nuxt-photo/core",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "devDependencies": {
    "unbuild": "^3.5.0",
    "typescript": "^5.9.2"
  }
}
</file>
<file name="tsconfig.json" path="/packages/core/tsconfig.json">
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
</file>
<file name="defaults-plugin.ts" path="/packages/nuxt/src/runtime/defaults-plugin.ts">
import { defineNuxtPlugin, type NuxtApp, useAppConfig } from '#app'
import { LightboxDefaultsKey } from '@nuxt-photo/vue'

export default defineNuxtPlugin({
  name: 'nuxt-photo:defaults',
  setup(nuxtApp: NuxtApp) {
    const config = useAppConfig() as {
      nuxtPhoto?: {
        lightbox?: {
          minZoom?: number
        }
      }
    }
    const lightbox = config.nuxtPhoto?.lightbox

    if (lightbox?.minZoom != null) {
      nuxtApp.vueApp.provide(LightboxDefaultsKey, { minZoom: lightbox.minZoom })
    }
  },
})
</file>
<file name="plugin.ts" path="/packages/nuxt/src/runtime/plugin.ts">
import { defineNuxtPlugin, type NuxtApp } from '#app'
import { useImage } from '#imports'
import type { ImageContext, ImageSource, PhotoItem } from '@nuxt-photo/core'
import { ImageAdapterKey } from '@nuxt-photo/vue/extend'

export default defineNuxtPlugin({
  name: 'nuxt-photo:image-adapter',
  setup(nuxtApp: NuxtApp) {
    const image = useImage()

    const adapter = (photo: PhotoItem, context: ImageContext): ImageSource => {
      const src = context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src

      if (context === 'preload') {
        return {
          src: image(src, { width: 1600, quality: 85 }),
          width: photo.width,
          height: photo.height,
        }
      }

      if (context === 'slide') {
        // Generate srcset explicitly — avoids getSizes() format issues with @nuxt/image v2
        // Lightbox media area is min(1240px, calc(100vw - 72px))
        const quality = 85
        const targetWidths = [640, 960, 1240, 1600, 2000]
        const widths = targetWidths.filter(w => w <= photo.width * 1.5)
        const srcsetWidths = widths.length > 0 ? widths : [Math.min(1240, photo.width)]

        const srcset = srcsetWidths
          .map(w => `${image(src, { width: w, quality })} ${w}w`)
          .join(', ')

        return {
          src: image(src, { width: Math.min(1240, photo.width), quality }),
          srcset,
          sizes: 'min(1240px, calc(100vw - 72px))',
          width: photo.width,
          height: photo.height,
        }
      }

      // thumb context: use Nuxt Image v2 breakpoint syntax (not CSS media queries)
      const sizes = 'sm:100vw md:50vw lg:400px'
      const result = image.getSizes(src, { sizes, quality: 80 })

      return {
        src: result.src,
        srcset: result.srcset,
        sizes: result.sizes,
        width: photo.width,
        height: photo.height,
      }
    }

    nuxtApp.vueApp.provide(ImageAdapterKey, adapter)
  },
})
</file>
<file name="module.ts" path="/packages/nuxt/src/module.ts">
import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule, hasNuxtModule } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface NuxtPhotoOptions {
  autoImports?: boolean
  components?: boolean | { prefix?: string }
  css?: 'none' | 'structure' | 'all'
  image?: false | {
    provider?: 'auto' | 'nuxt-image' | 'native' | 'custom'
  }
  lightbox?: {
    minZoom?: number
  }
}

type NuxtPhotoAppConfig = {
  nuxtPhoto?: {
    lightbox?: {
      minZoom?: number
    }
  }
}

// Recipe components — registered as `{prefix}{name}` (e.g. `Photo`, `PhotoAlbum`, or `NpPhoto`, `NpPhotoAlbum`)
const RECIPE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'Photo', name: 'Photo' },
  { export: 'PhotoGroup', name: 'PhotoGroup' },
  { export: 'PhotoAlbum', name: 'PhotoAlbum' },
  { export: 'PhotoCarousel', name: 'PhotoCarousel' },
]
// Primitive components — registered as `{prefix}{name}`
const PRIMITIVE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'LightboxRoot', name: 'LightboxRoot' },
  { export: 'LightboxOverlay', name: 'LightboxOverlay' },
  { export: 'LightboxViewport', name: 'LightboxViewport' },
  { export: 'LightboxSlide', name: 'LightboxSlide' },
  { export: 'LightboxControls', name: 'LightboxControls' },
  { export: 'LightboxCaption', name: 'LightboxCaption' },
  { export: 'LightboxPortal', name: 'LightboxPortal' },
  { export: 'PhotoTrigger', name: 'PhotoTrigger' },
  { export: 'PhotoImage', name: 'PhotoImage' },
]

const AUTO_IMPORTS = ['useLightbox', 'useLightboxProvider', 'responsive'] as const

export default defineNuxtModule<NuxtPhotoOptions>({
  meta: {
    name: '@nuxt-photo/nuxt',
    configKey: 'nuxtPhoto',
    compatibility: {
      nuxt: '^3.21.2 || ^4.0.0',
    },
  },
  defaults: {
    autoImports: true,
    components: {
      prefix: '',
    },
    css: 'structure',
    image: {
      provider: 'auto',
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const minZoom = options.lightbox?.minZoom

    if (options.image !== false) {
      const explicit = options.image?.provider ?? 'auto'
      const imageProvider = explicit === 'auto'
        ? (hasNuxtModule('@nuxt/image') ? 'nuxt-image' : 'native')
        : explicit

      if (imageProvider === 'nuxt-image') {
        if (!hasNuxtModule('@nuxt/image')) {
          throw new Error('[nuxt-photo] `nuxtPhoto.image.provider = "nuxt-image"` requires `@nuxt/image` to be installed in `modules`.')
        }

        nuxt.hook('modules:done', () => {
          addPlugin({
            src: resolve('./runtime/plugin'),
          }, { append: true })
        })
      }
    }

    if (minZoom != null) {
      const appConfig = nuxt.options.appConfig as NuxtPhotoAppConfig

      appConfig.nuxtPhoto = {
        ...appConfig.nuxtPhoto,
        lightbox: {
          ...appConfig.nuxtPhoto?.lightbox,
          minZoom,
        },
      }

      addPlugin({
        src: resolve('./runtime/defaults-plugin'),
      }, { append: true })
    }

    if (options.components !== false) {
      const prefix = typeof options.components === 'object' ? (options.components.prefix ?? '') : ''

      for (const component of RECIPE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: '@nuxt-photo/recipes',
        })
      }

      for (const component of PRIMITIVE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: '@nuxt-photo/vue',
        })
      }
    }

    if (options.autoImports) {
      addImports(AUTO_IMPORTS.map(name => ({ name, from: '@nuxt-photo/vue' })))
    }

    const structureCSS = [
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
      '@nuxt-photo/recipes/styles/carousel-structure.css',
    ]
    const themeCSS = [
      '@nuxt-photo/recipes/styles/lightbox-theme.css',
      '@nuxt-photo/recipes/styles/photo.css',
      '@nuxt-photo/recipes/styles/carousel-theme.css',
    ]

    const cssFiles
      = options.css === 'all' ? [...structureCSS, ...themeCSS]
        : options.css === 'structure' ? structureCSS
          : []

    for (const css of cssFiles) {
      if (!nuxt.options.css.includes(css)) {
        nuxt.options.css.push(css)
      }
    }
  },
}) as NuxtModule<NuxtPhotoOptions>
</file>
<file name="module.test.ts" path="/packages/nuxt/test/module.test.ts">
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const createResolver = vi.fn(() => ({ resolve: (path: string) => `/resolved/${path}` }))
const hasNuxtModule = vi.fn()

vi.mock('@nuxt/kit', () => ({
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule: (definition: unknown) => definition,
  hasNuxtModule,
}))

function createNuxt() {
  const hooks = new Map<string, Array<() => void>>()

  return {
    hook(name: string, callback: () => void) {
      const callbacks = hooks.get(name) ?? []
      callbacks.push(callback)
      hooks.set(name, callbacks)
    },
    callHook(name: string) {
      for (const callback of hooks.get(name) ?? []) {
        callback()
      }
    },
    options: {
      appConfig: {} as Record<string, any>,
      css: [] as string[],
    },
  }
}

let nuxtPhotoModule: Awaited<typeof import('../src/module')>['default']

describe('nuxt-photo module', () => {
  beforeAll(async () => {
    nuxtPhotoModule = (await import('../src/module')).default
  })

  beforeEach(() => {
    addComponent.mockReset()
    addImports.mockReset()
    addPlugin.mockReset()
    createResolver.mockClear()
    hasNuxtModule.mockReset()
  })

  it('does not register the image plugin in native mode', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'native' },
    }, nuxt)

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('registers the nuxt image plugin when explicitly enabled', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'nuxt-image' },
    }, nuxt)

    nuxt.callHook('modules:done')

    expect(addPlugin).toHaveBeenCalledWith({
      src: '/resolved/./runtime/plugin',
    }, {
      append: true,
    })
  })

  it('registers the defaults plugin when lightbox defaults are configured', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      lightbox: { minZoom: 2 },
    }, nuxt)

    expect(addPlugin).toHaveBeenCalledWith({
      src: '/resolved/./runtime/defaults-plugin',
    }, {
      append: true,
    })
    expect(nuxt.options.appConfig).toEqual({
      nuxtPhoto: {
        lightbox: {
          minZoom: 2,
        },
      },
    })
  })

  it('throws when nuxt image mode is requested without @nuxt/image', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    expect(() => nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'nuxt-image' },
    }, nuxt)).toThrow(/requires `@nuxt\/image`/)
  })

  it('injects structure-only CSS by default (no theme)', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.css).toEqual([
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
      '@nuxt-photo/recipes/styles/carousel-structure.css',
    ])
  })

  it('injects all CSS (structure + theme) with css: "all"', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'all' }, nuxt)

    expect(nuxt.options.css).toEqual([
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
      '@nuxt-photo/recipes/styles/carousel-structure.css',
      '@nuxt-photo/recipes/styles/lightbox-theme.css',
      '@nuxt-photo/recipes/styles/photo.css',
      '@nuxt-photo/recipes/styles/carousel-theme.css',
    ])
  })

  it('skips component registration when disabled', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      components: false,
    }, nuxt)

    expect(addComponent).not.toHaveBeenCalled()
  })

  it('registers unprefixed components by default', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Photo',
      export: 'Photo',
      filePath: '@nuxt-photo/recipes',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'PhotoImage',
      export: 'PhotoImage',
      filePath: '@nuxt-photo/vue',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'PhotoAlbum',
      export: 'PhotoAlbum',
      filePath: '@nuxt-photo/recipes',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'LightboxRoot',
      export: 'LightboxRoot',
      filePath: '@nuxt-photo/vue',
    }))
    expect(addComponent).not.toHaveBeenCalledWith(expect.objectContaining({
      export: 'Lightbox',
      filePath: '@nuxt-photo/recipes',
    }))
  })

  it('registers components with custom prefix', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      components: { prefix: 'Np' },
    }, nuxt)

    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NpPhoto',
      export: 'Photo',
      filePath: '@nuxt-photo/recipes',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NpPhotoImage',
      export: 'PhotoImage',
      filePath: '@nuxt-photo/vue',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NpLightboxRoot',
      export: 'LightboxRoot',
      filePath: '@nuxt-photo/vue',
    }))
  })

  it('auto-detects @nuxt/image when provider is auto (default)', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(addPlugin).toHaveBeenCalledWith({
      src: '/resolved/./runtime/plugin',
    }, {
      append: true,
    })
  })

  it('falls back to native when @nuxt/image is not installed (auto mode)', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('skips image provider entirely when image: false', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: false,
    }, nuxt)

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('only auto-imports vue composables', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addImports).toHaveBeenCalledWith([
      { name: 'useLightbox', from: '@nuxt-photo/vue' },
      { name: 'useLightboxProvider', from: '@nuxt-photo/vue' },
      { name: 'responsive', from: '@nuxt-photo/vue' },
    ])
  })
})
</file>
<file name="package.json" path="/packages/nuxt/package.json">
{
  "name": "@nuxt-photo/nuxt",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/module.mjs",
      "types": "./dist/module.d.mts"
    }
  },
  "main": "./dist/module.mjs",
  "files": ["dist"],
  "scripts": {
    "build": "nuxt-module-build build",
    "dev": "nuxt-module-build build --stub"
  },
  "dependencies": {
    "@nuxt-photo/core": "workspace:*",
    "@nuxt-photo/vue": "workspace:*",
    "@nuxt-photo/recipes": "workspace:*",
    "@nuxt/kit": "^4.4.2",
    "@nuxt/schema": "^4.4.2"
  },
  "peerDependencies": {
    "@nuxt/image": "^2.0.0",
    "nuxt": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "@nuxt/image": {
      "optional": true
    }
  },
  "devDependencies": {
    "@nuxt/module-builder": "^1.0.2",
    "nuxt": "^4.4.2",
    "typescript": "^5.9.2"
  }
}
</file>
<file name="tsconfig.json" path="/packages/nuxt/tsconfig.json">
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
</file>
<file name="CarouselLayout.vue" path="/packages/recipes/src/components/internal/CarouselLayout.vue">
<template>
  <div v-if="photos.length === 0" class="np-carousel np-carousel--empty" v-bind="$attrs" />

  <div v-else class="np-carousel" :style="cssVarStyle" v-bind="$attrs">
    <div ref="emblaRef" class="np-carousel__viewport">
      <div class="np-carousel__container">
        <div
          v-for="(photo, index) in photos"
          :key="photoId(photo)"
          class="np-carousel__slide"
          :class="slideClass"
          v-bind="interactiveAttrs(photo, index)"
        >
          <div
            :ref="setSlideRef ? setSlideElRef(index) : undefined"
            style="width:100%;height:100%"
          >
          <slot name="slide" :photo="photo" :index="index" :selected="selectedSlideSet.has(index)" :open="() => onSlideActivate?.(photo)">
              <PhotoImage
                :photo="photo"
                context="slide"
                :adapter="adapter"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="np-carousel__media"
                :class="imgClass"
              />
            </slot>
          </div>
        </div>
      </div>

      <div v-if="showMultiControls && (showArrows || showCounter)" class="np-carousel__controls" :class="controlsClass">
        <template v-if="showArrows">
          <slot
            name="controls"
            :go-to-prev="goToPrev"
            :go-to-next="goToNext"
            :can-go-to-prev="canPrev"
            :can-go-to-next="canNext"
            :selected-index="selectedIndex"
            :snap-count="snapCount"
            :go-to="goTo"
          >
            <button
              type="button"
              class="np-carousel__arrow np-carousel__arrow--prev"
              :disabled="!canPrev"
              aria-label="Previous slide"
              @click="goToPrev()"
            >
              <slot name="prev">‹</slot>
            </button>
            <button
              type="button"
              class="np-carousel__arrow np-carousel__arrow--next"
              :disabled="!canNext"
              aria-label="Next slide"
              @click="goToNext()"
            >
              <slot name="next">›</slot>
            </button>
          </slot>
        </template>
        <template v-else>
          <span />
          <span />
        </template>
      </div>

      <div v-if="showMultiControls && showCounter" class="np-carousel__counter" aria-live="polite">
        {{ selectedIndex + 1 }} / {{ photos.length }}
      </div>
    </div>

    <div v-if="hasCaption" class="np-carousel__caption" :class="captionClass">
      <slot name="caption" :photo="photos[selectedIndex]" :index="selectedIndex" :count="photos.length">
        {{ photos[selectedIndex]?.caption }}
      </slot>
    </div>

    <div v-if="showMultiControls && showDots" class="np-carousel__dots">
      <slot name="dots" :snaps="snaps" :selected-index="selectedSnapIndex" :go-to="goTo">
        <button
          v-for="(slideIndex, i) in snaps"
          :key="i"
          type="button"
          class="np-carousel__dot"
          :class="{ 'np-carousel__dot--selected': i === selectedSnapIndex }"
          :aria-label="`Go to slide ${slideIndex + 1}`"
          :aria-current="i === selectedSnapIndex ? 'true' : undefined"
          @click="goTo(slideIndex)"
        />
      </slot>
    </div>

    <div v-if="showMultiControls && showThumbnails" class="np-carousel__thumbs">
      <div ref="thumbsRef" class="np-carousel__thumbs-viewport">
        <div class="np-carousel__thumbs-container">
          <button
            v-for="(photo, index) in photos"
            :key="photoId(photo)"
            type="button"
            class="np-carousel__thumb"
            :class="[{ 'np-carousel__thumb--selected': selectedSlideSet.has(index) }, thumbClass]"
            :aria-label="`Go to slide ${index + 1}`"
            :aria-current="selectedSlideSet.has(index) ? 'true' : undefined"
            @click="goTo(index)"
          >
            <slot name="thumb" :photo="photo" :index="index" :selected="selectedSlideSet.has(index)" :go-to="goTo">
              <PhotoImage
                :photo="photo"
                context="thumb"
                :adapter="adapter"
                loading="lazy"
                class="np-carousel__thumb-img"
              />
            </slot>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, useSlots, watch, type ComponentPublicInstance } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import { PhotoImage } from '@nuxt-photo/vue'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
} from '@nuxt-photo/vue'
import { photoId, type ImageAdapter, type PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })

defineSlots<{
  slide?: (props: CarouselSlideSlotProps) => unknown
  controls?: (props: CarouselControlsSlotProps) => unknown
  caption?: (props: CarouselCaptionSlotProps) => unknown
  dots?: (props: CarouselDotsSlotProps) => unknown
  thumb?: (props: CarouselThumbSlotProps) => unknown
  prev?: () => unknown
  next?: () => unknown
}>()

const props = defineProps<{
  photos: PhotoItem[]
  adapter?: ImageAdapter
  options: EmblaOptionsType
  plugins: EmblaPluginType[]
  thumbsOptions: EmblaOptionsType

  showArrows: boolean
  showThumbnails: boolean
  showCounter: boolean
  showDots: boolean

  slideSize?: string
  slideAspect?: string
  gap?: string
  thumbSize?: string

  slideClass?: string
  imgClass?: string
  thumbClass?: string
  captionClass?: string
  controlsClass?: string

  // Lightbox integration (only provided when wrapped in <PhotoGroup>)
  onSlideActivate?: (photo: PhotoItem) => void
  setSlideRef?: ((index: number) => (el: Element | ComponentPublicInstance | null) => void)
}>()

const slots = useSlots()

const optionsRef = toRef(props, 'options')
const pluginsRef = toRef(props, 'plugins')
const thumbsOptionsRef = toRef(props, 'thumbsOptions')

const [emblaRef, emblaApi] = useEmblaCarousel(optionsRef, pluginsRef)
const [thumbsRef, thumbsApi] = useEmblaCarousel(thumbsOptionsRef)

const selectedIndex = ref(0)
const selectedSnapIndex = ref(0)
const selectedSlides = ref<number[]>([])
const snapCount = ref(0)
const snapTargets = ref<number[]>([])
const canPrev = ref(false)
const canNext = ref(false)
const snaps = computed(() => snapTargets.value)
const selectedSlideSet = computed(() => new Set(selectedSlides.value))

const showMultiControls = computed(() => props.photos.length > 1)

const hasCaption = computed(() => {
  if (slots.caption) return props.photos.length > 0
  return !!props.photos[selectedIndex.value]?.caption
})

const cssVarStyle = computed(() => {
  const vars: Record<string, string> = {}
  if (props.slideSize) vars['--np-carousel-slide-size'] = props.slideSize
  if (props.slideAspect) vars['--np-carousel-slide-aspect'] = props.slideAspect
  if (props.gap) vars['--np-carousel-gap'] = props.gap
  if (props.thumbSize) vars['--np-carousel-thumb-size'] = props.thumbSize
  return vars
})

function fallbackSlidesBySnap() {
  const slidesToScroll = props.options.slidesToScroll
  const chunkSize = typeof slidesToScroll === 'number' && slidesToScroll > 1 ? slidesToScroll : 1
  const groups: number[][] = []

  for (let start = 0; start < props.photos.length; start += chunkSize) {
    groups.push(Array.from({ length: Math.min(chunkSize, props.photos.length - start) }, (_, offset) => start + offset))
  }

  return groups
}

function getSnapState(api: EmblaCarouselType) {
  const scrollSnapList = api.internalEngine().scrollSnapList
  const slidesBySnap = scrollSnapList.slidesBySnap.length ? scrollSnapList.slidesBySnap : fallbackSlidesBySnap()
  const snapBySlide = Object.keys(scrollSnapList.snapBySlide).length
    ? scrollSnapList.snapBySlide
    : Object.fromEntries(slidesBySnap.flatMap((slides, snapIndex) => slides.map(slideIndex => [slideIndex, snapIndex])))
  const snapTotal = api.snapList().length || slidesBySnap.length

  return {
    slidesBySnap,
    snapBySlide,
    snapTotal,
  }
}

function syncThumbs(api: EmblaCarouselType) {
  if (!props.showThumbnails) return
  thumbsApi.value?.goTo(selectedIndex.value)
}

function syncAutoplay(api: EmblaCarouselType) {
  if (!props.plugins.some(plugin => plugin?.name === 'autoplay')) return
  if (api.snapList().length <= 1) return
  api.plugins().autoplay?.play()
}

function syncState(api: EmblaCarouselType, forcedSnap?: number) {
  const { slidesBySnap, snapTotal } = getSnapState(api)
  const maxSnapIndex = Math.max(0, snapTotal - 1)
  const selectedSnap = Math.min(forcedSnap ?? api.selectedSnap(), maxSnapIndex)
  const activeSlides = slidesBySnap[selectedSnap] ?? [selectedSnap]
  const loopEnabled = !!props.options.loop

  selectedSnapIndex.value = selectedSnap
  selectedSlides.value = activeSlides
  selectedIndex.value = activeSlides[0] ?? 0
  snapCount.value = snapTotal
  snapTargets.value = slidesBySnap.map(slides => slides[0] ?? 0)
  canPrev.value = api.snapList().length ? api.canGoToPrev() : (loopEnabled ? snapTotal > 1 : selectedSnap > 0)
  canNext.value = api.snapList().length ? api.canGoToNext() : (loopEnabled ? snapTotal > 1 : selectedSnap < maxSnapIndex)
}

function handleSelect(api: EmblaCarouselType) {
  syncState(api)
  syncThumbs(api)
}

watch(emblaApi, (api) => {
  if (!api) return

  const onSelect = (currentApi: EmblaCarouselType) => {
    handleSelect(currentApi)
  }
  const onReinit = (currentApi: EmblaCarouselType) => {
    handleSelect(currentApi)
    syncAutoplay(currentApi)
  }

  onReinit(api)
  api.on('select', onSelect)
  api.on('reinit', onReinit)
}, { immediate: true })

watch(() => props.photos.length, () => {
  snapTargets.value = Array.from({ length: props.photos.length }, (_, i) => i)
}, { immediate: true })

function clampIndex(i: number) {
  const max = Math.max(0, props.photos.length - 1)
  return Math.min(Math.max(i, 0), max)
}

function goTo(index: number, instant = false) {
  const target = clampIndex(index)
  const api = emblaApi.value
  if (api) {
    const targetSnap = getSnapState(api).snapBySlide[target] ?? target
    api.goTo(targetSnap, instant)
    if (instant) {
      syncState(api, targetSnap)
      syncThumbs(api)
    }
  }
  else {
    selectedIndex.value = target
    selectedSnapIndex.value = target
    selectedSlides.value = [target]
  }
}

function goToNext(instant = false) {
  const api = emblaApi.value
  if (api) {
    const nextSnap = props.options.loop
      ? (selectedSnapIndex.value + 1) % Math.max(1, snapCount.value)
      : Math.min(selectedSnapIndex.value + 1, Math.max(0, snapCount.value - 1))
    api.goToNext(instant)
    if (instant) {
      syncState(api, nextSnap)
      syncThumbs(api)
    }
    return
  }
  goTo(selectedIndex.value + 1, instant)
}

function goToPrev(instant = false) {
  const api = emblaApi.value
  if (api) {
    const prevSnap = props.options.loop
      ? (selectedSnapIndex.value - 1 + Math.max(1, snapCount.value)) % Math.max(1, snapCount.value)
      : Math.max(selectedSnapIndex.value - 1, 0)
    api.goToPrev(instant)
    if (instant) {
      syncState(api, prevSnap)
      syncThumbs(api)
    }
    return
  }
  goTo(selectedIndex.value - 1, instant)
}

function setSlideElRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    props.setSlideRef?.(index)(el)
  }
}

function interactiveAttrs(photo: PhotoItem, index: number) {
  if (!props.onSlideActivate) return {}
  return {
    role: 'button',
    tabindex: 0,
    style: { cursor: 'pointer' },
    onClick: () => props.onSlideActivate?.(photo),
    onKeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        props.onSlideActivate?.(photo)
      }
    },
    'data-index': index,
  }
}

function selectedSnap() {
  return emblaApi.value?.selectedSnap() ?? selectedIndex.value
}

function reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]) {
  emblaApi.value?.reInit(options, plugins)
}

defineExpose({
  emblaApi,
  thumbsApi,
  selectedIndex,
  goTo,
  goToNext,
  goToPrev,
  selectedSnap,
  reInit,
})

onBeforeUnmount(() => {
  emblaApi.value?.destroy()
  thumbsApi.value?.destroy()
})
</script>
</file>
<file name="index.ts" path="/packages/recipes/src/components/index.ts">
export { default as Photo } from './Photo.vue'
export { default as PhotoGroup } from './PhotoGroup.vue'
export { default as PhotoAlbum } from './PhotoAlbum.vue'
export { default as PhotoCarousel } from './PhotoCarousel.vue'
export { default as Lightbox } from './Lightbox.vue'
</file>
<file name="InternalLightbox.vue" path="/packages/recipes/src/components/InternalLightbox.vue">
<template>
  <LightboxRoot class="np-lightbox" role="dialog" aria-modal="true">
    <LightboxOverlay class="np-lightbox__backdrop" />

    <div class="np-lightbox__ui">
      <LightboxControls v-slot="{ activeIndex, activePhoto, photos, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
        <SlotProxy
          v-if="slots?.toolbar"
          :render="slots!.toolbar"
          :props="{ activeIndex, activePhoto, photos, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }"
        />
        <div v-else class="np-lightbox__topbar">
          <div class="np-lightbox__counter">
            {{ activeIndex + 1 }} / {{ count }}
          </div>

          <div class="np-lightbox__actions">
            <button class="np-lightbox__btn" aria-label="Previous" :disabled="controlsDisabled" @click="prev">&#8592;</button>
            <button class="np-lightbox__btn" aria-label="Next" :disabled="controlsDisabled" @click="next">&#8594;</button>
            <button
              class="np-lightbox__btn"
              :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
              :disabled="controlsDisabled || !zoomAllowed"
              @click="toggleZoom()"
            >
              {{ isZoomedIn ? 'Fit' : 'Zoom' }}
            </button>
            <button class="np-lightbox__btn np-lightbox__btn--close" aria-label="Close" :disabled="controlsDisabled" @click="close">&#10005;</button>
          </div>
        </div>
      </LightboxControls>

      <div class="np-lightbox__stage">
        <LightboxViewport
          v-slot="{ photos, viewportRef, mediaOpacity }"
          class="np-lightbox__media"
        >
          <div class="np-lightbox__viewport" :ref="viewportRef" :style="{ opacity: mediaOpacity }">
            <div class="np-lightbox__container">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="np-lightbox__slide"
              >
                <template v-if="slots?.slide" #default="slotProps">
                  <SlotProxy :render="slots!.slide!" :props="slotProps" />
                </template>
              </LightboxSlide>
            </div>
          </div>
        </LightboxViewport>

        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo, activeIndex }">
          <SlotProxy v-if="slots?.caption" :render="slots!.caption" :props="{ photo, activeIndex }" />
          <template v-else>
            <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
            <p v-if="photo?.description">{{ photo.description }}</p>
          </template>
        </LightboxCaption>
      </div>
    </div>

    <LightboxPortal class="np-lightbox__ghost" />
  </LightboxRoot>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxPortal,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
} from '@nuxt-photo/vue'
import { LightboxSlotsKey } from '@nuxt-photo/vue/extend'
import SlotProxy from './SlotProxy'

const slots = inject(LightboxSlotsKey, null)
</script>
</file>
<file name="Lightbox.vue" path="/packages/recipes/src/components/Lightbox.vue">
<template>
  <LightboxRoot class="np-lightbox" role="dialog" aria-modal="true">
    <LightboxOverlay class="np-lightbox__backdrop" />

    <div class="np-lightbox__ui">
      <LightboxControls v-slot="{ activeIndex, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
        <div class="np-lightbox__topbar">
          <slot name="counter" :active-index="activeIndex" :count="count">
            <div class="np-lightbox__counter">
              {{ activeIndex + 1 }} / {{ count }}
            </div>
          </slot>

          <div class="np-lightbox__actions">
            <slot
              name="actions"
              :prev="prev"
              :next="next"
              :close="close"
              :toggle-zoom="toggleZoom"
              :is-zoomed-in="isZoomedIn"
              :zoom-allowed="zoomAllowed"
              :controls-disabled="controlsDisabled"
            >
              <button class="np-lightbox__btn" aria-label="Previous" :disabled="controlsDisabled" @click="prev">&#8592;</button>
              <button class="np-lightbox__btn" aria-label="Next" :disabled="controlsDisabled" @click="next">&#8594;</button>
              <button
                class="np-lightbox__btn"
                :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
                :disabled="controlsDisabled || !zoomAllowed"
                @click="toggleZoom()"
              >
                {{ isZoomedIn ? 'Fit' : 'Zoom' }}
              </button>
              <button class="np-lightbox__btn np-lightbox__btn--close" aria-label="Close" :disabled="controlsDisabled" @click="close">&#10005;</button>
            </slot>
          </div>
        </div>
      </LightboxControls>

      <div class="np-lightbox__stage">
        <LightboxViewport v-slot="{ photos, viewportRef, mediaOpacity }" class="np-lightbox__media">
          <div class="np-lightbox__viewport" :ref="viewportRef" :style="{ opacity: mediaOpacity }">
            <div class="np-lightbox__container">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="np-lightbox__slide"
              >
                <template v-if="$slots.slide" #default="slotProps">
                  <slot name="slide" v-bind="slotProps" />
                </template>
              </LightboxSlide>
            </div>
          </div>
        </LightboxViewport>

        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo, activeIndex }">
          <slot name="caption" :photo="photo" :index="activeIndex">
            <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
            <p v-if="photo?.description">{{ photo.description }}</p>
          </slot>
        </LightboxCaption>
      </div>
    </div>

    <LightboxPortal class="np-lightbox__ghost" />
  </LightboxRoot>
</template>

<script setup lang="ts">
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxPortal,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
} from '@nuxt-photo/vue'
import type { LightboxCaptionSlotProps, LightboxControlsSlotProps, LightboxSlideSlotProps } from '@nuxt-photo/vue'

interface LightboxCounterSlotProps {
  activeIndex: number
  count: number
}

interface LightboxActionsSlotProps extends Omit<LightboxControlsSlotProps, 'activeIndex' | 'activePhoto' | 'photos' | 'count'> {}

interface LightboxCaptionRecipeSlotProps {
  photo: LightboxCaptionSlotProps['photo']
  index: number
}

defineSlots<{
  counter?: (props: LightboxCounterSlotProps) => unknown
  actions?: (props: LightboxActionsSlotProps) => unknown
  slide?: (props: LightboxSlideSlotProps) => unknown
  caption?: (props: LightboxCaptionRecipeSlotProps) => unknown
}>()
</script>
</file>
<file name="Photo.vue" path="/packages/recipes/src/components/Photo.vue">
<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="{ ...$attrs, ...interactiveAttrs }"
    :style="figureStyle"
  >
    <PhotoImage :photo="photo" context="thumb" :adapter="adapter" :loading="loading ?? 'lazy'" class="np-photo__img" :class="imgClass" />
    <figcaption v-if="photo.caption" class="np-photo__caption" :class="captionClass">{{ photo.caption }}</figcaption>
  </figure>
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx" />
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, useSlots, type Component } from 'vue'

defineOptions({ inheritAttrs: false })
import { PhotoImage, useLightboxProvider } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
} from '@nuxt-photo/vue/extend'
import type { PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

const props = defineProps<{
  photo: PhotoItem
  /** Opens a solo lightbox when this Photo is not inside a PhotoGroup */
  lightbox?: boolean | Component
  /** Opt this photo out of a parent PhotoGroup (renders as plain image) */
  lightboxIgnore?: boolean
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
  /** Extra classes for the inner img element */
  imgClass?: string
  /** Extra classes for the caption element */
  captionClass?: string
}>()
const slots = useSlots()

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

// Standalone mode: lightbox prop set and no parent group
const isSolo = computed(() => !group && !!props.lightbox && !props.lightboxIgnore)

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? useLightboxProvider(computed(() => props.photo), {
    resolveSlide: photo => {
      if ((photo !== props.photo && String(photo.id) !== String(props.photo.id)) || !slots.slide) return null
      return slotProps => slots.slide?.(slotProps) ?? null
    },
  })
  : null

const soloLightboxComponent = computed<Component>(() => {
  if (props.lightbox === true || props.lightbox === undefined) {
    return injectedLightbox ?? InternalLightbox
  }
  return (props.lightbox as Component) ?? InternalLightbox
})

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value === props.photo)

// Auto-group mode: inside a PhotoGroup with auto-collection
const isAutoGrouped = computed(() => !!group && !props.lightboxIgnore && group.mode === 'auto')
const isInteractive = computed(() => isSolo.value || isAutoGrouped.value)

const figureStyle = computed(() => {
  if (isSolo.value) {
    return { margin: 0, opacity: soloCtx && soloCtx.hiddenThumbIndex.value === 0 ? 0 : 1, cursor: 'pointer' }
  }
  if (isAutoGrouped.value) {
    return { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
  }
  return { margin: 0 }
})

function handleClick() {
  if (isSolo.value) soloOpen()
  else if (isAutoGrouped.value) group!.open(props.photo)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    if (e.key === ' ') e.preventDefault()
    handleClick()
  }
}

const interactiveAttrs = computed(() => {
  if (!isInteractive.value) return {}
  return { role: 'button' as const, tabindex: 0, onClick: handleClick, onKeydown: handleKeydown }
})

// Registration with parent group (auto mode only)
const id = Symbol()

onMounted(() => {
  if (soloCtx) {
    soloCtx.setThumbRef(0)(thumbRef.value)
  }
  if (group && group.mode === 'auto' && !props.lightboxIgnore && !isSolo.value) {
    group.register(
      id,
      props.photo,
      () => thumbRef.value,
      slots.slide ? slotProps => slots.slide?.(slotProps) ?? null : null,
    )
  }
})

onBeforeUnmount(() => {
  if (group && group.mode === 'auto' && !props.lightboxIgnore && !isSolo.value) {
    group.unregister(id)
  }
})

async function soloOpen() {
  if (!soloCtx) return
  soloCtx.setThumbRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
</script>
</file>
<file name="PhotoAlbum.vue" path="/packages/recipes/src/components/PhotoAlbum.vue">
<template>
  <div
    ref="containerRef"
    class="np-album"
    :class="[scopeClass, `np-album--${layoutType}`]"
    :style="containerStyle"
  >
    <template v-if="layoutType === 'rows'">
      <component v-if="containerQueryCSS" :is="'style'">{{ containerQueryCSS }}</component>
      <div :style="ssrWrapperStyle">
        <div
          v-for="item in rowItems"
          :key="photoId(item.photo)"
          class="np-album__item"
          :class="[containerQueriesActive ? `np-item-${item.index}` : undefined, itemClass]"
          :style="item.style"
          v-bind="itemBindings(item.photo, item.index)"
        >
          <div :style="isHidden(item.photo) && !$slots.thumbnail ? { opacity: 0 } : undefined" style="width:100%;height:100%">
            <slot
              v-if="$slots.thumbnail"
              name="thumbnail"
              :photo="item.photo"
              :index="item.index"
              :width="item.width"
              :height="item.height"
              :hidden="isHidden(item.photo)"
            />
            <PhotoImage
              v-else
              :photo="item.photo"
              context="thumb"
              :adapter="adapter"
              loading="lazy"
              :sizes="item.computedSizes"
              class="np-album__img"
              :class="imgClass"
              :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${item.photo.width} / ${item.photo.height}` }"
            />
          </div>
        </div>
        <!-- Absorbs remaining space in the last row so photos don't stretch to fill it -->
        <span style="flex-grow:9999;flex-basis:0;height:0;margin:0;padding:0" aria-hidden="true" />
      </div>
    </template>

    <template v-else>
      <template v-if="!isMounted && breakpointSnapshots.length > 0">
        <component :is="'style'" v-if="containerQueryCSS">{{ containerQueryCSS }}</component>
        <div
          v-for="snap in breakpointSnapshots"
          :key="snap.spanKey"
          :class="[snapshotClass, 'np-album__bp-snapshot']"
          :data-bp="snap.spanKey"
          :style="snapshotWrapperStyle(snap, breakpointSnapshots.length > 1)"
        >
          <div
            v-for="group in snap.groups"
            :key="`${snap.spanKey}-${group.type}-${group.index}`"
            class="np-album__column"
            :style="snapshotGroupStyle(group, snap)"
          >
            <div
              v-for="entry in group.entries"
              :key="`${snap.spanKey}-${entry.photo.id}`"
              class="np-album__item"
              :class="itemClass"
              :style="snapshotItemStyle(entry, group, snap)"
              v-bind="itemBindings(entry.photo, entry.index)"
            >
              <div style="width:100%;height:100%">
                <slot
                  v-if="$slots.thumbnail"
                  name="thumbnail"
                  :photo="entry.photo"
                  :index="entry.index"
                  :width="entry.width"
                  :height="entry.height"
                  :hidden="false"
                />
                <PhotoImage
                  v-else
                  :photo="entry.photo"
                  context="thumb"
                  :adapter="adapter"
                  loading="lazy"
                  class="np-album__img"
                  :class="imgClass"
                  :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${entry.photo.width} / ${entry.photo.height}` }"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Approximate fallback (no breakpoints, no defaultContainerWidth). -->
      <template v-else-if="!isMounted">
        <div :style="ssrWrapperStyle">
          <div
            v-for="(photo, index) in photos"
            :key="photoId(photo)"
            class="np-album__item"
            :class="itemClass"
            :style="ssrItemStyle(photo)"
            v-bind="itemBindings(photo, index)"
          >
            <div style="width:100%;height:100%">
              <slot
                v-if="$slots.thumbnail"
                name="thumbnail"
                :photo="photo"
                :index="index"
                :width="photo.width"
                :height="photo.height"
                :hidden="false"
              />
              <PhotoImage
                v-else
                :photo="photo"
                context="thumb"
                :adapter="adapter"
                loading="lazy"
                class="np-album__img"
                :class="imgClass"
                :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${photo.width} / ${photo.height}` }"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <template v-if="groups.length === 0 && photos.length > 0">
          <div class="np-album__skeleton" />
        </template>

        <template v-else>
          <div
            v-for="group in groups"
            :key="`${group.type}-${group.index}`"
            :class="group.type === 'row' ? 'np-album__row' : 'np-album__column'"
            :style="groupStyle(group)"
          >
            <div
              v-for="entry in group.entries"
              :key="entry.photo.id"
              class="np-album__item"
              :class="itemClass"
              :style="itemStyle(entry, group)"
              v-bind="itemBindings(entry.photo, entry.index)"
            >
              <div
                :style="isHidden(entry.photo) && !$slots.thumbnail ? { opacity: 0 } : undefined"
                style="width:100%;height:100%"
              >
                <slot
                  v-if="$slots.thumbnail"
                  name="thumbnail"
                  :photo="entry.photo"
                  :index="entry.index"
                  :width="entry.width"
                  :height="entry.height"
                  :hidden="isHidden(entry.photo)"
                />
                <PhotoImage
                  v-else
                  :photo="entry.photo"
                  context="thumb"
                  :adapter="adapter"
                  loading="lazy"
                  class="np-album__img"
                  :class="imgClass"
                  :style="{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${entry.photo.width} / ${entry.photo.height}` }"
                />
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>

  <!-- Own lightbox — only rendered when not inside a parent PhotoGroup -->
  <component :is="LightboxComponent" v-if="hasOwnLightbox && LightboxComponent" />
</template>

<script setup lang="ts">
import { computed, inject, provide, watch, onBeforeUnmount, useSlots, type Component, type ComponentPublicInstance } from 'vue'
import { PhotoImage, useLightboxProvider } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  LightboxSlotsKey,
  type LightboxSlotOverrides,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/extend'
import {
  mergeResponsiveBreakpoints,
  photoId,
  type PhotoItem,
  type PhotoAdapter,
  type ImageAdapter,
  type AlbumLayout,
  type ResponsiveParameter,
} from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'
import { usePhotoLayout } from '../composables/usePhotoLayout'

const props = withDefaults(defineProps<{
  photos: PhotoItem[] | any[]
  /** Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS/API data directly. */
  photoAdapter?: PhotoAdapter
  /**
   * Layout algorithm and its options. Pass a string for defaults, or an object for full control.
   *
   * @example
   * layout="rows"
   * :layout="{ type: 'rows', targetRowHeight: 280 }"
   */
  layout?: AlbumLayout | AlbumLayout['type']
  /** Shorthand for rows layout. Ignored unless `layout` resolves to `rows`. */
  targetRowHeight?: ResponsiveParameter<number>
  /** Shorthand for columns/masonry layouts. Ignored unless `layout` resolves to `columns` or `masonry`. */
  columns?: ResponsiveParameter<number>
  /** Gap between images in pixels. Accepts a responsive function. @default 8 */
  spacing?: ResponsiveParameter<number>
  /** Outer padding around each image in pixels. Accepts a responsive function. @default 0 */
  padding?: ResponsiveParameter<number>
  /**
   * Assumed container width in pixels for SSR.
   * When set, the JS row layout runs on the server so the SSR HTML matches the
   * client-hydrated layout — eliminating CLS.
   * Combine with `breakpoints` so both server and client snap to the same width.
   * A value of `0` has no effect; omit the prop to keep the CSS flex-grow fallback.
   */
  defaultContainerWidth?: number
  /**
   * Snap the observed container width down to the largest breakpoint ≤ actual width.
   * Prevents re-layout on sub-pixel fluctuations and scrollbar oscillation.
   * When used without `defaultContainerWidth`, snapping only applies after mount.
   */
  breakpoints?: readonly number[]
  /**
   * `<img sizes>` hint for the rows layout.
   * `size` describes the album container width (e.g. `'100vw'`).
   * `sizes` adds viewport-specific overrides prepended to the default.
   */
  sizes?: {
    size: string
    sizes?: Array<{ viewport: string; size: string }>
  }
  adapter?: ImageAdapter
  /** Whether to enable lightbox. @default true */
  lightbox?: boolean | Component
  /** Transition mode for lightbox open/close */
  transition?: LightboxTransitionOption
  /** Extra classes for each album item wrapper */
  itemClass?: string
  /** Extra classes for each album img element */
  imgClass?: string
}>(), {
  layout: 'rows',
  spacing: 8,
  padding: 0,
  lightbox: true,
})

// Normalize layout prop: string → object with defaults
const normalizedLayout = computed<AlbumLayout>(() => {
  const raw = props.layout
  if (typeof raw === 'object') {
    switch (raw.type) {
      case 'rows':
        return { ...raw, targetRowHeight: raw.targetRowHeight ?? props.targetRowHeight }
      case 'columns':
      case 'masonry':
        return { ...raw, columns: raw.columns ?? props.columns }
    }
  }
  switch (raw) {
    case 'rows': return { type: 'rows', targetRowHeight: props.targetRowHeight }
    case 'columns': return { type: 'columns', columns: props.columns }
    case 'masonry': return { type: 'masonry', columns: props.columns }
    default: {
      if ((globalThis as any).process?.env?.NODE_ENV !== 'production') {
        console.warn(`[nuxt-photo] Unknown layout type "${raw}", falling back to "rows"`)
      }
      return { type: 'rows', targetRowHeight: props.targetRowHeight }
    }
  }
})

if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production' && props.defaultContainerWidth === 0) {
  console.warn('[nuxt-photo] defaultContainerWidth=0 has no effect; omit it or use a positive value')
}

// ─── Photos (with optional adapter) ──────────────────────────────────────────

const photos = computed<PhotoItem[]>(() =>
  props.photoAdapter ? props.photos.map(props.photoAdapter) : props.photos as PhotoItem[],
)

// ─── Layout ──────────────────────────────────────────────────────────────────

const hasLightbox = computed(() => props.lightbox !== false)

const layoutType = computed(() => normalizedLayout.value.type)
const layoutColumns = computed(() => {
  const l = normalizedLayout.value
  if (l.type === 'columns' || l.type === 'masonry') {
    return l.columns ?? 3
  }
  return 3
})
const layoutTargetRowHeight = computed(() => {
  const l = normalizedLayout.value
  return l.type === 'rows' ? (l.targetRowHeight ?? 300) : 300
})

const effectiveBreakpoints = computed<readonly number[] | undefined>(() => {
  if (props.breakpoints?.length) return props.breakpoints

  return mergeResponsiveBreakpoints([
    props.spacing,
    props.padding,
    layoutColumns.value,
    layoutTargetRowHeight.value,
  ])
})

const {
  containerRef, isMounted, scopeClass, snapshotClass, containerStyle,
  containerQueryCSS, containerQueriesActive,
  breakpointSnapshots,
  groups, rowItems,
  ssrWrapperStyle, ssrItemStyle,
  groupStyle, itemStyle,
  snapshotGroupStyle, snapshotItemStyle, snapshotWrapperStyle,
  maybeWarnApproximate,
} = usePhotoLayout({
  photos,
  layout: layoutType,
  columns: layoutColumns,
  spacing: computed(() => props.spacing),
  padding: computed(() => props.padding),
  targetRowHeight: layoutTargetRowHeight,
  defaultContainerWidth: props.defaultContainerWidth,
  breakpoints: effectiveBreakpoints.value,
  sizes: props.sizes,
  interactive: hasLightbox,
})

maybeWarnApproximate()

// ─── Lightbox ────────────────────────────────────────────────────────────────

const parentGroup = inject(PhotoGroupContextKey, null)
const injectedLightbox = inject(LightboxComponentKey, null)

const hasOwnLightbox = !parentGroup && props.lightbox !== false
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? InternalLightbox
  return props.lightbox as Component
})

const ownCtx = !parentGroup ? useLightboxProvider(photos, { transition: props.transition }) : null

// Forward #toolbar, #caption, #slide slots into the lightbox via injection
const albumSlots = useSlots()
if (hasOwnLightbox) {
  const slotOverrides = computed<LightboxSlotOverrides>(() => {
    const overrides: LightboxSlotOverrides = {}
    if (albumSlots.toolbar) overrides.toolbar = albumSlots.toolbar as LightboxSlotOverrides['toolbar']
    if (albumSlots.caption) overrides.caption = albumSlots.caption as LightboxSlotOverrides['caption']
    if (albumSlots.slide) overrides.slide = albumSlots.slide as LightboxSlotOverrides['slide']
    return overrides
  })
  provide(LightboxSlotsKey, slotOverrides)
}

// Track thumb DOM elements by photo index
const thumbElsMap: Record<number, HTMLElement | null> = {}

function setItemRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    thumbElsMap[index] = el as HTMLElement | null
  }
}

function openPhoto(photo: PhotoItem, index: number) {
  if (parentGroup) {
    parentGroup.open(photo)
  } else if (ownCtx) {
    for (const [i, el] of Object.entries(thumbElsMap)) {
      ownCtx.setThumbRef(Number(i))(el)
    }
    ownCtx.open(index)
  }
}

function handleItemKeydown(e: KeyboardEvent, photo: PhotoItem, index: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openPhoto(photo, index)
  }
}

function itemBindings(photo: PhotoItem, index: number) {
  const base = { ref: setItemRef(index) }
  if (!hasLightbox.value) return base

  return {
    ...base,
    role: 'button',
    tabindex: '0',
    onClick: () => openPhoto(photo, index),
    onKeydown: (e: KeyboardEvent) => handleItemKeydown(e, photo, index),
  }
}

function isHidden(photo: PhotoItem): boolean {
  if (parentGroup) return parentGroup.hiddenPhoto.value === photo
  if (ownCtx) {
    const idx = ownCtx.hiddenThumbIndex.value
    if (idx === null) return false
    return photos.value[idx] === photo
  }
  return false
}

// ─── Stable group registration (diff-based) ────────────────────────────────

const idToSymbol = new Map<string, symbol>()
let registrationIds: symbol[] = []

if (parentGroup) {
  function syncRegistrations(photos: PhotoItem[]) {
    const newIds = new Set(photos.map(photoId))
    const oldIds = new Set(idToSymbol.keys())

    for (const pid of oldIds) {
      if (!newIds.has(pid)) {
        const sym = idToSymbol.get(pid)!
        parentGroup!.unregister(sym)
        idToSymbol.delete(pid)
      }
    }

    registrationIds = photos.map((photo, index) => {
      const pid = photoId(photo)
      let sym = idToSymbol.get(pid)
      if (!sym) {
        sym = Symbol()
        idToSymbol.set(pid, sym)
        parentGroup!.register(sym, photo, () => thumbElsMap[index] ?? null, null)
      }
      return sym
    })
  }

  watch(photos, (p) => {
    syncRegistrations(p)
  }, { immediate: true })

  onBeforeUnmount(() => {
    for (const sym of registrationIds) {
      parentGroup.unregister(sym)
    }
    idToSymbol.clear()
    registrationIds = []
  })
}
</script>
</file>
<file name="PhotoCarousel.vue" path="/packages/recipes/src/components/PhotoCarousel.vue">
<template>
  <PhotoGroup
    v-if="hasLightbox"
    :photos="resolvedPhotos"
    :lightbox="props.lightbox"
    :transition="props.transition"
  >
    <template #default="{ open, setThumbRef }">
      <CarouselLayout
        ref="layoutRef"
        v-bind="$attrs"
        :photos="resolvedPhotos"
        :adapter="props.adapter"
        :options="mergedOptions"
        :plugins="mergedPlugins"
        :thumbs-options="mergedThumbsOptions"
        :show-arrows="props.showArrows"
        :show-thumbnails="props.showThumbnails"
        :show-counter="props.showCounter"
        :show-dots="props.showDots"
        :slide-size="props.slideSize"
        :slide-aspect="props.slideAspect"
        :gap="props.gap"
        :thumb-size="props.thumbSize"
        :slide-class="props.slideClass"
        :img-class="props.imgClass"
        :thumb-class="props.thumbClass"
        :caption-class="props.captionClass"
        :controls-class="props.controlsClass"
        :on-slide-activate="open"
        :set-slide-ref="setThumbRef"
      >
        <template v-if="$slots.slide" #slide="slotProps"><slot name="slide" v-bind="slotProps" /></template>
        <template v-if="$slots.thumb" #thumb="slotProps"><slot name="thumb" v-bind="slotProps" /></template>
        <template v-if="$slots.caption" #caption="slotProps"><slot name="caption" v-bind="slotProps" /></template>
        <template v-if="$slots.controls" #controls="slotProps"><slot name="controls" v-bind="slotProps" /></template>
        <template v-if="$slots.prev" #prev><slot name="prev" /></template>
        <template v-if="$slots.next" #next><slot name="next" /></template>
        <template v-if="$slots.dots" #dots="slotProps"><slot name="dots" v-bind="slotProps" /></template>
      </CarouselLayout>
    </template>

    <template v-if="$slots['lightbox-slide']" #slide="slotProps"><slot name="lightbox-slide" v-bind="slotProps" /></template>
    <template v-if="$slots['lightbox-caption']" #caption="slotProps"><slot name="lightbox-caption" v-bind="slotProps" /></template>
    <template v-if="$slots['lightbox-toolbar']" #toolbar="slotProps"><slot name="lightbox-toolbar" v-bind="slotProps" /></template>
  </PhotoGroup>

  <CarouselLayout
    v-else
    ref="layoutRef"
    v-bind="$attrs"
    :photos="resolvedPhotos"
    :adapter="props.adapter"
    :options="mergedOptions"
    :plugins="mergedPlugins"
    :thumbs-options="mergedThumbsOptions"
    :show-arrows="props.showArrows"
    :show-thumbnails="props.showThumbnails"
    :show-counter="props.showCounter"
    :show-dots="props.showDots"
    :slide-size="props.slideSize"
    :slide-aspect="props.slideAspect"
    :gap="props.gap"
    :thumb-size="props.thumbSize"
    :slide-class="props.slideClass"
    :img-class="props.imgClass"
    :thumb-class="props.thumbClass"
    :caption-class="props.captionClass"
    :controls-class="props.controlsClass"
  >
    <template v-if="$slots.slide" #slide="slotProps"><slot name="slide" v-bind="slotProps" /></template>
    <template v-if="$slots.thumb" #thumb="slotProps"><slot name="thumb" v-bind="slotProps" /></template>
    <template v-if="$slots.caption" #caption="slotProps"><slot name="caption" v-bind="slotProps" /></template>
    <template v-if="$slots.controls" #controls="slotProps"><slot name="controls" v-bind="slotProps" /></template>
    <template v-if="$slots.prev" #prev><slot name="prev" /></template>
    <template v-if="$slots.next" #next><slot name="next" /></template>
    <template v-if="$slots.dots" #dots="slotProps"><slot name="dots" v-bind="slotProps" /></template>
  </CarouselLayout>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import Autoplay, { type AutoplayOptionsType } from 'embla-carousel-autoplay'
import type { EmblaOptionsType, EmblaPluginType, EmblaCarouselType } from 'embla-carousel'
import type { PhotoAdapter, PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
  LightboxCaptionSlotProps,
  LightboxControlsSlotProps,
  LightboxSlideSlotProps,
} from '@nuxt-photo/vue'
import type { LightboxTransitionOption } from '@nuxt-photo/vue/extend'
import PhotoGroup from './PhotoGroup.vue'
import CarouselLayout from './internal/CarouselLayout.vue'

defineOptions({ inheritAttrs: false })

defineSlots<{
  slide?: (props: CarouselSlideSlotProps) => unknown
  thumb?: (props: CarouselThumbSlotProps) => unknown
  caption?: (props: CarouselCaptionSlotProps) => unknown
  controls?: (props: CarouselControlsSlotProps) => unknown
  prev?: () => unknown
  next?: () => unknown
  dots?: (props: CarouselDotsSlotProps) => unknown
  'lightbox-slide'?: (props: LightboxSlideSlotProps) => unknown
  'lightbox-caption'?: (props: LightboxCaptionSlotProps) => unknown
  'lightbox-toolbar'?: (props: LightboxControlsSlotProps) => unknown
}>()

const props = withDefaults(defineProps<{
  photos: PhotoItem[] | any[]
  photoAdapter?: PhotoAdapter
  adapter?: ImageAdapter

  options?: EmblaOptionsType
  plugins?: EmblaPluginType[]
  thumbsOptions?: EmblaOptionsType

  showArrows?: boolean
  showThumbnails?: boolean
  showCounter?: boolean
  showDots?: boolean
  autoplay?: boolean | AutoplayOptionsType

  slideSize?: string
  slideAspect?: string
  gap?: string
  thumbSize?: string

  lightbox?: boolean | Component
  transition?: LightboxTransitionOption

  slideClass?: string
  imgClass?: string
  thumbClass?: string
  captionClass?: string
  controlsClass?: string
}>(), {
  showArrows: true,
  showThumbnails: true,
  showCounter: true,
  showDots: false,
  autoplay: false,
  lightbox: false,
})

const resolvedPhotos = computed<PhotoItem[]>(() =>
  props.photoAdapter ? (props.photos as any[]).map(props.photoAdapter) : (props.photos as PhotoItem[]),
)

const hasLightbox = computed(() => props.lightbox !== undefined && props.lightbox !== false)

const defaultMainOptions: EmblaOptionsType = { loop: false, align: 'start', containScroll: 'trimSnaps' }
const defaultThumbsOptions: EmblaOptionsType = { containScroll: 'keepSnaps', dragFree: true }

const mergedOptions = computed<EmblaOptionsType>(() => ({ ...defaultMainOptions, ...(props.options ?? {}) }))
const mergedThumbsOptions = computed<EmblaOptionsType>(() => ({ ...defaultThumbsOptions, ...(props.thumbsOptions ?? {}) }))

const mergedPlugins = computed<EmblaPluginType[]>(() => {
  const user = props.plugins ?? []
  const autoplay = props.autoplay
  if (!autoplay) return user.slice()

  const filtered = user.filter(p => p?.name !== 'autoplay')
  if (filtered.length !== user.length && (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
    console.warn('[nuxt-photo] PhotoCarousel: `autoplay` prop is set, so a user-supplied Autoplay plugin was dropped. Pass only one of them.')
  }

  const opts = typeof autoplay === 'object' ? autoplay : undefined
  return [Autoplay(opts), ...filtered]
})

type CarouselLayoutHandle = InstanceType<typeof CarouselLayout> & {
  emblaApi: EmblaCarouselType | null
  thumbsApi: EmblaCarouselType | null
  selectedIndex: number
  goTo: (index: number, instant?: boolean) => void
  goToNext: (instant?: boolean) => void
  goToPrev: (instant?: boolean) => void
  selectedSnap: () => number
  reInit: (options?: EmblaOptionsType, plugins?: EmblaPluginType[]) => void
}

const layoutRef = ref<CarouselLayoutHandle | null>(null)

const emblaApi = computed(() => layoutRef.value?.emblaApi ?? null)
const thumbsApi = computed(() => layoutRef.value?.thumbsApi ?? null)
const selectedIndex = computed(() => layoutRef.value?.selectedIndex ?? 0)

function goTo(index: number, instant = false) {
  layoutRef.value?.goTo(index, instant)
}

function goToNext(instant = false) {
  layoutRef.value?.goToNext(instant)
}

function goToPrev(instant = false) {
  layoutRef.value?.goToPrev(instant)
}

function selectedSnap() {
  return layoutRef.value?.selectedSnap() ?? 0
}

function reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]) {
  layoutRef.value?.reInit(options, plugins)
}

defineExpose({
  emblaApi,
  thumbsApi,
  selectedIndex,
  goTo,
  goToNext,
  goToPrev,
  selectedSnap,
  reInit,
})
</script>
</file>
<file name="PhotoGroup.vue" path="/packages/recipes/src/components/PhotoGroup.vue">
<template>
  <slot :open="open" :setThumbRef="ctx.setThumbRef" />
  <component :is="LightboxComponent" v-if="LightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { ref, computed, inject, provide, useSlots, type Component } from 'vue'
import { useLightboxProvider } from '@nuxt-photo/vue'
import {
  PhotoGroupContextKey,
  LightboxComponentKey,
  LightboxSlotsKey,
  type LightboxSlotOverrides,
  type LightboxSlideRenderer,
  type PhotoGroupContext,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/extend'
import { photoId, type PhotoItem, type PhotoAdapter } from '@nuxt-photo/core'
import InternalLightbox from './InternalLightbox.vue'

const props = withDefaults(defineProps<{
  /** Explicit photos list (for headless/programmatic use). If omitted, photos auto-collect from child Photo components. */
  photos?: PhotoItem[] | any[]
  /** Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS/API data directly. */
  photoAdapter?: PhotoAdapter
  /** Lightbox to render: true = default, false = none, Component = custom */
  lightbox?: boolean | Component
  /** Transition mode for open/close animations */
  transition?: LightboxTransitionOption
}>(), {
  lightbox: true,
})

// Global lightbox override (set via provide(LightboxComponentKey, MyLightbox) in app.vue)
const injectedLightbox = inject(LightboxComponentKey, null)

// Registration storage: Map preserves insertion order (O(1) register/unregister)
type Registration = {
  photo: PhotoItem
  getThumbEl: () => HTMLElement | null
  renderSlide?: LightboxSlideRenderer | null
}

const registrationMap = new Map<symbol, Registration>()
const registrationVersion = ref(0)

// 'explicit' when :photos prop is provided; 'auto' when collecting from children
const groupMode = computed<'auto' | 'explicit'>(() => props.photos !== undefined ? 'explicit' : 'auto')

function register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null) {
  if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
    if (props.photos !== undefined) {
      console.warn(
        '[nuxt-photo] PhotoGroup has both a :photos prop and child <Photo> registrations. '
        + 'The :photos prop takes precedence; child registrations are ignored. '
        + 'Remove :photos to use auto-collection, or remove child <Photo> components.',
      )
    }
    for (const [existingId, entry] of registrationMap) {
      if (existingId !== id && photoId(entry.photo) === photoId(photo)) {
        console.warn(`[nuxt-photo] Duplicate photo id "${photo.id}" registered in PhotoGroup`)
      }
    }
  }
  registrationMap.set(id, { photo, getThumbEl, renderSlide })
  registrationVersion.value++
}

function unregister(id: symbol) {
  registrationMap.delete(id)
  registrationVersion.value++
}

// Collected photos (reactive) — either from :photos prop or auto-registered children
const collectedPhotos = computed<PhotoItem[]>(() => {
  void registrationVersion.value // reactive dependency
  if (props.photos !== undefined) {
    return props.photoAdapter ? props.photos.map(props.photoAdapter) : props.photos as PhotoItem[]
  }
  return Array.from(registrationMap.values()).map(r => r.photo)
})

// Full lightbox context — creates and provides to children
const ctx = useLightboxProvider(collectedPhotos, {
  transition: props.transition,
  resolveSlide: photo => {
    for (const entry of registrationMap.values()) {
      if (photoId(entry.photo) === photoId(photo)) {
        return entry.renderSlide ?? null
      }
    }
    return null
  },
})

// Which photo's thumb is currently hidden during transitions
const hiddenPhoto = computed<PhotoItem | null>(() => {
  const idx = ctx.hiddenThumbIndex.value
  if (idx === null) return null
  return collectedPhotos.value[idx] ?? null
})

// Wire thumb refs from registrations, then open
async function open(photoOrIndex: PhotoItem | number = 0) {
  const photos = collectedPhotos.value
  let index: number

  if (typeof photoOrIndex === 'number') {
    index = photoOrIndex
  } else {
    index = photos.findIndex(p => photoId(p) === photoId(photoOrIndex))
    if (index === -1) index = 0
  }

  // Wire current thumb elements from registrations (auto mode only)
  if (props.photos === undefined) {
    Array.from(registrationMap.values()).forEach((reg, i) => {
      ctx.setThumbRef(i)(reg.getThumbEl())
    })
  }

  await ctx.open(index)
}

// Group context for child Photo/PhotoAlbum components
const groupContext: PhotoGroupContext = {
  mode: groupMode.value,
  register,
  unregister,
  open,
  photos: collectedPhotos,
  hiddenPhoto,
}

// Keep mode reactive for children that check it after mount
Object.defineProperty(groupContext, 'mode', {
  get: () => groupMode.value,
  enumerable: true,
})

provide(PhotoGroupContextKey, groupContext)

// Forward #toolbar, #caption, #slide slots into the lightbox via injection
const parentSlots = useSlots()
const slotOverrides = computed<LightboxSlotOverrides>(() => {
  const overrides: LightboxSlotOverrides = {}
  if (parentSlots.toolbar) overrides.toolbar = parentSlots.toolbar as LightboxSlotOverrides['toolbar']
  if (parentSlots.caption) overrides.caption = parentSlots.caption as LightboxSlotOverrides['caption']
  if (parentSlots.slide) overrides.slide = parentSlots.slide as LightboxSlotOverrides['slide']
  return overrides
})
provide(LightboxSlotsKey, slotOverrides)

// Which lightbox component to render
const LightboxComponent = computed<Component | null>(() => {
  if (props.lightbox === false) return null
  if (props.lightbox === true) return injectedLightbox ?? InternalLightbox
  return props.lightbox as Component
})

defineExpose({ open, close: ctx.close })
</script>
</file>
<file name="SlotProxy.ts" path="/packages/recipes/src/components/SlotProxy.ts">
import { defineComponent, type PropType } from 'vue'

/** Internal helper to render injected slot functions without cryptic `<component :is="() => ...">` patterns. */
export default defineComponent({
  name: 'SlotProxy',
  props: {
    // `any` on the parameter is required so callers can pass specifically-typed
    // renderers (e.g. `(p: LightboxControlsSlotProps) => VNode`) without contravariance errors.
    render: { type: Function as PropType<(props: any) => unknown>, required: true },
    props: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    return () => typeof props.render === 'function' ? props.render(props.props) : null
  },
})
</file>
<file name="usePhotoLayout.ts" path="/packages/recipes/src/composables/usePhotoLayout.ts">
import { ref, computed, onMounted, useId, type CSSProperties, type Ref } from 'vue'
import { useContainerWidth } from '@nuxt-photo/vue'
import {
  computeRowsLayout,
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computeColumnsBreakpointSnapshots,
  computeMasonryBreakpointSnapshots,
  computeBreakpointVisibilityCSS,
  computePhotoSizes,
  resolveResponsiveParameter,
  round,
  type PhotoItem,
  type LayoutGroup,
  type LayoutEntry,
  type ResponsiveParameter,
} from '@nuxt-photo/core'

type BreakpointSnapshot = {
  spanKey: string
  condition: string
  containerWidth: number
  spacing: number
  padding: number
  groups: LayoutGroup[]
}

const warnedApproximateLayouts = new Set<'columns' | 'masonry'>()

type RowItem = {
  photo: PhotoItem
  index: number
  width: number
  height: number
  style: CSSProperties
  computedSizes?: string
}

interface PhotoLayoutOptions {
  photos: Ref<PhotoItem[]>
  layout: Ref<'rows' | 'columns' | 'masonry'>
  columns: Ref<ResponsiveParameter<number>>
  spacing: Ref<ResponsiveParameter<number>>
  padding: Ref<ResponsiveParameter<number>>
  targetRowHeight: Ref<ResponsiveParameter<number>>
  defaultContainerWidth?: number
  breakpoints?: readonly number[]
  sizes?: { size: string; sizes?: Array<{ viewport: string; size: string }> }
  interactive: Ref<boolean>
}

export function usePhotoLayout(options: PhotoLayoutOptions) {
  const {
    photos, layout, columns, spacing, padding,
    targetRowHeight,
    defaultContainerWidth, breakpoints, sizes, interactive,
  } = options

  const containerRef = ref<HTMLElement | null>(null)
  const isMounted = ref(false)

  // SSR-safe unique container name for CSS container queries
  const albumId = useId()
  const containerName = computed(() => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`)
  const scopeClass = computed(() => `np-scope-${containerName.value}`)
  const snapshotClass = computed(() => `np-snapshot-${containerName.value}`)

  const containerQueriesActive = computed(() => !!breakpoints?.length)

  // ─── Per-breakpoint SSR snapshots for columns/masonry ──────────────────────
  // Precedence:
  //   1. breakpoint-aware (explicit or inferred breakpoints)
  //   2. exact single-width (defaultContainerWidth)
  //   3. approximate fallback (neither)
  const breakpointSnapshots = computed<BreakpointSnapshot[]>(() => {
    if (layout.value === 'rows') return []

    if (breakpoints?.length) {
      if (layout.value === 'columns') {
        return computeColumnsBreakpointSnapshots({
          photos: photos.value,
          breakpoints,
          spacing: spacing.value,
          padding: padding.value,
          columns: columns.value,
        })
      }
      return computeMasonryBreakpointSnapshots({
        photos: photos.value,
        breakpoints,
        spacing: spacing.value,
        padding: padding.value,
        columns: columns.value,
      })
    }

    if (defaultContainerWidth && defaultContainerWidth > 0) {
      const sp = resolveResponsiveParameter(spacing.value, defaultContainerWidth, 8)
      const pd = resolveResponsiveParameter(padding.value, defaultContainerWidth, 0)
      const cols = resolveResponsiveParameter(columns.value, defaultContainerWidth, 3)
      const compute = layout.value === 'columns' ? computeColumnsLayout : computeMasonryLayout
      const g = compute({ photos: photos.value, containerWidth: defaultContainerWidth, spacing: sp, padding: pd, columns: cols })
      if (g.length === 0) return []
      return [{ spanKey: 'all', condition: '', containerWidth: defaultContainerWidth, spacing: sp, padding: pd, groups: g }]
    }

    return []
  })

  const containerQueryCSS = computed(() => {
    if (!containerQueriesActive.value) return ''
    if (layout.value === 'rows') {
      return computeBreakpointStyles({
        photos: photos.value,
        breakpoints: breakpoints!,
        spacing: spacing.value,
        padding: padding.value,
        targetRowHeight: targetRowHeight.value,
        containerName: containerName.value,
      })
    }
    return computeBreakpointVisibilityCSS(
      breakpointSnapshots.value,
      containerName.value,
      snapshotClass.value,
    )
  })

  const { containerWidth } = useContainerWidth(containerRef, {
    defaultContainerWidth,
    breakpoints,
  })

  onMounted(() => {
    isMounted.value = true
  })

  const groups = computed<LayoutGroup[]>(() => {
    if (containerWidth.value <= 0) return []

    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)
    const cols = resolveResponsiveParameter(columns.value, w, 3)
    const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)

    const input = { photos: photos.value, containerWidth: w, spacing: sp, padding: pd }

    switch (layout.value) {
      case 'rows': {
        const result = computeRowsLayout({ ...input, targetRowHeight: trh })
        if (result.length === 0 && photos.value.length > 0) {
          console.warn('[nuxt-photo] rows layout produced no groups — containerWidth may be too small for targetRowHeight')
        }
        return result
      }
      case 'columns':
        return computeColumnsLayout({ ...input, columns: cols })
      case 'masonry':
        return computeMasonryLayout({ ...input, columns: cols })
    }
  })

  const rowItems = computed<RowItem[]>(() => {
    const cursor = interactive.value ? { cursor: 'pointer' as const } : {}
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)
    const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)

    if (containerQueriesActive.value && !defaultContainerWidth) {
      return photos.value.map((photo, index) => ({
        photo, index,
        width: photo.width, height: photo.height,
        style: { ...cursor, overflow: 'hidden' } as CSSProperties,
      }))
    }

    if (containerWidth.value <= 0 || groups.value.length === 0) {
      return photos.value.map((photo, index) => {
        const ar = photo.width / photo.height
        return {
          photo, index,
          width: photo.width, height: photo.height,
          style: { ...cursor, flexGrow: ar, flexBasis: `${trh * ar}px`, overflow: 'hidden' } as CSSProperties,
        }
      })
    }

    return groups.value.flatMap(row =>
      row.entries.map((entry) => {
        const gaps = sp * (entry.itemsCount - 1) + 2 * pd * entry.itemsCount
        return {
          photo: entry.photo,
          index: entry.index,
          width: entry.width,
          height: entry.height,
          computedSizes: computePhotoSizes(entry.width, w, entry.itemsCount, sp, pd, sizes),
          style: {
            ...cursor,
            flex: '0 0 auto',
            boxSizing: 'content-box' as const,
            padding: `${pd}px`,
            overflow: 'hidden',
            width: `calc((100% - ${gaps}px) / ${round((w - gaps) / entry.width, 5)})`,
          } as CSSProperties,
        }
      })
    )
  })

  const ssrWrapperStyle = computed<CSSProperties>(() => {
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const cols = resolveResponsiveParameter(columns.value, w, 3)
    if (layout.value === 'rows') {
      return { display: 'flex', flexWrap: 'wrap', gap: `${sp}px`, width: '100%' }
    }
    return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${sp}px`, width: '100%' }
  })

  function ssrItemStyle(photo: PhotoItem): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}
    if (layout.value === 'rows') {
      const w = containerWidth.value
      const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)
      const ar = photo.width / photo.height
      return { ...cursor, flexGrow: ar, flexBasis: `${trh * ar}px`, overflow: 'hidden' }
    }
    return { ...cursor, overflow: 'hidden' }
  }

  const snapshotsActive = computed(() => breakpointSnapshots.value.length > 0)

  const containerStyle = computed<CSSProperties>(() => {
    if (containerQueriesActive.value || snapshotsActive.value) {
      return { width: '100%', containerType: 'inline-size', containerName: containerName.value }
    }
    return { width: '100%' }
  })

  // Warn once per layout type if columns/masonry is used without any SSR signal.
  function maybeWarnApproximate() {
    if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production') return
    if (layout.value === 'rows') return
    if (breakpoints?.length || (defaultContainerWidth && defaultContainerWidth > 0)) return
    if (warnedApproximateLayouts.has(layout.value)) return
    warnedApproximateLayouts.add(layout.value)
    console.warn(
      `[nuxt-photo] ${layout.value} layout rendered without breakpoints or defaultContainerWidth — SSR will visibly reflow on hydration. See https://nuxt-photo.dev/guides/ssr-and-performance`,
    )
  }

  type StyleContext = { containerWidth: number; spacing: number; padding: number; columnsCount: number; layoutType: 'rows' | 'columns' | 'masonry' }

  function groupStyleWith(group: LayoutGroup, ctx: StyleContext): CSSProperties {
    if (group.type === 'row') {
      return {
        marginBottom: group.index < ctx.columnsCount - 1 ? `${ctx.spacing}px` : undefined,
      }
    }

    if (
      ctx.layoutType === 'masonry'
      || group.columnsGaps === undefined
      || group.columnsRatios === undefined
    ) {
      return {
        marginLeft: group.index > 0 ? `${ctx.spacing}px` : undefined,
        width: `calc((100% - ${ctx.spacing * (ctx.columnsCount - 1)}px) / ${ctx.columnsCount})`,
      }
    }

    const totalRatio = group.columnsRatios.reduce((acc, v) => acc + v, 0)
    const totalAdjustedGaps = group.columnsRatios.reduce(
      (acc, v, ratioIndex) =>
        acc + ((group.columnsGaps![group.index] ?? 0) - (group.columnsGaps![ratioIndex] ?? 0)) * v,
      0,
    )

    return {
      marginLeft: group.index > 0 ? `${ctx.spacing}px` : undefined,
      width: `calc((100% - ${round(
        (ctx.columnsCount - 1) * ctx.spacing
        + 2 * ctx.columnsCount * ctx.padding
        + totalAdjustedGaps,
        3,
      )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
        2 * ctx.padding
      }px)`,
    }
  }

  function itemStyleWith(entry: LayoutEntry, group: LayoutGroup, ctx: StyleContext): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}

    if (group.type === 'row') {
      const gaps = ctx.spacing * (entry.itemsCount - 1) + 2 * ctx.padding * entry.itemsCount
      return {
        ...cursor,
        boxSizing: 'content-box',
        display: 'block',
        height: 'auto',
        padding: `${ctx.padding}px`,
        width: `calc((100% - ${gaps}px) / ${round((ctx.containerWidth - gaps) / entry.width, 5)})`,
      }
    }

    const isLast = entry.positionIndex === entry.itemsCount - 1
    return {
      ...cursor,
      boxSizing: 'content-box',
      display: 'block',
      height: 'auto',
      padding: `${ctx.padding}px`,
      marginBottom: !isLast ? `${ctx.spacing}px` : undefined,
      width: `calc(100% - ${2 * ctx.padding}px)`,
    }
  }

  function liveCtx(): StyleContext {
    const w = containerWidth.value
    return {
      containerWidth: w,
      spacing: resolveResponsiveParameter(spacing.value, w, 8),
      padding: resolveResponsiveParameter(padding.value, w, 0),
      columnsCount: groups.value.length || 1,
      layoutType: layout.value,
    }
  }

  function snapCtx(snap: BreakpointSnapshot): StyleContext {
    return {
      containerWidth: snap.containerWidth,
      spacing: snap.spacing,
      padding: snap.padding,
      columnsCount: snap.groups.length || 1,
      layoutType: layout.value,
    }
  }

  function groupStyle(group: LayoutGroup): CSSProperties {
    return groupStyleWith(group, liveCtx())
  }

  function itemStyle(entry: LayoutEntry, group: LayoutGroup): CSSProperties {
    return itemStyleWith(entry, group, liveCtx())
  }

  function snapshotGroupStyle(group: LayoutGroup, snap: BreakpointSnapshot): CSSProperties {
    return groupStyleWith(group, snapCtx(snap))
  }

  function snapshotItemStyle(entry: LayoutEntry, group: LayoutGroup, snap: BreakpointSnapshot): CSSProperties {
    return itemStyleWith(entry, group, snapCtx(snap))
  }

  function snapshotWrapperStyle(snap: BreakpointSnapshot, multiSpan: boolean): CSSProperties {
    // Column-layout snapshots use a row-flex wrapper (columns side-by-side). When there are
    // multiple spans, CSS `@container` rules toggle display between flex and none; when there
    // is only one span we skip the stylesheet and render flex inline.
    return multiSpan
      ? { width: '100%' }
      : { width: '100%', display: 'flex' }
  }

  return {
    containerRef,
    containerWidth,
    isMounted,
    scopeClass,
    snapshotClass,
    containerStyle,
    containerQueryCSS,
    containerQueriesActive,
    breakpointSnapshots,
    snapshotsActive,
    groups,
    rowItems,
    ssrWrapperStyle,
    ssrItemStyle,
    groupStyle,
    itemStyle,
    snapshotGroupStyle,
    snapshotItemStyle,
    snapshotWrapperStyle,
    maybeWarnApproximate,
  }
}
</file>
<file name="album.css" path="/packages/recipes/src/styles/album.css">
/* Structural styles for PhotoAlbum recipe */

.np-album {
  width: 100%;
  position: relative;
}

/* Container direction for row/column/masonry layouts */
.np-album--rows,
.np-album--columns,
.np-album--masonry {
  display: flex;
  flex-wrap: nowrap;
}

.np-album--rows {
  flex-direction: column;
}

.np-album--columns,
.np-album--masonry {
  flex-direction: row;
  justify-content: space-between;
}

/* Row group */
.np-album__row {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-start;
}

/* Column group */
.np-album__column {
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
}

/* Columns layout aligns column groups to space-between */
.np-album--columns .np-album__column {
  justify-content: space-between;
}

/* Masonry columns start from top */
.np-album--masonry .np-album__column {
  justify-content: flex-start;
}

/* Item — no extra static styles needed; dimensions come from inline styles */
.np-album__item {
  position: relative;
  overflow: hidden;
}

/* Image fills its item */
.np-album__img {
  display: block;
}

/* Skeleton placeholder shown before ResizeObserver measures width */
.np-album__skeleton {
  width: 100%;
  min-height: 200px;
}
</file>
<file name="carousel-structure.css" path="/packages/recipes/src/styles/carousel-structure.css">
/* Structural styles for PhotoCarousel recipe
   Layout/sizing only — no colours, radii or shadows.
   See carousel-theme.css for the opt-in visual layer. */

.np-carousel {
  --np-carousel-gap: 0.75rem;
  --np-carousel-slide-size: 100%;
  --np-carousel-slide-aspect: 16 / 10;
  --np-carousel-thumb-size: 5.5rem;
  --np-carousel-thumb-gap: 0.5rem;

  position: relative;
  width: 100%;
}

.np-carousel__viewport {
  position: relative;
  overflow: hidden;
}

.np-carousel__container {
  display: flex;
  touch-action: pan-y pinch-zoom;
  margin-left: calc(var(--np-carousel-gap) * -1);
}

.np-carousel__slide {
  flex: 0 0 var(--np-carousel-slide-size);
  min-width: 0;
  padding-left: var(--np-carousel-gap);
  aspect-ratio: var(--np-carousel-slide-aspect);
  position: relative;
}

.np-carousel__media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.np-carousel__controls {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
}

.np-carousel__arrow {
  pointer-events: auto;
}

.np-carousel__counter {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  pointer-events: none;
}

.np-carousel__caption {
  margin-top: 0.5rem;
}

.np-carousel__dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.75rem;
}

.np-carousel__dot {
  cursor: pointer;
  padding: 0;
  border: 0;
  background: transparent;
}

.np-carousel__thumbs {
  margin-top: var(--np-carousel-thumb-gap);
}

.np-carousel__thumbs-viewport {
  overflow: hidden;
}

.np-carousel__thumbs-container {
  display: flex;
  margin-left: calc(var(--np-carousel-thumb-gap) * -1);
}

.np-carousel__thumb {
  flex: 0 0 auto;
  min-width: 0;
  padding-left: var(--np-carousel-thumb-gap);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.np-carousel__thumb-img {
  display: block;
  height: var(--np-carousel-thumb-size);
  width: auto;
  object-fit: cover;
}
</file>
<file name="carousel-theme.css" path="/packages/recipes/src/styles/carousel-theme.css">
/* Theme styles for PhotoCarousel recipe — visual appearance */
/* Requires carousel-structure.css for layout */

.np-carousel {
  --np-carousel-radius: 0.5rem;
  --np-carousel-surface: rgba(0, 0, 0, 0.55);
  --np-carousel-surface-fg: #fff;
  --np-carousel-thumb-border: rgba(0, 0, 0, 0.1);
}

.np-carousel__viewport {
  border-radius: var(--np-carousel-radius);
  background: #f4f4f5;
}

.np-carousel__arrow {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 0;
  background: var(--np-carousel-surface);
  color: var(--np-carousel-surface-fg);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font: inherit;
  font-size: 1rem;
  transition: opacity 0.15s;
}

.np-carousel__arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.np-carousel__counter {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: var(--np-carousel-surface);
  color: var(--np-carousel-surface-fg);
  font-size: 0.75rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.np-carousel__caption {
  color: inherit;
  font-size: 0.875rem;
  line-height: 1.45;
  opacity: 0.8;
}

.np-carousel__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
}

.np-carousel__dot--selected {
  opacity: 1;
}

.np-carousel__thumb {
  opacity: 0.5;
  transition: opacity 0.15s;
  border-radius: calc(var(--np-carousel-radius) * 0.6);
}

.np-carousel__thumb--selected {
  opacity: 1;
}

.np-carousel__thumb:hover {
  opacity: 0.85;
}

.np-carousel__thumb-img {
  border-radius: calc(var(--np-carousel-radius) * 0.6);
  border: 1px solid var(--np-carousel-thumb-border);
}
</file>
<file name="lightbox-structure.css" path="/packages/recipes/src/styles/lightbox-structure.css">
/* Structural / layout styles for Lightbox recipe — no colors, no visual theme */
.np-lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.np-lightbox__backdrop {
  position: absolute;
  inset: 0;
  transition: opacity 260ms ease;
}

.np-lightbox__ui {
  position: absolute;
  inset: 0;
  transform-origin: center 28%;
}

.np-lightbox__topbar {
  position: absolute;
  top: 18px;
  left: 20px;
  right: 20px;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 160ms ease;
}

.np-lightbox__actions {
  display: flex;
  gap: 10px;
}

.np-lightbox__btn {
  height: 42px;
  min-width: 42px;
  border: 0;
  padding: 0 14px;
  cursor: pointer;
  font-size: 16px;
  transition:
    transform 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
}

.np-lightbox__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.np-lightbox__btn:disabled {
  cursor: default;
}

.np-lightbox__btn--close {
  min-width: 48px;
}

.np-lightbox__stage {
  position: absolute;
  inset: 64px 28px 24px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 18px;
  justify-items: center;
}

.np-lightbox__media {
  position: relative;
  width: min(1240px, calc(100vw - 72px));
  height: min(78vh, calc(100vh - 150px));
  overflow: hidden;
}

.np-lightbox__media[data-zoomed] {
  cursor: grab;
}

.np-lightbox__media[data-gesture][data-zoomed] {
  cursor: grabbing;
}

.np-lightbox__viewport {
  overflow: hidden;
  position: absolute;
  inset: 0;
}

.np-lightbox__container {
  display: flex;
  height: 100%;
  touch-action: pan-y pinch-zoom;
}

.np-lightbox__slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  place-items: center;
}

[data-np-slide-effect] {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  transform-origin: center center;
}

[data-np-slide-effect][data-animating] {
  will-change: transform, opacity;
}

[data-np-slide-frame] {
  position: relative;
  overflow: visible;
}

[data-np-slide-zoom] {
  width: 100%;
  height: 100%;
  transform-origin: center center;
}

[data-np-slide-zoom][data-animating] {
  will-change: transform;
}

[data-np-slide-img] {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: contain;
}

.np-lightbox__caption {
  width: min(1240px, calc(100vw - 72px));
  text-align: left;
  transition: opacity 160ms ease;
}

.np-lightbox__caption h2 {
  margin: 0;
}

.np-lightbox__caption p {
  margin: 6px 0 0;
}

.np-lightbox__ghost {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
}

/* Screen reader only — used for aria-live announcements */
[data-np-sr-only] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 700px) {
  .np-lightbox__stage {
    inset: 64px 12px 16px;
  }

  .np-lightbox__media,
  .np-lightbox__caption {
    width: min(100vw - 24px, 1240px);
  }

  .np-lightbox__topbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .np-lightbox__actions {
    gap: 8px;
  }

  .np-lightbox__btn {
    min-width: 40px;
    padding-inline: 12px;
  }
}
</file>
<file name="lightbox-theme.css" path="/packages/recipes/src/styles/lightbox-theme.css">
/* Theme styles for Lightbox recipe — visual appearance, colors, blur, typography */
/* Override any --np-* variable on .np-lightbox to customize the theme */
.np-lightbox {
  --np-backdrop-bg: rgba(0, 0, 0, 0.85);
  --np-backdrop-blur: 16px;
  --np-btn-radius: 999px;
  --np-btn-bg: rgba(255, 255, 255, 0.1);
  --np-btn-hover-bg: rgba(255, 255, 255, 0.16);
  --np-btn-color: white;
  --np-btn-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 16px 40px rgba(0, 0, 0, 0.24);
  --np-btn-blur: 8px;
  --np-btn-disabled-opacity: 0.45;
  --np-counter-color: rgba(255, 255, 255, 0.72);
  --np-img-radius: 16px;
  --np-caption-color: white;
  --np-caption-heading-size: 22px;
  --np-caption-secondary: rgba(255, 255, 255, 0.72);
}

.np-lightbox__backdrop {
  background: var(--np-backdrop-bg);
  backdrop-filter: blur(var(--np-backdrop-blur));
}

.np-lightbox__counter {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--np-counter-color);
}

.np-lightbox__btn {
  border-radius: var(--np-btn-radius);
  color: var(--np-btn-color);
  background: var(--np-btn-bg);
  box-shadow: var(--np-btn-shadow);
  backdrop-filter: blur(var(--np-btn-blur));
}

.np-lightbox__btn:hover:not(:disabled) {
  background: var(--np-btn-hover-bg);
}

.np-lightbox__btn:disabled {
  opacity: var(--np-btn-disabled-opacity);
}

[data-np-slide-img] {
  border-radius: var(--np-img-radius);
}

.np-lightbox__caption {
  color: var(--np-caption-color);
}

.np-lightbox__caption h2 {
  font-size: var(--np-caption-heading-size);
  letter-spacing: -0.03em;
}

.np-lightbox__caption p {
  color: var(--np-caption-secondary);
}
</file>
<file name="lightbox.css" path="/packages/recipes/src/styles/lightbox.css">
/* Convenience re-export: includes both structure and theme.
   For fine-grained control, import lightbox-structure.css and/or lightbox-theme.css directly. */
@import './lightbox-structure.css';
@import './lightbox-theme.css';
</file>
<file name="photo-structure.css" path="/packages/recipes/src/styles/photo-structure.css">
/* Structural styles for Photo recipe — layout only */

.np-photo {
  position: relative;
  display: inline-block;
}

.np-photo__img {
  display: block;
  max-width: 100%;
  height: auto;
}

.np-photo__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}
</file>
<file name="photo.css" path="/packages/recipes/src/styles/photo.css">
/* Theme styles for Photo recipe — visual appearance */
/* Requires photo-structure.css for layout */

.np-photo__caption {
  padding: 24px 16px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
}
</file>
<file name="index.ts" path="/packages/recipes/src/index.ts">
// @nuxt-photo/recipes — Opinionated components
export * from './components'
</file>
<file name="carousel.test.ts" path="/packages/recipes/test/carousel.test.ts">
// @vitest-environment jsdom

import { createApp, createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import type { PhotoItem } from '@nuxt-photo/core'
import PhotoCarousel from '../src/components/PhotoCarousel.vue'

const photos = [
  makePhoto({ id: 'c-1' }),
  makePhoto({ id: 'c-2' }),
  makePhoto({ id: 'c-3' }),
  makePhoto({ id: 'c-4' }),
]

async function flushUi(iterations = 6) {
  for (let i = 0; i < iterations; i++) {
    await Promise.resolve()
    await nextTick()
    await new Promise(r => setTimeout(r, 0))
  }
}

function mount(component: any, props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const handleRef = ref<any>(null)
  const Wrapper = defineComponent({
    setup() {
      return () => h(component, { ...props, ref: handleRef }, slots)
    },
  })

  const app = createApp(Wrapper)
  app.mount(container)

  return {
    app,
    container,
    get handle() { return handleRef.value },
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('PhotoCarousel — DOM', () => {
  beforeEach(() => {
    class NoopObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return [] }
    }
    vi.stubGlobal('ResizeObserver', NoopObserver)
    // Embla looks these up on the element's ownerWindow — jsdom needs them installed there too.
    window.ResizeObserver = NoopObserver as unknown as typeof window.ResizeObserver
    window.IntersectionObserver = NoopObserver as unknown as typeof window.IntersectionObserver
    if (!window.matchMedia) {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const node of Array.from(document.body.childNodes)) node.remove()
  })

  it('renders one slide element per photo', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(photos.length)
    m.unmount()
  })

  it('renders thumbnails by default', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(photos.length)
    m.unmount()
  })

  it('renders nothing meaningful when photos is empty', async () => {
    const m = mount(PhotoCarousel, { photos: [] })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(0)
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(0)
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    m.unmount()
  })

  it('suppresses arrows, counter, thumbnails, and dots when only one photo', async () => {
    const m = mount(PhotoCarousel, { photos: [photos[0]], showDots: true })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(1)
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    expect(m.container.querySelector('.np-carousel__counter')).toBeNull()
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(0)
    expect(m.container.querySelector('.np-carousel__dots')).toBeNull()
    m.unmount()
  })

  it('custom #slide slot replaces default PhotoImage', async () => {
    const m = mount(PhotoCarousel, { photos }, {
      slide: ({ photo }: { photo: PhotoItem }) =>
        h('div', { class: 'custom-slide', 'data-id': photo.id }, photo.id),
    })
    await flushUi()
    const custom = m.container.querySelectorAll('.custom-slide')
    expect(custom.length).toBe(photos.length)
    expect(m.container.querySelector('.np-carousel__media')).toBeNull()
    m.unmount()
  })

  it('custom #thumb slot replaces default thumbnail', async () => {
    const m = mount(PhotoCarousel, { photos }, {
      thumb: ({ photo }: { photo: PhotoItem }) =>
        h('span', { class: 'custom-thumb' }, photo.id),
    })
    await flushUi()
    expect(m.container.querySelectorAll('.custom-thumb').length).toBe(photos.length)
    m.unmount()
  })

  it('exposes imperative goTo/goToNext/goToPrev and updates selectedIndex', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    const handle = m.handle
    expect(handle).toBeTruthy()
    expect(handle.selectedIndex).toBe(0)

    handle.goTo(2, true)
    await flushUi()
    expect(handle.selectedIndex).toBe(2)

    handle.goToPrev(true)
    await flushUi()
    expect(handle.selectedIndex).toBe(1)

    handle.goToNext(true)
    await flushUi()
    expect(handle.selectedIndex).toBe(2)

    m.unmount()
  })

  it('hides arrows when showArrows is false', async () => {
    const m = mount(PhotoCarousel, { photos, showArrows: false })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    m.unmount()
  })

  it('shows dots when showDots is true', async () => {
    const m = mount(PhotoCarousel, { photos, showDots: true, showThumbnails: false })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__dot').length).toBe(photos.length)
    m.unmount()
  })

  it('applies layout CSS variables from props', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      slideSize: '80%',
      slideAspect: '4 / 3',
      gap: '2rem',
      thumbSize: '8rem',
    })
    await flushUi()
    const root = m.container.querySelector('.np-carousel') as HTMLElement
    expect(root.style.getPropertyValue('--np-carousel-slide-size')).toBe('80%')
    expect(root.style.getPropertyValue('--np-carousel-slide-aspect')).toBe('4 / 3')
    expect(root.style.getPropertyValue('--np-carousel-gap')).toBe('2rem')
    expect(root.style.getPropertyValue('--np-carousel-thumb-size')).toBe('8rem')
    m.unmount()
  })

  it('warns in dev when autoplay prop and user Autoplay plugin are both supplied', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fakeAutoplayPlugin = { name: 'autoplay', options: {}, init() {}, destroy() {}, play() {}, stop() {}, reset() {}, isPlaying: () => false, timeUntilNext: () => null } as any
    const m = mount(PhotoCarousel, { photos, autoplay: { delay: 3000 }, plugins: [fakeAutoplayPlugin] })
    await flushUi()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('PhotoCarousel'))
    warn.mockRestore()
    m.unmount()
  })

  it('forwards root attrs to the rendered carousel root', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      id: 'reviewed-carousel',
      'data-test-id': 'carousel-root',
    })
    await flushUi()
    const root = m.container.querySelector('.np-carousel') as HTMLElement
    expect(root.id).toBe('reviewed-carousel')
    expect(root.getAttribute('data-test-id')).toBe('carousel-root')
    m.unmount()
  })

  it('reacts to updated Embla options after mount', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const loop = ref(false)
    const handleRef = ref<any>(null)
    const app = createApp(defineComponent({
      setup() {
        return () => h(PhotoCarousel, {
          photos,
          options: { loop: loop.value },
          ref: handleRef,
        })
      },
    }))

    app.mount(container)
    await flushUi()

    handleRef.value.goTo(photos.length - 1, true)
    await flushUi()

    const nextButton = container.querySelector('.np-carousel__arrow--next') as HTMLButtonElement
    expect(nextButton.disabled).toBe(true)

    loop.value = true
    await flushUi()

    expect(nextButton.disabled).toBe(false)

    app.unmount()
    container.remove()
  })

  it('maps multi-slide navigation from photo index to the containing snap', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      options: { slidesToScroll: 2 },
    })
    await flushUi()

    m.handle.goTo(3, true)
    await flushUi()

    expect(m.handle.selectedIndex).toBe(2)
    expect(m.container.querySelector('.np-carousel__counter')?.textContent).toContain('3 / 4')
    expect(m.container.querySelectorAll('.np-carousel__thumb--selected').length).toBe(2)

    m.unmount()
  })
})

describe('PhotoCarousel — SSR', () => {
  it('renders slide markup without throwing', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel')
    expect(html).toContain('c-1')
    expect(html).toContain('c-2')
  })

  it('SSR with single photo suppresses navigation chrome', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos: [photos[0]] }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel__slide')
    expect(html).not.toContain('np-carousel__arrow')
    expect(html).not.toContain('np-carousel__thumb ')
  })

  it('SSR with lightbox enabled includes PhotoGroup teleport markers', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos, lightbox: true }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })
})
</file>
<file name="recipeContracts.test.ts" path="/packages/recipes/test/recipeContracts.test.ts">
// @vitest-environment jsdom

import {
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  provide,
  ref,
  type Component,
  type InjectionKey,
} from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LightboxControls, LightboxSlide } from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { PhotoGroupContextKey, type PhotoGroupContext } from '@nuxt-photo/vue/extend'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../src/components/Photo.vue'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoGroup from '../src/components/PhotoGroup.vue'

function createImmediateImage() {
  return class ImmediateImage {
    onload: null | (() => void) = null
    onerror: null | (() => void) = null
    complete = true

    decode() {
      return Promise.resolve()
    }

    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.()
      })
    }
  }
}

const TestLightbox = defineComponent({
  name: 'TestLightbox',
  setup() {
    return () => h(LightboxControls, null, {
      default: ({ photos }: { photos: PhotoItem[] }) => h(
        'div',
        { 'data-testid': 'test-lightbox' },
        photos.map((photo, index) => h(LightboxSlide, {
          key: photo.id,
          photo,
          index,
        })),
      ),
    })
  },
})

async function flushUi(iterations = 6) {
  for (let i = 0; i < iterations; i++) {
    await Promise.resolve()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

async function mountComponent(
  component: Component,
  options?: {
    props?: Record<string, unknown>
    slots?: Record<string, (...args: any[]) => any>
    provideValues?: Array<[InjectionKey<any> | string, unknown]>
  },
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    setup() {
      for (const [key, value] of options?.provideValues ?? []) {
        provide(key as any, value)
      }

      return () => h(component, options?.props ?? {}, options?.slots ?? {})
    },
  })

  app.mount(container)
  await flushUi(2)

  return {
    app,
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('recipe contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    })
    vi.stubGlobal('Image', createImmediateImage())
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now() + 1000), 0),
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders plain Photo with thumb semantics instead of slide semantics', async () => {
    const photo = makePhoto({ id: 'plain-photo' })
    const adapter = vi.fn((item: PhotoItem, context: 'thumb' | 'slide' | 'preload') => ({
      src: `/${context}/${item.id}.jpg`,
      width: item.width,
      height: item.height,
    }))

    const mounted = await mountComponent(Photo, {
      props: { photo, adapter },
    })

    const img = mounted.container.querySelector('img')

    expect(img?.getAttribute('src')).toBe('/thumb/plain-photo.jpg')
    expect(new Set(adapter.mock.calls.map(([, context]) => context))).toEqual(new Set(['thumb']))

    mounted.unmount()
  })

  it('refreshes PhotoAlbum parent-group registrations when photos reorder, insert, or remove', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    const c = makePhoto({ id: 'c' })
    const photos = ref<PhotoItem[]>([a, b])
    const register = vi.fn()
    const unregister = vi.fn()

    const parentGroup: PhotoGroupContext = {
      mode: 'explicit',
      register,
      unregister,
      open: vi.fn(async () => {}),
      photos: computed(() => photos.value),
      hiddenPhoto: computed(() => null),
    }

    const Wrapper = defineComponent({
      setup() {
        return () => h(PhotoAlbum, {
          photos: photos.value,
          lightbox: false,
        })
      },
    })

    const mounted = await mountComponent(Wrapper, {
      provideValues: [[PhotoGroupContextKey, parentGroup]],
    })

    // Initial: a and b registered
    expect(register.mock.calls.map(call => call[1].id)).toEqual(['a', 'b'])

    // Reorder + insert c: only c is newly registered (diff-based — a and b preserved)
    photos.value = [b, a, c]
    await flushUi()
    expect(register.mock.calls.map(call => call[1].id)).toEqual(['a', 'b', 'c'])
    expect(unregister).not.toHaveBeenCalled()

    // Remove b: only b gets unregistered; c and a are preserved
    photos.value = [c, a]
    await flushUi()
    expect(register).toHaveBeenCalledTimes(3) // no new registrations
    expect(unregister).toHaveBeenCalledTimes(1) // b removed

    // Unmount: remaining registrations (c, a) cleaned up
    mounted.unmount()
    expect(unregister).toHaveBeenCalledTimes(3) // b + c + a
  })

  it('renders custom solo slide content through a custom lightbox recipe', async () => {
    const photo = makePhoto({ id: 'solo-slide' })

    const mounted = await mountComponent(Photo, {
      props: {
        photo,
        lightbox: TestLightbox,
      },
      slots: {
        slide: ({ photo: slidePhoto }: { photo: PhotoItem }) =>
          h('div', { 'data-testid': 'solo-custom-slide' }, `Solo ${slidePhoto.id}`),
      },
    })

    await flushUi()

    expect(mounted.container.innerHTML).toContain('solo-custom-slide')
    expect(mounted.container.textContent ?? '').toContain('solo-slide')

    mounted.unmount()
  })

  it('renders custom grouped slide content through a custom lightbox recipe', async () => {
    const photo = makePhoto({ id: 'grouped-slide' })

    const mounted = await mountComponent(PhotoGroup, {
      props: {
        lightbox: TestLightbox,
      },
      slots: {
        default: () => [
          h(Photo, { photo }, {
            slide: ({ photo: slidePhoto }: { photo: PhotoItem }) =>
              h('div', { 'data-testid': 'grouped-custom-slide' }, `Grouped ${slidePhoto.id}`),
          }),
        ],
      },
    })

    await flushUi()

    expect(mounted.container.querySelector('[data-testid="grouped-custom-slide"]')?.textContent).toContain('grouped-slide')

    mounted.unmount()
  })
})
</file>
<file name="ssr.test.ts" path="/packages/recipes/test/ssr.test.ts">
// @vitest-environment node

import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import { computeBreakpointStyles, responsive } from '@nuxt-photo/core'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import Photo from '../src/components/Photo.vue'
import PhotoGroup from '../src/components/PhotoGroup.vue'

const photos = [
  makePhoto({ id: 'ssr-1', width: 1600, height: 900 }),
  makePhoto({ id: 'ssr-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'ssr-3', width: 1500, height: 1000 }),
]

describe('SSR', () => {
  it('PhotoAlbum renders photo items on the server without needing a fixed width', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // All photos are present
    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum SSR rows layout uses CSS flex-grow with aspect ratios (no fixed width)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // CSS flex wrapper — responsive at any width
    expect(html).toContain('flex-wrap')
    // aspect-ratio on each image — scales correctly at any width
    expect(html).toContain('aspect-ratio')
    // flex-grow based on photo aspect ratio
    expect(html).toContain('flex-grow')
  })

  it('PhotoAlbum rows layout never switches to JS row groups (zero CLS)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // No row-group divs — the DOM structure stays the same after mount
    expect(html).not.toContain('np-album__row')
    // Filler span is present to prevent last-row stretch
    expect(html).toContain('flex-grow:9999')
  })

  it('PhotoAlbum with defaultContainerWidth uses JS layout on server (no flex-grow)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, defaultContainerWidth: 800 }),
    })

    const html = await renderToString(app)

    // All photos are present
    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    // JS layout emits calc() widths — not flex-grow proportions
    expect(html).toContain('calc(')
    // Items use fixed flex basis, not flex-grow
    expect(html).not.toContain('flex-grow:1.777')
    expect(html).not.toContain('flex-grow:0.8')
    // No skeleton (layout was computed)
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum without defaultContainerWidth still uses CSS flex-grow fallback', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // CSS fallback: flex-grow present
    expect(html).toContain('flex-grow')
    // No JS-computed calc widths for individual items
    expect(html).not.toContain('flex:0 0 auto')
  })

  it('PhotoAlbum with defaultContainerWidth includes filler span', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, defaultContainerWidth: 800 }),
    })

    const html = await renderToString(app)

    // Filler span must always be present regardless of layout mode
    expect(html).toContain('flex-grow:9999')
  })

  describe('with breakpoints (container query mode)', () => {
    it('emits @container style block with np-item-N rules', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [375, 600, 900] }),
      })
      const html = await renderToString(app)
      expect(html).toContain('@container')
      expect(html).toContain('np-item-0')
      expect(html).toContain('np-item-1')
      expect(html).toContain('np-item-2')
      expect(html).toContain('calc(')
    })

    it('sets container-type: inline-size on the album wrapper', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      expect(html).toContain('container-type')
      expect(html).toContain('inline-size')
    })

    it('renders no inline width on items when only breakpoints is provided', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      // flex:0 0 auto appears in the @container CSS — but NOT as inline styles on item elements
      expect(html).not.toContain('style="flex:0 0 auto')
      expect(html).toContain('ssr-1')
    })

    it('with both breakpoints and defaultContainerWidth renders inline calc() AND container query CSS', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600, 900], defaultContainerWidth: 800 }),
      })
      const html = await renderToString(app)
      expect(html).toContain('calc(')
      expect(html).toContain('@container')
    })

    it('columns layout with a single breakpoint emits one snapshot and no @container visibility CSS', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: { type: 'columns', columns: 3 }, lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      // Single-span: no @container visibility rules are generated
      expect(html).not.toContain('@container')
      // But the snapshot structure is rendered
      expect(html).toContain('np-album__bp-snapshot')
      expect(html).toContain('np-album__column')
      // Container query context is still set up on the wrapper so post-mount queries could attach
      expect(html).toContain('container-type')
    })
  })

  describe('columns/masonry breakpoint-aware SSR', () => {
    it('columns with defaultContainerWidth emits one snapshot with column structure and no flat grid', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: { type: 'columns', columns: 3 },
          lightbox: false,
          defaultContainerWidth: 900,
        }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__bp-snapshot')
      expect(html).toContain('np-album__column')
      // No @container CSS for a single snapshot
      expect(html).not.toContain('@container')
      // No hardcoded approximate-grid fallback
      expect(html).not.toMatch(/grid-template-columns\s*:\s*repeat\(3\s*,\s*1fr\)/)
      expect(html).toContain('ssr-1')
    })

    it('masonry with defaultContainerWidth emits one snapshot with column structure', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: { type: 'masonry', columns: 3 },
          lightbox: false,
          defaultContainerWidth: 900,
        }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__bp-snapshot')
      expect(html).toContain('np-album__column')
      expect(html).not.toContain('@container')
      expect(html).not.toMatch(/grid-template-columns\s*:\s*repeat\(3\s*,\s*1fr\)/)
      expect(html).toContain('ssr-1')
    })

    it('columns with explicit breakpoints and responsive spacing emits multiple snapshots and @container rules', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: {
            type: 'columns',
            columns: responsive({ 0: 1, 800: 3 }),
          },
          lightbox: false,
          breakpoints: [320, 800, 1200],
          spacing: responsive({ 0: 4, 640: 8, 1200: 16 }),
        }),
      })
      const html = await renderToString(app)
      const snapshotCount = (html.match(/np-album__bp-snapshot/g) ?? []).length
      expect(snapshotCount).toBeGreaterThan(1)
      expect(html).toContain('@container')
      expect(html).toContain('data-bp="bp-0-799"')
      expect(html).toContain('[data-bp=bp-0-799]')
      expect(html).toContain('.np-snapshot-')
      expect(html).toContain('container-type')
      expect(html).not.toMatch(/grid-template-columns\s*:\s*repeat\(3\s*,\s*1fr\)/)
    })

    it('columns infers breakpoints from responsive columns input (no explicit breakpoints)', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: {
            type: 'columns',
            columns: responsive({ 0: 1, 640: 2, 1120: 3 }),
          },
          lightbox: false,
        }),
      })
      const html = await renderToString(app)
      const snapshotCount = (html.match(/np-album__bp-snapshot/g) ?? []).length
      expect(snapshotCount).toBeGreaterThan(1)
      expect(html).toContain('@container')
      expect(html).toContain('np-album__column')
    })

    it('masonry infers breakpoints from responsive spacing', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: { type: 'masonry', columns: 3 },
          lightbox: false,
          spacing: responsive({ 0: 4, 640: 12, 1200: 20 }),
        }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__bp-snapshot')
      expect(html).toContain('@container')
    })

    it('scopes each snapshot visibility stylesheet to its own album root', async () => {
      const app = createSSRApp({
        render: () => h('div', null, [
          h(PhotoAlbum, {
            photos,
            layout: { type: 'columns', columns: responsive({ 0: 1, 800: 3 }) },
            lightbox: false,
            breakpoints: [320, 800],
          }),
          h(PhotoAlbum, {
            photos,
            layout: { type: 'masonry', columns: responsive({ 0: 1, 800: 3 }) },
            lightbox: false,
            breakpoints: [320, 800],
          }),
        ]),
      })
      const html = await renderToString(app)
      const snapshotMatches = [...html.matchAll(/np-snapshot-np-[a-z0-9]+/g)].map(match => match[0])
      expect(new Set(snapshotMatches).size).toBeGreaterThanOrEqual(2)
      expect(html).toMatch(/\.np-snapshot-np-[a-z0-9]+\[data-bp=bp-/)
    })

    it('snapshot SSR branch keeps button semantics when lightbox is enabled', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: {
            type: 'columns',
            columns: responsive({ 0: 1, 800: 3 }),
          },
          lightbox: true,
          breakpoints: [320, 800],
        }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__bp-snapshot')
      expect(html).toContain('role="button"')
      expect(html).toContain('tabindex="0"')
    })

    it('columns without any SSR signal falls back to the approximate flat grid', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, {
          photos,
          layout: { type: 'columns', columns: 3 },
          lightbox: false,
        }),
      })
      const html = await renderToString(app)
      // Approximate fallback — no snapshot structure
      expect(html).not.toContain('np-album__bp-snapshot')
      expect(html).toContain('grid-template-columns')
      expect(html).toContain('ssr-1')
    })
  })

  it('PhotoAlbum SSR columns layout uses CSS grid', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: { type: 'columns', columns: 3 }, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('grid-template-columns')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum accepts object-form layout with custom options', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: { type: 'rows', targetRowHeight: 200 }, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('flex-grow')
  })

  it('PhotoAlbum accepts top-level targetRowHeight shorthand', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', targetRowHeight: 200, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('flex-grow')
  })

  it('PhotoAlbum accepts top-level columns shorthand', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'columns', columns: 2, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('grid-template-columns:repeat(2')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum renders with its own lightbox during SSR', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('role="button"')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('PhotoGroup renders shared-lightbox SSR markup without crashing', async () => {
    const app = createSSRApp({
      render: () => h(PhotoGroup, null, {
        default: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('Photo renders standalone SSR markup with solo lightbox enabled', async () => {
    const app = createSSRApp({
      render: () => h(Photo, { photo: photos[0], lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('np-photo')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('infers breakpoints from responsive() metadata when rows options are responsive', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, {
        photos,
        layout: {
          type: 'rows',
          targetRowHeight: responsive({ 0: 180, 640: 240, 1120: 280 }),
        },
        spacing: responsive({ 0: 4, 640: 8 }),
        lightbox: false,
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('@container')
    expect(html).toContain('np-item-0')
    expect(html).toContain('class="np-album__item np-item-0" style="overflow:hidden;"')
    expect(html).not.toContain('style="flex-grow:1.777')
  })
})

describe('computeBreakpointStyles', () => {
  const twoPhotos = [
    makePhoto({ id: 'a', width: 1600, height: 900 }),
    makePhoto({ id: 'b', width: 1200, height: 1500 }),
  ]

  it('returns empty string for empty photos', () => {
    expect(computeBreakpointStyles({ photos: [], breakpoints: [600], containerName: 'test' })).toBe('')
  })

  it('returns empty string for empty breakpoints', () => {
    expect(computeBreakpointStyles({ photos: twoPhotos, breakpoints: [], containerName: 'test' })).toBe('')
  })

  it('deduplicates identical layouts across adjacent breakpoints', () => {
    // Use breakpoints that are close together — likely produce identical row breaks
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [900, 1200],
      containerName: 'test',
    })
    const ruleCount = (css.match(/@container/g) ?? []).length
    // Both widths may produce identical row assignments → deduplicated to 1 rule
    expect(ruleCount).toBeGreaterThan(0)
    expect(ruleCount).toBeLessThanOrEqual(2)
  })

  it('scopes rules to the provided containerName', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600, 900],
      containerName: 'my-album',
    })
    expect(css).toContain('my-album')
    expect(css).toContain('@container my-album')
  })

  it('generates np-item-N class rules for each photo', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600],
      containerName: 'test',
    })
    expect(css).toContain('.np-item-0')
    expect(css).toContain('.np-item-1')
  })

  it('includes calc() width expressions', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600, 900],
      containerName: 'test',
    })
    expect(css).toContain('calc(')
    expect(css).toContain('flex:0 0 auto')
  })
})
</file>
<file name="ssrHydration.test.ts" path="/packages/recipes/test/ssrHydration.test.ts">
// @vitest-environment jsdom

import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { responsive } from '@nuxt-photo/core'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'

const photos = [
  makePhoto({ id: 'hydrate-1', width: 1600, height: 900 }),
  makePhoto({ id: 'hydrate-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'hydrate-3', width: 1500, height: 1000 }),
]

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

function stringifyConsoleArgs(calls: unknown[][]) {
  return calls
    .flatMap(args => args)
    .map((arg) => {
      if (typeof arg === 'symbol') return arg.toString()
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.message
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join('\n')
}

async function hydrateAlbum(props: Record<string, unknown>) {
  const ssrApp = createSSRApp({
    render: () => h(PhotoAlbum, props),
  })
  const html = await renderToString(ssrApp)

  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)

  const app = createSSRApp({
    render: () => h(PhotoAlbum, props),
  })
  app.mount(host)
  await nextTick()

  return { host, app }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 900,
    bottom: 600,
    width: 900,
    height: 600,
    toJSON: () => ({}),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SSR hydration', () => {
  it('hydrates columns snapshot SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'columns',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      breakpoints: [320, 800],
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    const messages = stringifyConsoleArgs([...warn.mock.calls, ...error.mock.calls])
    expect(messages).not.toContain('Hydration text mismatch')
    expect(messages).not.toContain('Hydration completed but contains mismatches')

    app.unmount()
  })

  it('hydrates masonry snapshot SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'masonry',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      breakpoints: [320, 800],
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    const messages = stringifyConsoleArgs([...warn.mock.calls, ...error.mock.calls])
    expect(messages).not.toContain('Hydration text mismatch')
    expect(messages).not.toContain('Hydration completed but contains mismatches')

    app.unmount()
  })

  it('accepts shorthand layout props without extraneous-attr warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { app } = await hydrateAlbum({
      photos,
      layout: 'rows',
      targetRowHeight: responsive({ 0: 180, 800: 240 }),
      breakpoints: [320, 800],
      lightbox: false,
    })

    const messages = stringifyConsoleArgs([...warn.mock.calls, ...error.mock.calls])
    expect(messages).not.toContain('Extraneous non-props attributes')
    expect(messages).not.toContain('target-row-height')

    app.unmount()
  })
})
</file>
<file name="build.config.ts" path="/packages/recipes/build.config.ts">
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/', builder: 'mkdist', format: 'esm', declaration: true },
  ],
  clean: true,
  externals: ['vue', '@nuxt-photo/core', '@nuxt-photo/vue'],
  failOnWarn: false,
})
</file>
<file name="package.json" path="/packages/recipes/package.json">
{
  "name": "@nuxt-photo/recipes",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./styles/*": "./dist/styles/*"
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "dependencies": {
    "@nuxt-photo/core": "workspace:*",
    "@nuxt-photo/vue": "workspace:*",
    "embla-carousel": "9.0.0-rc01",
    "embla-carousel-autoplay": "9.0.0-rc01",
    "embla-carousel-vue": "9.0.0-rc01"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "unbuild": "^3.5.0",
    "typescript": "^5.9.2",
    "vue": "^3.5.13",
    "vue-tsc": "^2.2.8"
  }
}
</file>
<file name="tsconfig.json" path="/packages/recipes/tsconfig.json">
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "preserve"
  },
  "include": ["src"]
}
</file>
<file name="closeTransition.ts" path="/packages/vue/src/composables/ghost/closeTransition.ts">
import {
  flipTransform,
  isUsableRect,
  makeGhostBaseStyle,
  nextFrame,
  wait,
  animateNumber,
  easeOutCubic,
  shouldUseFlip,
  planCloseTransition,
  type PhotoItem,
  type RectLike,
} from '@nuxt-photo/core'
import { closeDurationMs, fadeDurationMs, type CloseCallbacks, type GhostState } from './types'
import { resetCloseState } from './state'

const MAX_ANIMATION_MS = 2000

async function doInstantClose(s: GhostState) {
  s.debug?.log('transitions', 'close: INSTANT (mode=none)')
  s.mediaOpacity.value = 0
  s.chromeOpacity.value = 0
  s.overlayOpacity.value = 0
}

async function doFadeClose(s: GhostState, photo: PhotoItem, frameRect: RectLike | null) {
  const fadeCloseDuration = 300
  const backdropDelayRatio = 0.2

  s.animating.value = true
  s.chromeOpacity.value = 0
  s.disableBackdropTransition.value = true

  if (frameRect) {
    s.debug?.log('transitions', `close FADE: ghost scale-out at ${frameRect.width.toFixed(0)}x${frameRect.height.toFixed(0)} @ (${frameRect.left.toFixed(0)},${frameRect.top.toFixed(0)})`)

    s.ghostSrc.value = photo.src
    s.ghostVisible.value = true
    s.ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'contain',
      transformOrigin: 'center center',
      pointerEvents: 'none',
      willChange: 'transform, opacity',
      borderRadius: '16px',
      opacity: '1',
      transform: 'scale(1)',
      ...makeGhostBaseStyle(frameRect),
    }

    await nextFrame()
    s.mediaOpacity.value = 0
    await nextFrame()

    const overlayStart = s.overlayOpacity.value

    await animateNumber(0, 1, fadeCloseDuration, (t) => {
      const sc = 1 - 0.12 * t
      s.ghostStyle.value = {
        ...s.ghostStyle.value,
        transform: `scale(${sc})`,
        opacity: String(1 - t),
      }

      const backdropT = Math.max(0, (t - backdropDelayRatio) / (1 - backdropDelayRatio))
      s.overlayOpacity.value = overlayStart * (1 - backdropT)
    }, easeOutCubic)
  } else {
    s.debug?.log('transitions', 'close FADE: no frame rect, simple overlay fade')
    s.mediaOpacity.value = 0

    await animateNumber(s.overlayOpacity.value, 0, fadeDurationMs, (v) => {
      s.overlayOpacity.value = v
    }, easeOutCubic)
  }

  s.debug?.log('transitions', 'close FADE: animation complete')
}

async function doFlipClose(
  s: GhostState,
  photo: PhotoItem,
  fromRect: RectLike,
  toRect: DOMRect,
  dragOffsetY: number,
  dragScale: number,
) {
  s.debug?.log('transitions', 'close FLIP: starting')

  s.animating.value = true
  s.disableBackdropTransition.value = true
  s.hiddenThumbIndex.value = s.activeIndex.value
  s.chromeOpacity.value = 0

  s.ghostSrc.value = photo.src
  s.debug?.log('transitions', `close FLIP: ghostSrc=${photo.src}`)

  const adjustedFromRect: RectLike = (dragOffsetY !== 0 || dragScale !== 1)
    ? {
        left: fromRect.left + (fromRect.width * (1 - dragScale)) / 2,
        top: fromRect.top + dragOffsetY + (fromRect.height * (1 - dragScale)) / 2,
        width: fromRect.width * dragScale,
        height: fromRect.height * dragScale,
      }
    : fromRect

  if (dragOffsetY !== 0 || dragScale !== 1) {
    s.debug?.log('transitions', `close FLIP: drag-adjusted fromRect — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`, adjustedFromRect)
  }

  const initialTransform = flipTransform(adjustedFromRect, toRect)
  s.debug?.log('transitions', `close FLIP: ghost base at thumbnail ${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})`)
  s.debug?.log('transitions', `close FLIP: initial transform: ${initialTransform}`)

  s.ghostVisible.value = true
  s.ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
    transition:
      `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    ...makeGhostBaseStyle(toRect),
    transform: initialTransform,
  }

  s.debug?.log('transitions', 'close FLIP: ghost visible, waiting for next frame')
  await nextFrame()

  s.mediaOpacity.value = 0
  await nextFrame()

  s.debug?.log('transitions', 'close FLIP: animating to identity (thumbnail position)')
  s.overlayOpacity.value = 0
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
  }

  await wait(closeDurationMs)

  s.hiddenThumbIndex.value = null
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transition: 'opacity 180ms ease',
    opacity: '0',
  }
  await wait(180)

  s.debug?.log('transitions', `close FLIP: animation complete (${closeDurationMs}ms)`)
}

export function createCloseTransition(s: GhostState) {
  let animationGuardId: ReturnType<typeof setTimeout> | null = null

  function clearAnimationGuard() {
    if (animationGuardId) {
      clearTimeout(animationGuardId)
      animationGuardId = null
    }
  }

  function startAnimationGuard() {
    clearAnimationGuard()
    animationGuardId = setTimeout(() => {
      if (s.animating.value) {
        s.debug?.warn('transitions', `RECOVERY: animating stuck for ${MAX_ANIMATION_MS}ms, forcing resetCloseState`)
        resetCloseState(s, clearAnimationGuard)
      }
    }, MAX_ANIMATION_MS)
  }

  async function close(callbacks: CloseCallbacks) {
    if (!s.lightboxMounted.value || s.animating.value) {
      s.debug?.warn('transitions', `close: BLOCKED — lightboxMounted=${s.lightboxMounted.value} animating=${s.animating.value}`)
      return
    }

    s.debug?.group('transitions', `close(activeIndex=${s.activeIndex.value})`)
    s.debug?.log('transitions', `close: pre-state — isZoomedIn=${callbacks.isZoomedIn.value} closeDragY=${s.closeDragY.value.toFixed(1)} ghostVisible=${s.ghostVisible.value} mediaOpacity=${s.mediaOpacity.value.toFixed(2)}`)

    startAnimationGuard()

    callbacks.cancelTapTimer()
    callbacks.resetGestureState()

    const dragOffsetY = s.closeDragY.value
    const dragScale = 1 - s.closeDragRatio.value * 0.05
    if (dragOffsetY !== 0) {
      s.debug?.log('transitions', `close: captured drag state — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`)
    }

    if (callbacks.isZoomedIn.value) {
      s.debug?.log('transitions', 'close: resetting zoom')
      callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
    }
    s.closeDragY.value = 0
    await nextFrame()

    callbacks.syncGeometry()

    const photo = s.currentPhoto.value

    try {
      const fromRect = s.getAbsoluteFrameRect(photo)
      s.debug?.log('transitions', 'close: fromRect (lightbox frame)',
        fromRect ? `${fromRect.width.toFixed(0)}x${fromRect.height.toFixed(0)} @ (${fromRect.left.toFixed(0)},${fromRect.top.toFixed(0)})` : 'NULL')

      const thumbEl = s.thumbRefs.get(s.activeIndex.value)
      s.debug?.log('transitions', `close: thumbRef lookup index=${s.activeIndex.value} found=${!!thumbEl} registeredRefs=[${[...s.thumbRefs.keys()].join(',')}]`)

      const toRect = thumbEl?.getBoundingClientRect() ?? null
      s.debug?.log('transitions', 'close: toRect (thumbnail)',
        toRect ? `${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})` : 'NULL')

      let plan = planCloseTransition({
        fromRect,
        toRect,
        thumbRefExists: !!thumbEl,
        config: s.transitionConfig ?? { mode: 'auto', autoThreshold: 0.55 },
        debug: s.debug,
      })

      s.debug?.log('transitions', `close: plan=${plan.mode} reason=${plan.reason}`)

      if (plan.reason === 'thumb-off-screen' && thumbEl) {
        s.debug?.log('transitions', 'close: thumbnail off-screen, attempting scrollIntoView recovery')
        try {
          thumbEl.scrollIntoView({ behavior: 'instant', block: 'nearest' })
        } catch {
          thumbEl.scrollIntoView({ block: 'nearest' })
        }
        await nextFrame()

        const retriedRect = thumbEl.getBoundingClientRect()
        s.debug?.log('transitions', 'close: retried toRect after scroll',
          `${retriedRect.width.toFixed(0)}x${retriedRect.height.toFixed(0)} @ (${retriedRect.left.toFixed(0)},${retriedRect.top.toFixed(0)})`)

        if (isUsableRect(retriedRect) && shouldUseFlip(retriedRect, s.transitionConfig ?? { mode: 'auto', autoThreshold: 0.55 }, s.debug)) {
          s.debug?.log('transitions', 'close: scroll recovery succeeded → upgrading to FLIP')
          plan = { mode: 'flip', durationMs: closeDurationMs, fromRect: fromRect!, toRect: retriedRect, reason: 'scrolled-into-view' }
        } else {
          s.debug?.log('transitions', 'close: scroll recovery failed → staying with FADE')
        }
      }

      if (plan.mode === 'instant') {
        await doInstantClose(s)
      } else if (plan.mode === 'flip' && plan.fromRect && plan.toRect) {
        await doFlipClose(s, photo, plan.fromRect, plan.toRect as DOMRect, dragOffsetY, dragScale)
      } else {
        await doFadeClose(s, photo, fromRect)
      }

      s.debug?.log('transitions', 'close: complete')
      s.debug?.groupEnd('transitions')
      resetCloseState(s, clearAnimationGuard)
    } catch (err) {
      s.debug?.warn('transitions', 'close: error, forcing recovery', err)
      s.debug?.groupEnd('transitions')
      resetCloseState(s, clearAnimationGuard)
      throw err
    }
  }

  async function animateCloseDragTo(target: number, duration = 220) {
    const start = s.closeDragY.value
    await animateNumber(start, target, duration, (value) => {
      s.closeDragY.value = value
    })
  }

  async function handleCloseGesture(deltaY: number, velocityY: number, closeFn: () => Promise<void>) {
    const threshold = Math.min(180, (s.areaMetrics.value?.height ?? 600) * 0.2)

    s.debug?.log('gestures', `closeGesture: deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)} threshold=${threshold.toFixed(0)}`)

    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      s.debug?.log('gestures', 'closeGesture: threshold exceeded → closing')
      s.debug?.log('transitions', `close: triggered by drag gesture — deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)}`)
      await closeFn()
      return
    }

    s.debug?.log('gestures', 'closeGesture: below threshold → bouncing back')
    s.animating.value = true
    try {
      await animateCloseDragTo(0)
    } finally {
      s.animating.value = false
    }
  }

  function handleBackdropClick(closeFn: () => Promise<void>) {
    if (s.animating.value) return
    s.debug?.log('transitions', 'backdrop click → closing')
    void closeFn()
  }

  return { close, animateCloseDragTo, handleCloseGesture, handleBackdropClick }
}
</file>
<file name="openTransition.ts" path="/packages/vue/src/composables/ghost/openTransition.ts">
import { nextTick } from 'vue'
import {
  flipTransform,
  isUsableRect,
  makeGhostBaseStyle,
  ensureImageLoaded,
  nextFrame,
  wait,
  animateNumber,
  easeOutCubic,
  shouldUseFlip,
  type PhotoItem,
  type RectLike,
} from '@nuxt-photo/core'
import { openDurationMs, type GhostState, type TransitionCallbacks } from './types'
import { resetOpenState } from './state'

async function doInstantOpen(s: GhostState, photo: PhotoItem) {
  s.debug?.log('transitions', 'open: INSTANT (mode=none)')
  s.overlayOpacity.value = 1
  await ensureImageLoaded(photo.src)
  s.mediaOpacity.value = 1
  s.chromeOpacity.value = 1
}

async function doFadeOpen(s: GhostState, photo: PhotoItem, targetRect: RectLike | null) {
  const fadeOpenDuration = 300

  s.animating.value = true
  const imgSrc = photo.thumbSrc || photo.src

  if (targetRect) {
    s.debug?.log('transitions', `open FADE: ghost scale-in at ${targetRect.width.toFixed(0)}x${targetRect.height.toFixed(0)} @ (${targetRect.left.toFixed(0)},${targetRect.top.toFixed(0)})`)

    s.ghostSrc.value = imgSrc
    s.ghostVisible.value = true
    s.ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'contain',
      transformOrigin: 'center center',
      pointerEvents: 'none',
      willChange: 'transform, opacity',
      borderRadius: '16px',
      opacity: '0',
      transform: 'scale(0.92)',
      ...makeGhostBaseStyle(targetRect),
    }

    await nextFrame()

    await animateNumber(0, 1, fadeOpenDuration, (t) => {
      const sc = 0.92 + 0.08 * t
      s.ghostStyle.value = {
        ...s.ghostStyle.value,
        transform: `scale(${sc})`,
        opacity: String(t),
      }
      s.overlayOpacity.value = t
    }, easeOutCubic)

    await ensureImageLoaded(photo.src)
    s.mediaOpacity.value = 1
    s.ghostVisible.value = false
    s.chromeOpacity.value = 1
  } else {
    s.debug?.log('transitions', 'open FADE: no target rect, simple overlay fade')

    await animateNumber(0, 1, fadeOpenDuration, (v) => {
      s.overlayOpacity.value = v
    }, easeOutCubic)

    await ensureImageLoaded(photo.src)
    s.mediaOpacity.value = 1
    s.chromeOpacity.value = 1
  }

  s.animating.value = false
}

async function doFlipOpen(s: GhostState, index: number, photo: PhotoItem, fromRect: DOMRect, toRect: RectLike) {
  s.debug?.log('transitions', 'open: using FLIP animation')

  s.animating.value = true
  s.hiddenThumbIndex.value = index

  const thumbSrc = photo.thumbSrc || photo.src
  s.ghostSrc.value = thumbSrc
  s.ghostVisible.value = true
  s.ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    transition:
      `transform ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    ...makeGhostBaseStyle(toRect),
    transform: flipTransform(fromRect, toRect),
  }

  await nextFrame()

  s.overlayOpacity.value = 1
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  }

  await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.src)])

  s.mediaOpacity.value = 1
  await nextFrame()
  resetOpenState(s)
}

export async function openTransition(s: GhostState, index: number, callbacks: TransitionCallbacks) {
  if (s.animating.value) return

  s.debug?.group('transitions', `open(index=${index})`)

  callbacks.resetGestureState()
  callbacks.cancelTapTimer()

  s.activeIndex.value = index
  s.uiVisible.value = true

  s.lightboxMounted.value = true
  s.overlayOpacity.value = 0
  s.mediaOpacity.value = 0
  s.chromeOpacity.value = 0

  await nextTick()
  await nextFrame()

  callbacks.syncGeometry()
  callbacks.refreshZoomState(true)

  const photo = s.currentPhoto.value

  try {
    if (s.transitionConfig?.mode === 'none') {
      await doInstantOpen(s, photo)
      s.debug?.log('transitions', 'open: complete')
      s.debug?.groupEnd('transitions')
      return
    }

    const thumbEl = s.thumbRefs.get(index)
    const fromRect = thumbEl?.getBoundingClientRect() ?? null
    const toRect = s.getAbsoluteFrameRect(photo)

    const useFlip = fromRect && toRect && isUsableRect(fromRect)
      && (!s.transitionConfig || shouldUseFlip(fromRect, s.transitionConfig, s.debug))

    if (useFlip) {
      await doFlipOpen(s, index, photo, fromRect, toRect)
    } else {
      await doFadeOpen(s, photo, toRect)
    }

    s.debug?.log('transitions', 'open: complete')
    s.debug?.groupEnd('transitions')
  } catch (err) {
    s.debug?.warn('transitions', 'open: error, forcing recovery', err)
    s.debug?.groupEnd('transitions')
    s.overlayOpacity.value = 1
    s.mediaOpacity.value = 1
    resetOpenState(s)
    throw err
  }
}
</file>
<file name="state.ts" path="/packages/vue/src/composables/ghost/state.ts">
import { computed, ref, type ComponentPublicInstance, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, DebugLogger, PhotoItem, TransitionModeConfig } from '@nuxt-photo/core'
import type { GhostState } from './types'

export function createGhostState(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: GhostState['getAbsoluteFrameRect'],
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
): GhostState {
  const lightboxMounted = ref(false)
  const animating = ref(false)
  const ghostVisible = ref(false)
  const ghostSrc = ref('')
  const ghostStyle = ref<CSSProperties>({})
  const hiddenThumbIndex = ref<number | null>(null)

  const overlayOpacity = ref(0)
  const mediaOpacity = ref(0)
  const chromeOpacity = ref(0)
  const uiVisible = ref(true)

  const closeDragY = ref(0)
  const disableBackdropTransition = ref(false)

  const closeDragRatio = computed(() => {
    const height = areaMetrics.value?.height || 1
    return Math.min(0.75, Math.abs(closeDragY.value) / Math.max(240, height * 0.85))
  })

  const thumbRefs = new Map<number, HTMLElement>()

  return {
    lightboxMounted, animating, ghostVisible, ghostSrc, ghostStyle, hiddenThumbIndex,
    overlayOpacity, mediaOpacity, chromeOpacity, uiVisible,
    closeDragY, disableBackdropTransition, closeDragRatio,
    thumbRefs,
    activeIndex, currentPhoto, areaMetrics, getAbsoluteFrameRect,
    debug, transitionConfig,
  }
}

export function setThumbRef(state: GhostState, index: number) {
  return (value: Element | ComponentPublicInstance | null) => {
    const el = value instanceof HTMLElement
      ? value
      : value && '$el' in value && value.$el instanceof HTMLElement
        ? value.$el
        : null

    if (el instanceof HTMLElement) {
      state.thumbRefs.set(index, el)
    } else {
      state.thumbRefs.delete(index)
    }
  }
}

export function resetOpenState(state: GhostState) {
  state.ghostVisible.value = false
  state.ghostSrc.value = ''
  state.hiddenThumbIndex.value = null
  state.overlayOpacity.value = 1
  state.mediaOpacity.value = 1
  state.chromeOpacity.value = 1
  state.animating.value = false
  state.closeDragY.value = 0
  state.disableBackdropTransition.value = false
}

export function resetCloseState(state: GhostState, clearGuard: () => void) {
  state.debug?.log('transitions', 'resetCloseState: unmounting lightbox')
  clearGuard()
  state.ghostVisible.value = false
  state.ghostSrc.value = ''
  state.hiddenThumbIndex.value = null
  state.closeDragY.value = 0
  state.disableBackdropTransition.value = false
  state.overlayOpacity.value = 0
  state.mediaOpacity.value = 0
  state.chromeOpacity.value = 0
  state.animating.value = false
  state.lightboxMounted.value = false
}
</file>
<file name="types.ts" path="/packages/vue/src/composables/ghost/types.ts">
import type { ComponentPublicInstance, ComputedRef, CSSProperties, Ref } from 'vue'
import type { AreaMetrics, DebugLogger, PanState, PhotoItem, RectLike, TransitionModeConfig } from '@nuxt-photo/core'

export const openDurationMs = 420
export const closeDurationMs = 380
export const fadeDurationMs = 200

export type TransitionCallbacks = {
  syncGeometry: () => void
  refreshZoomState: (reset: boolean) => void
  resetGestureState: () => void
  cancelTapTimer: () => void
}

export type CloseCallbacks = TransitionCallbacks & {
  setPanzoomImmediate: (scale: number, pan: PanState) => void
  isZoomedIn: ComputedRef<boolean>
}

/** Shared reactive state passed between ghost transition submodules. */
export interface GhostState {
  // Core state
  lightboxMounted: Ref<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  ghostSrc: Ref<string>
  ghostStyle: Ref<CSSProperties>
  hiddenThumbIndex: Ref<number | null>

  // Opacity layers
  overlayOpacity: Ref<number>
  mediaOpacity: Ref<number>
  chromeOpacity: Ref<number>
  uiVisible: Ref<boolean>

  // Drag-to-close
  closeDragY: Ref<number>
  disableBackdropTransition: Ref<boolean>

  // Computed
  closeDragRatio: ComputedRef<number>

  // Thumb DOM references
  thumbRefs: Map<number, HTMLElement>

  // External dependencies
  activeIndex: Ref<number>
  currentPhoto: ComputedRef<PhotoItem>
  areaMetrics: Ref<AreaMetrics | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  debug?: DebugLogger
  transitionConfig?: TransitionModeConfig
}
</file>
<file name="index.ts" path="/packages/vue/src/composables/index.ts">
export { useLightbox } from './useLightbox'
export { useLightboxProvider } from './useLightboxProvider'
export { useContainerWidth } from './useContainerWidth'
</file>
<file name="useCarousel.ts" path="/packages/vue/src/composables/useCarousel.ts">
import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType } from 'embla-carousel'
import { fitRect, type AreaMetrics, type CarouselConfig, type PhotoItem, type RectLike, type DebugLogger } from '@nuxt-photo/core'

export function useCarousel(
  photos: ComputedRef<PhotoItem[]>,
  areaMetrics: Ref<AreaMetrics | null>,
  config: CarouselConfig,
  isZoomedIn: ComputedRef<boolean>,
  animating: Ref<boolean>,
  debug?: DebugLogger,
) {
  const activeIndex = ref(0)
  const scrollProgress = ref(0)
  const emblaOptions = ref({ loop: true, duration: 25, startSnap: 0 })

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)

  const currentPhoto = computed<PhotoItem>(() => photos.value[activeIndex.value] ?? photos.value[0]!)

  watch(emblaApi, (api) => {
    if (!api) return

    api.on('select', (_api: EmblaCarouselType) => {
      const newIndex = _api.selectedSnap()
      debug?.log('slides', `embla select: ${activeIndex.value}→${newIndex}`)
      activeIndex.value = newIndex
    })

    api.on('scroll', (_api: EmblaCarouselType) => {
      scrollProgress.value = _api.scrollProgress()
    })

    api.on('pointerdown', () => {
      if (isZoomedIn.value || animating.value) {
        debug?.log('gestures', `embla pointerdown blocked (zoomed=${isZoomedIn.value} animating=${animating.value})`)
        return false
      }
    })
  }, { immediate: true })

  function getRelativeFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(
      { left: 0, top: 0, width: area.width, height: area.height },
      photo.width / photo.height,
    )
  }

  function getAbsoluteFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(area, photo.width / photo.height)
  }

  function getSlideFrameStyle(photo: PhotoItem): CSSProperties {
    const frame = getRelativeFrameRect(photo)
    return {
      width: `${frame?.width ?? 0}px`,
      height: `${frame?.height ?? 0}px`,
    }
  }

  function getSlideEffectStyle(slideIndex: number): CSSProperties {
    const api = emblaApi.value
    if (!api) return {}

    const snaps = api.snapList()
    if (!snaps.length) return {}

    const progress = scrollProgress.value
    const snapPos = snaps[slideIndex] ?? 0

    let distance = progress - snapPos
    if (distance > 0.5) distance -= 1
    if (distance < -0.5) distance += 1

    const n = photos.value.length
    const slidePosition = distance * n

    // Skip effect computation for slides more than 1.5 positions away — saves CPU per frame
    if (Math.abs(slidePosition) > 1.5) return {}

    switch (config.style) {
      case 'classic':
        return {}

      case 'parallax': {
        const { amount, scale, opacity } = config.parallax
        const absPos = Math.min(1, Math.abs(slidePosition))
        const width = areaMetrics.value?.width ?? 1
        const parallaxShift = slidePosition * amount * width * -1
        const scaleValue = 1 - absPos * (1 - scale)
        const opacityValue = 1 - absPos * (1 - opacity)
        return {
          transform: `translate3d(${parallaxShift}px, 0, 0) scale(${scaleValue})`,
          opacity: String(Math.max(0, opacityValue)),
        }
      }

      case 'fade': {
        const absPos = Math.min(1, Math.abs(slidePosition))
        const opacityValue = Math.max(config.fade.minOpacity, 1 - absPos)
        return {
          opacity: String(opacityValue),
          transform: `translate3d(${slidePosition * 40}px, 0, 0)`,
        }
      }
    }
  }

  function goToNext() {
    emblaApi.value?.goToNext()
  }

  function goToPrev() {
    emblaApi.value?.goToPrev()
  }

  function goTo(index: number, instant = false) {
    emblaOptions.value = { ...emblaOptions.value, startSnap: index }
    activeIndex.value = index
    emblaApi.value?.goTo(index, instant)
  }

  function selectedSnap(): number {
    return emblaApi.value?.selectedSnap() ?? activeIndex.value
  }

  onBeforeUnmount(() => {
    emblaApi.value?.destroy()
  })

  return {
    emblaRef,
    emblaApi,
    activeIndex,
    currentPhoto,
    scrollProgress,

    getRelativeFrameRect,
    getAbsoluteFrameRect,
    getSlideFrameStyle,
    getSlideEffectStyle,

    goToNext,
    goToPrev,
    goTo,
    selectedSnap,
  }
}
</file>
<file name="useContainerWidth.ts" path="/packages/vue/src/composables/useContainerWidth.ts">
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** Max width delta considered a scrollbar oscillation. */
const MAX_SCROLLBAR_WIDTH = 20

function snapToBreakpoint(width: number, breakpoints: readonly number[]): number {
  const sorted = [...breakpoints].filter(bp => bp > 0).sort((a, b) => b - a)
  if (sorted.length === 0) return width
  // Synthetic floor: half the smallest declared breakpoint
  sorted.push(Math.floor(sorted[sorted.length - 1] / 2))
  return sorted.find(bp => bp <= width) ?? sorted[sorted.length - 1]
}

/**
 * Tracks an element's width via ResizeObserver with optional breakpoint snapping and
 * scrollbar-oscillation detection. SSR-safe: initialises from `defaultContainerWidth`
 * and only starts the observer after mount.
 */
export function useContainerWidth(
  containerRef: Ref<HTMLElement | null>,
  options?: {
    /** Pre-render width so the JS layout runs on the server. Avoids CLS when it matches the breakpoint. */
    defaultContainerWidth?: number
    /** Snap observed width down to the largest breakpoint ≤ actual width. */
    breakpoints?: readonly number[]
  },
): { containerWidth: Ref<number> } {
  const containerWidth = ref<number>(options?.defaultContainerWidth ?? 0)

  function resolveWidth(raw: number): number {
    if (!raw || raw <= 0) return 0
    if (options?.breakpoints?.length) {
      return snapToBreakpoint(raw, options.breakpoints)
    }
    return raw
  }

  let resizeObserver: ResizeObserver | null = null
  let prevWidth = 0

  onMounted(() => {
    if (!containerRef.value) return

    const initial = resolveWidth(containerRef.value.getBoundingClientRect().width)
    if (initial > 0) {
      prevWidth = containerWidth.value
      containerWidth.value = initial
    }

    resizeObserver = new ResizeObserver((entries) => {
      const raw = entries[0]?.contentRect.width
      if (!raw || raw <= 0) return

      const newW = resolveWidth(raw)

      // Scrollbar oscillation: width bounces back to prevWidth within MAX_SCROLLBAR_WIDTH
      if (newW === prevWidth && Math.abs(newW - containerWidth.value) <= MAX_SCROLLBAR_WIDTH) {
        containerWidth.value = Math.min(containerWidth.value, newW)
        return
      }

      prevWidth = containerWidth.value
      containerWidth.value = newW
    })

    resizeObserver.observe(containerRef.value)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })

  return { containerWidth }
}
</file>
<file name="useGestures.ts" path="/packages/vue/src/composables/useGestures.ts">
import { ref, type ComputedRef, type Ref } from 'vue'
import {
  classifyGesture as coreClassifyGesture,
  isDoubleTap as coreIsDoubleTap,
  VelocityTracker,
  type AreaMetrics,
  type GestureMode,
  type PanState,
  type PanzoomMotion,
  type PhotoItem,
  type ZoomState,
  type DebugLogger,
} from '@nuxt-photo/core'

type GestureConfig = {
  lightboxMounted: Ref<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  mediaAreaRef: Ref<HTMLElement | null>
  currentPhoto: ComputedRef<PhotoItem>
  areaMetrics: Ref<AreaMetrics | null>
  uiVisible: Ref<boolean>
  panState: Ref<PanState>
  zoomState: Ref<ZoomState>
  setCloseDragY: (val: number) => void
  transitionInProgress: ComputedRef<boolean>

  panzoomMotion: PanzoomMotion
  setPanzoomImmediate: (scale: number, pan: PanState, syncRefs?: boolean) => void
  startPanzoomSpring: (targetScale: number, targetPan: PanState, options?: { tension?: number; friction?: number }) => void
  clampPan: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
  clampPanWithResistance: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
  applyWheelZoom: (event: WheelEvent) => void
  toggleZoom: (clientPoint?: { x: number; y: number }) => void
  getPanBounds: (photo: PhotoItem, zoom: number) => { x: number; y: number }

  goToNext: () => void
  goToPrev: () => void
  goTo: (index: number, instant?: boolean) => void
  selectedSnap: () => number

  handleCloseGesture: (deltaY: number, velocityY: number, closeFn: () => Promise<void>) => Promise<void>
  close: () => Promise<void>
}

export function useGestures(config: GestureConfig, debug?: DebugLogger) {
  const gesturePhase = ref<GestureMode>('idle')

  let pointerSession: {
    id: number
    pointerType: string
    startX: number
    startY: number
    lastX: number
    lastY: number
    moved: boolean
    startPan: PanState
  } | null = null

  let tapTimer: ReturnType<typeof setTimeout> | undefined
  let lastTap: { time: number; clientX: number; clientY: number } | null = null
  let lastWheelTime = 0
  let emblaStolen = false

  const velocityTracker = new VelocityTracker(100)

  function resetGestureState() {
    gesturePhase.value = 'idle'
    pointerSession = null
    emblaStolen = false
  }

  function cancelTapTimer() {
    if (tapTimer) {
      clearTimeout(tapTimer)
      tapTimer = undefined
    }
  }

  function handleTap(clientX: number, clientY: number) {
    const now = performance.now()
    const doubleTap = coreIsDoubleTap(now, lastTap, clientX, clientY)

    cancelTapTimer()

    if (doubleTap) {
      lastTap = null
      debug?.log('gestures', 'double-tap → toggleZoom at', { x: clientX, y: clientY })
      config.toggleZoom({ x: clientX, y: clientY })
      return
    }

    lastTap = { time: now, clientX, clientY }
    tapTimer = setTimeout(() => {
      debug?.log('gestures', 'single-tap → toggle UI visibility')
      config.uiVisible.value = !config.uiVisible.value
      tapTimer = undefined
    }, 220)
  }

  function classifyGesture(deltaX: number, deltaY: number, pointerType: string): GestureMode {
    const bounds = config.getPanBounds(config.currentPhoto.value, config.zoomState.value.current)
    return coreClassifyGesture(
      deltaX,
      deltaY,
      pointerType,
      config.isZoomedIn.value,
      bounds,
      config.panState.value,
    )
  }

  function onMediaPointerDown(event: PointerEvent) {
    if (!config.lightboxMounted.value || config.ghostVisible.value) return

    if (config.animating.value) {
      event.stopPropagation()
      return
    }

    if (event.pointerType === 'mouse' && event.button !== 0) return

    if (config.isZoomedIn.value) {
      event.stopPropagation()
    }

    cancelTapTimer()
    velocityTracker.reset()
    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointerSession = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      startPan: {
        x: config.panzoomMotion.x,
        y: config.panzoomMotion.y,
      },
    }

    gesturePhase.value = 'idle'
    emblaStolen = false

    if (config.isZoomedIn.value) {
      config.mediaAreaRef.value?.setPointerCapture(event.pointerId)
    }
  }

  function onMediaPointerMove(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    const deltaX = event.clientX - pointerSession.startX
    const deltaY = event.clientY - pointerSession.startY

    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointerSession.lastX = event.clientX
    pointerSession.lastY = event.clientY
    pointerSession.moved = pointerSession.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (gesturePhase.value === 'idle') {
      const mode = classifyGesture(deltaX, deltaY, pointerSession.pointerType)
      if (mode !== 'idle') {
        debug?.log('gestures', `classified: ${mode} (deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} pointer=${pointerSession.pointerType})`)
        gesturePhase.value = mode

        if (mode === 'close') {
          event.stopPropagation()
          emblaStolen = true
          config.goTo(config.selectedSnap(), true)
          config.mediaAreaRef.value?.setPointerCapture(event.pointerId)
        }

        if (mode === 'slide' && config.isZoomedIn.value) {
          if (deltaX > 0) {
            config.goToPrev()
          } else {
            config.goToNext()
          }
          resetGestureState()
          return
        }
      }
    }

    if (gesturePhase.value === 'close' || gesturePhase.value === 'pan') {
      event.stopPropagation()
    }

    if (gesturePhase.value === 'close') {
      config.setCloseDragY(deltaY)
      return
    }

    if (gesturePhase.value === 'pan') {
      const targetPan = {
        x: pointerSession.startPan.x + deltaX,
        y: pointerSession.startPan.y + deltaY,
      }
      config.setPanzoomImmediate(
        config.panzoomMotion.scale,
        config.clampPanWithResistance(targetPan, config.panzoomMotion.scale),
        false,
      )
    }
  }

  async function onMediaPointerUp(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    if (config.isZoomedIn.value || emblaStolen) {
      try {
        config.mediaAreaRef.value?.releasePointerCapture(event.pointerId)
      } catch {
        // ignored
      }
    }

    const session = pointerSession
    const deltaX = event.clientX - session.startX
    const deltaY = event.clientY - session.startY
    const mode = gesturePhase.value

    const { vx: velocityX, vy: velocityY } = velocityTracker.getVelocity()

    resetGestureState()

    if (mode === 'close' || mode === 'pan') {
      event.stopPropagation()
    }

    debug?.log('gestures', `pointerUp: mode=${mode} moved=${session.moved} deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} vX=${velocityX.toFixed(3)} vY=${velocityY.toFixed(3)}`)

    if (!session.moved || mode === 'idle') {
      handleTap(event.clientX, event.clientY)
      return
    }

    if (mode === 'close') {
      await config.handleCloseGesture(deltaY, velocityY, config.close)
      return
    }

    if (mode === 'pan') {
      const clampedPan = config.clampPan(
        { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
        config.panzoomMotion.scale,
      )
      config.startPanzoomSpring(config.panzoomMotion.scale, clampedPan, {
        tension: 170,
        friction: 17,
      })
    }
  }

  function onMediaPointerCancel(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    const wasZoomed = config.isZoomedIn.value || emblaStolen
    resetGestureState()

    if (wasZoomed) {
      config.setPanzoomImmediate(
        config.panzoomMotion.scale,
        config.clampPan(
          { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
          config.panzoomMotion.scale,
        ),
      )
    }
    config.setCloseDragY(0)
  }

  function onWheel(event: WheelEvent) {
    if (!config.lightboxMounted.value || config.animating.value) return

    const now = performance.now()
    const isTrackpad = Math.abs(event.deltaY) < 100 && Math.abs(event.deltaX) < 100
    const throttleMs = isTrackpad ? 200 : 45

    if (now - lastWheelTime < throttleMs) {
      event.preventDefault()
      return
    }

    lastWheelTime = now
    event.preventDefault()
    debug?.log('zoom', `wheel: deltaY=${event.deltaY.toFixed(1)} isTrackpad=${isTrackpad}`)
    config.applyWheelZoom(event)
  }

  function onKeydown(event: KeyboardEvent) {
    if (!config.lightboxMounted.value || config.animating.value) return

    if (event.key === 'Escape') {
      debug?.log('gestures', 'key: Escape → close')
      void config.close()
      return
    }

    if (event.key === 'z' || event.key === 'Z') {
      debug?.log('gestures', 'key: Z → toggleZoom')
      config.toggleZoom()
      return
    }

    if (event.key === 'ArrowRight') {
      if (config.isZoomedIn.value) {
        config.setPanzoomImmediate(
          config.panzoomMotion.scale,
          config.clampPan(
            { x: config.panzoomMotion.x - 80, y: config.panzoomMotion.y },
            config.panzoomMotion.scale,
          ),
        )
      } else if (!(config.transitionInProgress?.value ?? false)) {
        config.goToNext()
      }
    }

    if (event.key === 'ArrowLeft') {
      if (config.isZoomedIn.value) {
        config.setPanzoomImmediate(
          config.panzoomMotion.scale,
          config.clampPan(
            { x: config.panzoomMotion.x + 80, y: config.panzoomMotion.y },
            config.panzoomMotion.scale,
          ),
        )
      } else if (!(config.transitionInProgress?.value ?? false)) {
        config.goToPrev()
      }
    }
  }

  return {
    gesturePhase,
    resetGestureState,
    cancelTapTimer,
    onMediaPointerDown,
    onMediaPointerMove,
    onMediaPointerUp,
    onMediaPointerCancel,
    onWheel,
    onKeydown,
  }
}
</file>
<file name="useGhostTransition.ts" path="/packages/vue/src/composables/useGhostTransition.ts">
import { computed, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, DebugLogger, PhotoItem, TransitionModeConfig } from '@nuxt-photo/core'
import { createGhostState, setThumbRef } from './ghost/state'
import { openTransition } from './ghost/openTransition'
import { createCloseTransition } from './ghost/closeTransition'

export function useGhostTransition(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: PhotoItem) => { left: number; top: number; width: number; height: number } | null,
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
) {
  const s = createGhostState(activeIndex, currentPhoto, areaMetrics, getAbsoluteFrameRect, debug, transitionConfig)
  const { close, animateCloseDragTo, handleCloseGesture, handleBackdropClick } = createCloseTransition(s)

  const transitionInProgress = computed(() => s.animating.value || s.ghostVisible.value)

  const chromeStyle = computed<CSSProperties>(() => ({
    opacity: String(s.uiVisible.value ? s.chromeOpacity.value : 0),
    pointerEvents: s.uiVisible.value && s.chromeOpacity.value > 0.05 ? 'auto' : 'none',
  }))

  const backdropStyle = computed<CSSProperties>(() => ({
    opacity: String(s.overlayOpacity.value * (1 - s.closeDragRatio.value)),
    ...(s.disableBackdropTransition.value ? { transition: 'none' } : {}),
  }))

  const lightboxUiStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(0, ${s.closeDragY.value}px, 0) scale(${1 - s.closeDragRatio.value * 0.05})`,
  }))

  return {
    lightboxMounted: s.lightboxMounted,
    animating: s.animating,
    ghostVisible: s.ghostVisible,
    ghostSrc: s.ghostSrc,
    ghostStyle: s.ghostStyle,
    hiddenThumbIndex: s.hiddenThumbIndex,
    overlayOpacity: s.overlayOpacity,
    mediaOpacity: s.mediaOpacity,
    chromeOpacity: s.chromeOpacity,
    uiVisible: s.uiVisible,
    closeDragY: s.closeDragY,
    transitionInProgress,
    chromeStyle,
    closeDragRatio: s.closeDragRatio,
    backdropStyle,
    lightboxUiStyle,

    setThumbRef: (index: number) => setThumbRef(s, index),
    setCloseDragY: (val: number) => { s.closeDragY.value = val },
    open: (index: number, callbacks: Parameters<typeof openTransition>[2]) => openTransition(s, index, callbacks),
    close,
    animateCloseDragTo,
    handleCloseGesture,
    handleBackdropClick,
  }
}
</file>
<file name="useLightbox.ts" path="/packages/vue/src/composables/useLightbox.ts">
import type { MaybeRef } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxContext } from './useLightboxContext'

export function useLightbox(photosInput: MaybeRef<PhotoItem | PhotoItem[]>) {
  const context = useLightboxContext(photosInput)

  return {
    open: context.open,
    close: context.close,
    next: context.next,
    prev: context.prev,
    isOpen: context.isOpen,
    activeIndex: context.activeIndex,
    activePhoto: context.activePhoto,
    count: context.count,
  }
}
</file>
<file name="useLightboxContext.ts" path="/packages/vue/src/composables/useLightboxContext.ts">
import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRef } from 'vue'
import {
  ensureImageLoaded,
  lockBodyScroll,
  nextFrame,
  createDebug,
  createTransitionMode,
  isUsableRect,
  photoId,
  type CarouselConfig,
  type PhotoItem,
  type AreaMetrics,
  type TransitionMode,
  type TransitionModeConfig,
} from '@nuxt-photo/core'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { LightboxDefaultsKey } from '../provide/keys'

export type LightboxTransitionOption = TransitionMode | TransitionModeConfig

export function useLightboxContext(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  transitionOption?: LightboxTransitionOption,
  minZoom?: number,
) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn('[nuxt-photo] useLightboxContext must be called inside a component setup()')
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })
  const count = computed(() => photos.value.length)

  const globalDefaults = inject(LightboxDefaultsKey, undefined)
  const resolvedMinZoom = minZoom ?? globalDefaults?.minZoom

  const debug = createDebug()
  const transitionConfig = createTransitionMode()

  // Apply user-provided transition option
  if (transitionOption) {
    if (typeof transitionOption === 'string') {
      transitionConfig.mode = transitionOption
    } else {
      transitionConfig.mode = transitionOption.mode
      transitionConfig.autoThreshold = transitionOption.autoThreshold
    }
  }

  // Respect prefers-reduced-motion (overrides 'auto' and 'flip', but not explicit 'none')
  if (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && transitionConfig.mode !== 'none'
  ) {
    transitionConfig.mode = 'fade'
  }

  if (typeof window !== 'undefined') {
    window.__NUXT_PHOTO_DEBUG__ = debug.flags
  }

  const carouselConfig: CarouselConfig = {
    style: 'classic',
    parallax: { amount: 0.3, scale: 0.92, opacity: 0.5 },
    fade: { minOpacity: 0 },
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)

  const isZoomedInProxy = ref(false)
  const animatingProxy = ref(false)

  const carousel = useCarousel(
    photos,
    areaMetrics,
    carouselConfig,
    computed(() => isZoomedInProxy.value),
    animatingProxy,
    debug,
  )

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, debug, resolvedMinZoom)

  const ghost = useGhostTransition(
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    debug,
    transitionConfig,
  )

  watch(panzoom.isZoomedIn, (value) => { isZoomedInProxy.value = value }, { immediate: true })
  watch(ghost.animating, (value) => { animatingProxy.value = value }, { immediate: true })

  function syncGeometry() {
    const mediaAreaEl = mediaAreaRef.value
    if (!mediaAreaEl) {
      debug.warn('geometry', 'syncGeometry: mediaAreaRef is null')
      return null
    }

    const rect = mediaAreaEl.getBoundingClientRect()
    if (!isUsableRect(rect)) {
      debug.warn('geometry', 'syncGeometry: rect not usable', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      })
      return null
    }

    areaMetrics.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }

    debug.log('geometry', 'syncGeometry:', areaMetrics.value)
    return areaMetrics.value
  }

  let gestures!: ReturnType<typeof useGestures>

  const transitionCallbacks = {
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
    resetGestureState: () => gestures.resetGestureState(),
    cancelTapTimer: () => gestures.cancelTapTimer(),
  }

  const closeCallbacks = {
    ...transitionCallbacks,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  let skipActiveIndexWatch = false

  // Track whether the keyboard listener is currently attached
  let keydownAttached = false

  function attachKeydown() {
    if (typeof window === 'undefined' || keydownAttached) return
    window.addEventListener('keydown', gestures.onKeydown)
    keydownAttached = true
  }

  function detachKeydown() {
    if (typeof window === 'undefined' || !keydownAttached) return
    window.removeEventListener('keydown', gestures.onKeydown)
    keydownAttached = false
  }

  async function open(photoOrIndex: PhotoItem | number = 0) {
    const index = typeof photoOrIndex === 'number'
      ? photoOrIndex
      : photos.value.findIndex(photo => photoId(photo) === photoId(photoOrIndex as PhotoItem))

    skipActiveIndexWatch = true
    ghost.setCloseDragY(0)
    carousel.goTo(index >= 0 ? index : 0, true)
    attachKeydown()
    await ghost.open(index >= 0 ? index : 0, transitionCallbacks)
    skipActiveIndexWatch = false
  }

  async function close() {
    await ghost.close(closeCallbacks)
    ghost.setCloseDragY(0)
    detachKeydown()
  }

  function next() {
    if (ghost.transitionInProgress.value) return
    carousel.goToNext()
  }

  function prev() {
    if (ghost.transitionInProgress.value) return
    carousel.goToPrev()
  }

  gestures = useGestures({
    lightboxMounted: ghost.lightboxMounted,
    animating: ghost.animating,
    ghostVisible: ghost.ghostVisible,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,
    mediaAreaRef,
    currentPhoto: carousel.currentPhoto,
    areaMetrics,
    uiVisible: ghost.uiVisible,
    panState: panzoom.panState,
    zoomState: panzoom.zoomState,
    setCloseDragY: ghost.setCloseDragY,
    transitionInProgress: ghost.transitionInProgress,

    panzoomMotion: panzoom.panzoomMotion,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    startPanzoomSpring: panzoom.startPanzoomSpring,
    clampPan: panzoom.clampPan,
    clampPanWithResistance: panzoom.clampPanWithResistance,
    applyWheelZoom: panzoom.applyWheelZoom,
    toggleZoom: panzoom.toggleZoom,
    getPanBounds: panzoom.getPanBounds,

    goToNext: carousel.goToNext,
    goToPrev: carousel.goToPrev,
    goTo: carousel.goTo,
    selectedSnap: carousel.selectedSnap,

    handleCloseGesture: ghost.handleCloseGesture,
    close,
  }, debug)

  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  // Watch photos array — only close if the active photo was removed; otherwise maintain position
  watch(photos, (newPhotos, oldPhotos) => {
    if (!newPhotos || !oldPhotos) return

    const newIds = new Set(newPhotos.map(photoId))
    const oldIds = new Set(oldPhotos.map(photoId))

    // No change in IDs
    if (newIds.size === oldIds.size && [...newIds].every(id => oldIds.has(id))) return

    const activePhoto = carousel.currentPhoto.value
    const activeId = activePhoto ? photoId(activePhoto) : null

    if (!activeId || !newIds.has(activeId)) {
      // Active photo was removed or array is empty — close
      if (ghost.lightboxMounted.value) {
        void close()
      }
      carousel.goTo(0, true)
      return
    }

    // Active photo still exists — jump to its new index
    const newIndex = newPhotos.findIndex(p => photoId(p) === activeId)
    if (newIndex !== -1 && newIndex !== carousel.activeIndex.value) {
      carousel.goTo(newIndex, true)
    }
  })

  watch(carousel.activeIndex, async (newIndex) => {
    if (!ghost.lightboxMounted.value || skipActiveIndexWatch) return

    debug.log('slides', `activeIndex changed → ${newIndex}`)

    panzoom.setActiveSlideIndex(newIndex)

    await nextTick()
    await nextFrame()
    syncGeometry()
    panzoom.refreshZoomState(true)
    void ensureImageLoaded(carousel.currentPhoto.value.src)
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize)

      for (const photo of photos.value) {
        void ensureImageLoaded(photo.src)
      }
    }
  })

  onBeforeUnmount(() => {
    gestures.cancelTapTimer()
    detachKeydown()

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }

    if (typeof document !== 'undefined') {
      lockBodyScroll(false)
    }
  })

  function onResize() {
    if (!ghost.lightboxMounted.value) return
    debug.log('geometry', 'window resize')
    syncGeometry()
    panzoom.refreshZoomState(false)
  }

  return {
    photos,
    count,
    activeIndex: carousel.activeIndex,
    activePhoto: carousel.currentPhoto,
    isOpen: computed(() => ghost.lightboxMounted.value),

    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,

    animating: ghost.animating,
    ghostVisible: ghost.ghostVisible,
    ghostSrc: ghost.ghostSrc,
    ghostStyle: ghost.ghostStyle,
    hiddenThumbIndex: ghost.hiddenThumbIndex,
    overlayOpacity: ghost.overlayOpacity,
    mediaOpacity: ghost.mediaOpacity,
    chromeOpacity: ghost.chromeOpacity,
    uiVisible: ghost.uiVisible,
    closeDragY: ghost.closeDragY,
    transitionInProgress: ghost.transitionInProgress,
    chromeStyle: ghost.chromeStyle,
    closeDragRatio: ghost.closeDragRatio,
    backdropStyle: ghost.backdropStyle,
    lightboxUiStyle: ghost.lightboxUiStyle,

    gesturePhase: gestures.gesturePhase,

    mediaAreaRef,
    emblaRef: carousel.emblaRef,

    setThumbRef: ghost.setThumbRef,
    setSlideZoomRef: panzoom.setSlideZoomRef,

    onMediaPointerDown: gestures.onMediaPointerDown,
    onMediaPointerMove: gestures.onMediaPointerMove,
    onMediaPointerUp: gestures.onMediaPointerUp,
    onMediaPointerCancel: gestures.onMediaPointerCancel,
    onWheel: gestures.onWheel,

    open,
    close,
    next,
    prev,
    toggleZoom: panzoom.toggleZoom,
    handleBackdropClick: () => ghost.handleBackdropClick(close),
    getSlideFrameStyle: carousel.getSlideFrameStyle,
    getSlideEffectStyle: carousel.getSlideEffectStyle,
  }
}
</file>
<file name="useLightboxInject.ts" path="/packages/vue/src/composables/useLightboxInject.ts">
import { LightboxContextKey, type LightboxContext } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

/**
 * Inject the lightbox context provided by a `LightboxRoot` ancestor.
 * Throws a descriptive error if no lightbox context is available.
 */
export function useLightboxInject(componentName: string): LightboxContext {
  return requireInjection(LightboxContextKey, componentName, 'an active lightbox context')
}
</file>
<file name="useLightboxProvider.ts" path="/packages/vue/src/composables/useLightboxProvider.ts">
import { provide, type MaybeRef } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxContext, type LightboxTransitionOption } from './useLightboxContext'
import { LightboxContextKey, LightboxSlideRendererKey, type LightboxSlideRenderer } from '../provide/keys'
import { provideLightboxContexts } from '../provide/lightbox'

/**
 * Creates a full lightbox context and provides it to child components.
 * This is the composable for building custom lightbox components — the middle tier
 * between `useLightbox` (for consumers) and raw `useLightboxContext` (full engine).
 *
 * @example
 * ```vue
 * <script setup>
 * const { open, close, isOpen, activePhoto } = useLightboxProvider(photos)
 * </script>
 * <template>
 *   <LightboxRoot>
 *     <LightboxOverlay />
 *     <LightboxViewport v-slot="{ photos, viewportRef }">
 *       <!-- custom slide rendering -->
 *     </LightboxViewport>
 *   </LightboxRoot>
 * </template>
 * ```
 */
export function useLightboxProvider(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
  },
) {
  const ctx = useLightboxContext(
    photosInput,
    options?.transition,
    options?.minZoom,
  )

  // Provide the unified context + deprecated individual keys for backward compat
  provideLightboxContexts(ctx, {
    resolveSlide: options?.resolveSlide,
  })

  return {
    open: ctx.open,
    close: ctx.close,
    next: ctx.next,
    prev: ctx.prev,
    isOpen: ctx.isOpen,
    activeIndex: ctx.activeIndex,
    activePhoto: ctx.activePhoto,
    photos: ctx.photos,
    count: ctx.count,
    setThumbRef: ctx.setThumbRef,
    hiddenThumbIndex: ctx.hiddenThumbIndex,
  }
}
</file>
<file name="usePanzoom.ts" path="/packages/vue/src/composables/usePanzoom.ts">
import { computed, type ComputedRef, type Ref, type ComponentPublicInstance, ref } from 'vue'
import {
  computeZoomLevels as coreComputeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance as coreClampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
  computeFittedFrame,
  type AreaMetrics,
  type PanState,
  type PanzoomMotion,
  type PhotoItem,
  type ZoomState,
  type DebugLogger,
} from '@nuxt-photo/core'

export function usePanzoom(
  currentPhoto: ComputedRef<PhotoItem>,
  areaMetrics: Ref<AreaMetrics | null>,
  debug?: DebugLogger,
  minZoom?: number,
) {
  const zoomState = ref<ZoomState>({ fit: 1, secondary: 1, max: 1, current: 1 })
  const panState = ref<PanState>({ x: 0, y: 0 })

  let activeSlideIndex = 0
  const slideZoomRefs = new Map<number, HTMLElement>()

  const panzoomMotion: PanzoomMotion = {
    x: 0, y: 0, scale: 1,
    targetX: 0, targetY: 0, targetScale: 1,
    velocityX: 0, velocityY: 0, velocityScale: 0,
    tension: 170, friction: 17, rafId: 0,
  }

  const isZoomedIn = computed(() => zoomState.value.current > zoomState.value.fit + 0.01)
  const zoomAllowed = computed(() => zoomState.value.max > zoomState.value.fit + 0.05)

  function computeZoomLevels(photo: PhotoItem): ZoomState {
    const area = areaMetrics.value
    if (!area) return { fit: 1, secondary: 1, max: 1, current: 1 }
    return coreComputeZoomLevels(
      photo.width,
      photo.height,
      area.width,
      area.height,
      photo,
      minZoom != null ? { minZoom } : undefined,
    )
  }

  function getPanBounds(photo: PhotoItem, zoom: number) {
    const area = areaMetrics.value
    if (!area) return { x: 0, y: 0 }
    return computePanBounds(photo.width, photo.height, area.width, area.height, zoom)
  }

  function clampPan(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
    const bounds = getPanBounds(photo, zoom)
    return clampPanToBounds(pan, bounds)
  }

  function clampPanWithResistance(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
    const bounds = getPanBounds(photo, zoom)
    return coreClampPanWithResistance(pan, bounds)
  }

  function getPointFromClient(clientX: number, clientY: number) {
    const area = areaMetrics.value
    if (!area) return { x: 0, y: 0 }
    return clientToAreaPoint(clientX, clientY, area.left, area.top, area.width, area.height)
  }

  function getTargetPanForZoom(targetZoom: number, clientPoint?: { x: number; y: number }) {
    if (targetZoom <= zoomState.value.fit + 0.01) {
      return { x: 0, y: 0 }
    }

    const point = clientPoint ? getPointFromClient(clientPoint.x, clientPoint.y) : { x: 0, y: 0 }
    const bounds = getPanBounds(currentPhoto.value, targetZoom)

    return computeTargetPanForZoom(
      targetZoom,
      panzoomMotion.scale,
      { x: panzoomMotion.x, y: panzoomMotion.y },
      point,
      zoomState.value.fit,
      bounds,
    )
  }

  function applyActivePanzoomTransform() {
    const activeZoomElement = slideZoomRefs.get(activeSlideIndex)
    if (!activeZoomElement) return
    activeZoomElement.style.transform = `translate3d(${panzoomMotion.x}px, ${panzoomMotion.y}px, 0) scale(${panzoomMotion.scale})`
  }

  function stopPanzoomSpring() {
    if (!panzoomMotion.rafId) return
    cancelAnimationFrame(panzoomMotion.rafId)
    panzoomMotion.rafId = 0
  }

  function syncPanzoomRefs(scale = panzoomMotion.scale, pan: PanState = { x: panzoomMotion.x, y: panzoomMotion.y }) {
    zoomState.value = { ...zoomState.value, current: scale }
    panState.value = { ...pan }
  }

  function setPanzoomImmediate(scale: number, pan: PanState, syncRefs = true) {
    stopPanzoomSpring()

    panzoomMotion.scale = scale
    panzoomMotion.targetScale = scale
    panzoomMotion.x = pan.x
    panzoomMotion.y = pan.y
    panzoomMotion.targetX = pan.x
    panzoomMotion.targetY = pan.y
    panzoomMotion.velocityScale = 0
    panzoomMotion.velocityX = 0
    panzoomMotion.velocityY = 0

    applyActivePanzoomTransform()

    if (syncRefs) {
      syncPanzoomRefs(scale, pan)
    }
  }

  function startPanzoomSpring(
    targetScale: number,
    targetPan: PanState,
    options?: { tension?: number; friction?: number },
  ) {
    debug?.log('zoom', `spring start: scale=${panzoomMotion.scale.toFixed(3)}→${targetScale.toFixed(3)} pan=(${targetPan.x.toFixed(1)},${targetPan.y.toFixed(1)})`)
    panzoomMotion.targetScale = targetScale
    panzoomMotion.targetX = targetPan.x
    panzoomMotion.targetY = targetPan.y
    panzoomMotion.tension = options?.tension ?? 170
    panzoomMotion.friction = options?.friction ?? 17

    syncPanzoomRefs(targetScale, targetPan)

    if (panzoomMotion.rafId) return

    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(0.064, (now - lastTime) / 1000)
      lastTime = now

      const scaleDistance = panzoomMotion.targetScale - panzoomMotion.scale
      const xDistance = panzoomMotion.targetX - panzoomMotion.x
      const yDistance = panzoomMotion.targetY - panzoomMotion.y

      const spring = panzoomMotion.tension
      const damping = panzoomMotion.friction

      panzoomMotion.velocityScale += (scaleDistance * spring - panzoomMotion.velocityScale * damping) * dt
      panzoomMotion.velocityX += (xDistance * spring - panzoomMotion.velocityX * damping) * dt
      panzoomMotion.velocityY += (yDistance * spring - panzoomMotion.velocityY * damping) * dt

      panzoomMotion.scale += panzoomMotion.velocityScale * dt
      panzoomMotion.x += panzoomMotion.velocityX * dt
      panzoomMotion.y += panzoomMotion.velocityY * dt

      applyActivePanzoomTransform()

      const done = Math.abs(scaleDistance) < 0.001
        && Math.abs(xDistance) < 0.35
        && Math.abs(yDistance) < 0.35
        && Math.abs(panzoomMotion.velocityScale) < 0.001
        && Math.abs(panzoomMotion.velocityX) < 0.08
        && Math.abs(panzoomMotion.velocityY) < 0.08

      if (done) {
        panzoomMotion.scale = panzoomMotion.targetScale
        panzoomMotion.x = panzoomMotion.targetX
        panzoomMotion.y = panzoomMotion.targetY
        applyActivePanzoomTransform()
        panzoomMotion.rafId = 0
        syncPanzoomRefs()
        debug?.log('zoom', `spring settled: scale=${panzoomMotion.scale.toFixed(3)} pan=(${panzoomMotion.x.toFixed(1)},${panzoomMotion.y.toFixed(1)})`)
        return
      }

      panzoomMotion.rafId = requestAnimationFrame(step)
    }

    panzoomMotion.rafId = requestAnimationFrame(step)
  }

  function refreshZoomState(reset = false) {
    const next = computeZoomLevels(currentPhoto.value)
    const current = reset
      ? next.fit
      : Math.min(next.max, Math.max(next.fit, panzoomMotion.targetScale))
    const nextPan = current <= next.fit + 0.01
      ? { x: 0, y: 0 }
      : clampPan(
          { x: panzoomMotion.targetX, y: panzoomMotion.targetY },
          current,
          currentPhoto.value,
        )

    debug?.log('zoom', `refreshZoomState(reset=${reset}): fit=${next.fit.toFixed(3)} secondary=${next.secondary.toFixed(3)} max=${next.max.toFixed(3)} current=${current.toFixed(3)}`)

    zoomState.value = { fit: next.fit, secondary: next.secondary, max: next.max, current }
    panState.value = nextPan
    setPanzoomImmediate(current, nextPan, false)
  }

  function toggleZoom(clientPoint?: { x: number; y: number }) {
    if (!zoomAllowed.value) return

    const targetZoom = isZoomedIn.value ? zoomState.value.fit : zoomState.value.secondary
    debug?.log('zoom', `toggleZoom: ${isZoomedIn.value ? 'zoom out' : 'zoom in'} → ${targetZoom.toFixed(3)}`)
    const targetPan = getTargetPanForZoom(targetZoom, clientPoint)
    startPanzoomSpring(targetZoom, targetPan, { tension: 170, friction: 17 })
  }

  function applyWheelZoom(event: WheelEvent) {
    if (!zoomAllowed.value) return

    const direction = Math.max(Math.min(-event.deltaY, 1), -1)
    if (direction === 0) return
    const zoomFactor = direction > 0 ? 1.5 : 0.5

    const targetZoom = Math.min(
      zoomState.value.max,
      Math.max(zoomState.value.fit, panzoomMotion.scale * zoomFactor),
    )
    if (targetZoom === panzoomMotion.scale) return

    const targetPan = getTargetPanForZoom(targetZoom, {
      x: event.clientX,
      y: event.clientY,
    })

    startPanzoomSpring(targetZoom, targetPan, { tension: 170, friction: 17 })
  }

  function setActiveSlideIndex(index: number) {
    activeSlideIndex = index
  }

  function setSlideZoomRef(slideIndex: number) {
    return (value: Element | ComponentPublicInstance | null) => {
      const element = value instanceof HTMLElement
        ? value
        : value && '$el' in value && value.$el instanceof HTMLElement
          ? value.$el
          : null

      if (element instanceof HTMLElement) {
        slideZoomRefs.set(slideIndex, element)
        if (slideIndex === activeSlideIndex) {
          applyActivePanzoomTransform()
        } else {
          element.style.transform = 'translate3d(0px, 0px, 0) scale(1)'
        }
        return
      }

      slideZoomRefs.delete(slideIndex)
    }
  }

  return {
    zoomState,
    panState,
    isZoomedIn,
    zoomAllowed,
    panzoomMotion,

    setActiveSlideIndex,
    setSlideZoomRef,
    computeZoomLevels,
    getPanBounds,
    clampPan,
    clampPanWithResistance,
    getPointFromClient,
    getTargetPanForZoom,
    applyActivePanzoomTransform,
    stopPanzoomSpring,
    setPanzoomImmediate,
    startPanzoomSpring,
    refreshZoomState,
    toggleZoom,
    applyWheelZoom,
  }
}
</file>
<file name="requireInjection.ts" path="/packages/vue/src/internal/requireInjection.ts">
import { inject, type InjectionKey } from 'vue'

export function requireInjection<T>(
  key: InjectionKey<T>,
  componentName: string,
  providerDescription: string,
): T {
  const context = inject(key, null)
  if (context == null) {
    const error = new Error(`[nuxt-photo] \`${componentName}\` requires ${providerDescription}.`)

    return new Proxy({}, {
      get() {
        throw error
      },
      set() {
        throw error
      },
    }) as T
  }

  return context
}
</file>
<file name="index.ts" path="/packages/vue/src/primitives/index.ts">
export { default as LightboxRoot } from './LightboxRoot.vue'
export { default as LightboxOverlay } from './LightboxOverlay.vue'
export { default as LightboxViewport } from './LightboxViewport.vue'
export { default as LightboxSlide } from './LightboxSlide.vue'
export { default as LightboxControls } from './LightboxControls.vue'
export { default as LightboxCaption } from './LightboxCaption.vue'
export { default as LightboxPortal } from './LightboxPortal.vue'
export { default as PhotoTrigger } from './PhotoTrigger.vue'
export { default as PhotoImage } from './PhotoImage.vue'
</file>
<file name="LightboxCaption.vue" path="/packages/vue/src/primitives/LightboxCaption.vue">
<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.activePhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'
import type { LightboxCaptionSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxCaptionSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxCaption')
</script>
</file>
<file name="LightboxControls.vue" path="/packages/vue/src/primitives/LightboxControls.vue">
<template>
  <div :style="ctx.chromeStyle.value" v-bind="$attrs">
    <div
      data-np-sr-only
      aria-live="polite"
      aria-atomic="true"
    >Photo {{ ctx.activeIndex.value + 1 }} of {{ ctx.count.value }}</div>
    <slot
      :active-index="ctx.activeIndex.value"
      :active-photo="ctx.activePhoto.value"
      :photos="ctx.photos.value"
      :count="ctx.count.value"
      :is-zoomed-in="ctx.isZoomedIn.value"
      :zoom-allowed="ctx.zoomAllowed.value"
      :controls-disabled="ctx.transitionInProgress.value"
      :next="ctx.next"
      :prev="ctx.prev"
      :close="ctx.close"
      :toggle-zoom="ctx.toggleZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'
import type { LightboxControlsSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxControlsSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxControls')
</script>
</file>
<file name="LightboxOverlay.vue" path="/packages/vue/src/primitives/LightboxOverlay.vue">
<template>
  <div :style="ctx.backdropStyle.value" v-bind="$attrs" @click="ctx.handleBackdropClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxOverlay')
</script>
</file>
<file name="LightboxPortal.vue" path="/packages/vue/src/primitives/LightboxPortal.vue">
<template>
  <img
    v-if="ctx.ghostVisible.value"
    :src="ctx.ghostSrc.value"
    alt=""
    aria-hidden="true"
    :style="ctx.ghostStyle.value"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxPortal')
</script>
</file>
<file name="LightboxRoot.vue" path="/packages/vue/src/primitives/LightboxRoot.vue">
<template>
  <Teleport to="body">
    <div v-if="ctx.isOpen.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxRoot')
</script>
</file>
<file name="LightboxSlide.vue" path="/packages/vue/src/primitives/LightboxSlide.vue">
<template>
  <div v-bind="$attrs">
    <div data-np-slide-effect :class="effectClass" :style="ctx.getSlideEffectStyle(index)">
      <div data-np-slide-frame :class="frameClass" :style="frameStyle">
        <div data-np-slide-zoom :class="zoomClass" :ref="ctx.setSlideZoomRef(index)">
          <slot v-if="$slots.default" :photo="photo" :index="index" :width="frameWidth" :height="frameHeight" />
          <CustomSlideRenderer v-else-if="slideRenderer" :renderer="slideRenderer" :photo="photo" :index="index" />
          <PhotoImage
            v-else
            :photo="photo"
            context="slide"
            :loading="isActive ? 'eager' : 'lazy'"
            data-np-slide-img
            :class="imgClass"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, inject, type PropType, type VNodeChild } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { LightboxSlideRendererKey } from '../provide/keys'
import type { LightboxSlideRenderer } from '../provide/keys'
import type { LightboxSlideSlotProps } from '../types/slots'
import { useLightboxInject } from '../composables/useLightboxInject'
import PhotoImage from './PhotoImage.vue'

defineSlots<{ default?: (props: LightboxSlideSlotProps) => unknown }>()

const props = defineProps<{
  photo: PhotoItem
  index: number
  effectClass?: string
  frameClass?: string
  zoomClass?: string
  imgClass?: string
}>()

const ctx = useLightboxInject('LightboxSlide')
const resolveSlide = inject(LightboxSlideRendererKey, () => null)

const slideRenderer = computed(() => resolveSlide(props.photo))
const isActive = computed(() => ctx.activeIndex.value === props.index)

const frameStyle = computed(() => ctx.getSlideFrameStyle(props.photo))

// Extract pixel dimensions from frame style for slot props
const frameWidth = computed(() => Number.parseInt(frameStyle.value.width as string) || 0)
const frameHeight = computed(() => Number.parseInt(frameStyle.value.height as string) || 0)

// Stable wrapper component defined ONCE — never recreated on each render
const CustomSlideRenderer = defineComponent({
  name: 'NuxtPhotoCustomSlide',
  props: {
    renderer: { type: Function as PropType<LightboxSlideRenderer>, required: true },
    photo: { type: Object as PropType<PhotoItem>, required: true },
    index: { type: Number, required: true },
  },
  setup(p) {
    return () => p.renderer({ photo: p.photo, index: p.index }) as VNodeChild
  },
})
</script>
</file>
<file name="LightboxViewport.vue" path="/packages/vue/src/primitives/LightboxViewport.vue">
<template>
  <div
    :ref="(el) => { ctx.mediaAreaRef.value = el as HTMLElement | null }"
    v-bind="$attrs"
    :data-zoomed="ctx.isZoomedIn.value || undefined"
    :data-gesture="ctx.gesturePhase.value !== 'idle' ? ctx.gesturePhase.value : undefined"
    @pointerdown.capture="ctx.onMediaPointerDown"
    @pointermove.capture="ctx.onMediaPointerMove"
    @pointerup.capture="ctx.onMediaPointerUp"
    @pointercancel.capture="ctx.onMediaPointerCancel"
    @wheel="ctx.onWheel"
  >
    <slot
      :photos="ctx.photos.value"
      :viewport-ref="ctx.emblaRef"
      :media-opacity="ctx.mediaOpacity.value"
    />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'
import type { LightboxViewportSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxViewportSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxViewport')
</script>
</file>
<file name="PhotoImage.vue" path="/packages/vue/src/primitives/PhotoImage.vue">
<template>
  <img
    :src="resolved.src"
    :srcset="resolved.srcset"
    :sizes="props.sizes ?? resolved.sizes"
    :width="resolved.width"
    :height="resolved.height"
    :alt="photo.alt || ''"
    :loading="loading"
    draggable="false"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { createNativeImageAdapter, type PhotoItem, type ImageAdapter, type ImageContext } from '@nuxt-photo/core'
import { ImageAdapterKey } from '../provide/keys'

const props = withDefaults(defineProps<{
  photo: PhotoItem
  context?: ImageContext
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
  /** Override the adapter-computed sizes attribute with a layout-computed value. */
  sizes?: string
}>(), {
  context: 'thumb',
  loading: 'lazy',
})

const injectedAdapter = inject(ImageAdapterKey, null)

const resolveImage = computed((): ImageAdapter =>
  props.adapter ?? injectedAdapter ?? createNativeImageAdapter()
)

const resolved = computed(() => resolveImage.value(props.photo, props.context))
</script>
</file>
<file name="PhotoTrigger.vue" path="/packages/vue/src/primitives/PhotoTrigger.vue">
<template>
  <div
    :ref="ctx.setThumbRef(index)"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @click="ctx.open(index)"
    @keydown.enter="ctx.open(index)"
    @keydown.space.prevent="ctx.open(index)"
  >
    <slot :photo="photo" :index="index" :hidden="ctx.hiddenThumbIndex.value === index" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxInject } from '../composables/useLightboxInject'

const props = defineProps<{
  photo: PhotoItem
  index: number
}>()

const ctx = useLightboxInject('PhotoTrigger')

const ariaLabel = computed(() => props.photo.alt || `View photo ${props.index + 1}`)
</script>
</file>
<file name="keys.ts" path="/packages/vue/src/provide/keys.ts">
import type { Component, ComponentPublicInstance, ComputedRef, CSSProperties, InjectionKey, Ref } from 'vue'
import type { GestureMode, ImageAdapter, PanState, PhotoItem, ZoomState } from '@nuxt-photo/core'
import type { LightboxCaptionSlotProps, LightboxControlsSlotProps, LightboxSlideSlotProps } from '../types/slots'

/** Consumer API — what app code and recipe components need. */
export interface LightboxConsumerAPI {
  photos: ComputedRef<PhotoItem[]>
  count: ComputedRef<number>
  activeIndex: Ref<number>
  activePhoto: ComputedRef<PhotoItem>
  isOpen: ComputedRef<boolean>
  open: (photoOrIndex?: PhotoItem | number) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  toggleZoom: () => void
}

/** Render state — what primitive components read for styling and visibility. */
export interface LightboxRenderState {
  zoomState: Ref<ZoomState>
  panState: Ref<PanState>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  ghostSrc: Ref<string>
  ghostStyle: Ref<CSSProperties>
  hiddenThumbIndex: Ref<number | null>
  overlayOpacity: Ref<number>
  mediaOpacity: Ref<number>
  chromeOpacity: Ref<number>
  uiVisible: Ref<boolean>
  closeDragY: Ref<number>
  transitionInProgress: ComputedRef<boolean>
  chromeStyle: ComputedRef<CSSProperties>
  closeDragRatio: ComputedRef<number>
  backdropStyle: ComputedRef<CSSProperties>
  lightboxUiStyle: ComputedRef<CSSProperties>
  gesturePhase: Ref<GestureMode>
  getSlideFrameStyle: (photo: PhotoItem) => CSSProperties
  getSlideEffectStyle: (index: number) => CSSProperties
}

/** DOM bindings — what primitives need to wire up event handlers and refs. */
export interface LightboxDOMBindings {
  mediaAreaRef: Ref<HTMLElement | null>
  emblaRef: Ref<HTMLElement | null>
  setThumbRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideZoomRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => void
}

/** Full lightbox context — the intersection of all role-specific interfaces. */
export type LightboxContext = LightboxConsumerAPI & LightboxRenderState & LightboxDOMBindings

export type LightboxSlideRenderer = (props: { photo: PhotoItem; index: number }) => unknown

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('nuxt-photo:lightbox')
export const LightboxSlideRendererKey: InjectionKey<(photo: PhotoItem) => LightboxSlideRenderer | null> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: 'auto' | 'explicit'
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null): void
  unregister(id: symbol): void
  open(photoOrIndex: PhotoItem | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol('nuxt-photo:photo-group')

/**
 * Provide a custom lightbox component globally so Photo/PhotoGroup/PhotoAlbum
 * use it by default without requiring per-instance :lightbox props.
 *
 * Usage in app.vue:
 *   import MyLightbox from '~/components/Lightbox.vue'
 *   provide(LightboxComponentKey, MyLightbox)
 */
export const LightboxComponentKey: InjectionKey<Component> = Symbol('nuxt-photo:lightbox-component')

/** Slot overrides injected by recipe components for customizing InternalLightbox. */
export interface LightboxSlotOverrides {
  toolbar?: (props: LightboxControlsSlotProps) => unknown
  caption?: (props: LightboxCaptionSlotProps) => unknown
  slide?: (props: LightboxSlideSlotProps) => unknown
}
export const LightboxSlotsKey: InjectionKey<Ref<LightboxSlotOverrides>> = Symbol('nuxt-photo:lightbox-slots')

/** Global defaults for lightbox behaviour, typically provided once at app level. */
export interface LightboxDefaults {
  minZoom?: number
}
export const LightboxDefaultsKey: InjectionKey<LightboxDefaults> = Symbol('nuxt-photo:lightbox-defaults')
</file>
<file name="lightbox.ts" path="/packages/vue/src/provide/lightbox.ts">
import { provide } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import {
  LightboxContextKey,
  type LightboxContext,
  LightboxSlideRendererKey,
  type LightboxSlideRenderer,
} from './keys'

export function provideLightboxContexts(
  ctx: LightboxContext,
  options?: { resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null },
) {
  provide(LightboxContextKey, ctx)
  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
}
</file>
<file name="index.ts" path="/packages/vue/src/types/index.ts">
export type {
  LightboxControlsSlotProps,
  LightboxCaptionSlotProps,
  LightboxSlideSlotProps,
  LightboxViewportSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
} from './slots'
</file>
<file name="slots.ts" path="/packages/vue/src/types/slots.ts">
import type { PhotoItem } from '@nuxt-photo/core'
import type { Ref } from 'vue'

// ─── Lightbox primitive slot props ─────────────────────────────────────────

export interface LightboxControlsSlotProps {
  activeIndex: number
  activePhoto: PhotoItem
  photos: PhotoItem[]
  count: number
  isZoomedIn: boolean
  zoomAllowed: boolean
  controlsDisabled: boolean
  next: () => void
  prev: () => void
  close: () => Promise<void>
  toggleZoom: () => void
}

export interface LightboxCaptionSlotProps {
  photo: PhotoItem | null
  activeIndex: number
}

export interface LightboxSlideSlotProps {
  photo: PhotoItem
  index: number
  width: number
  height: number
}

export interface LightboxViewportSlotProps {
  photos: PhotoItem[]
  viewportRef: Ref<HTMLElement | null>
  mediaOpacity: number
}

// ─── PhotoCarousel slot props ──────────────────────────────────────────────

export interface CarouselSlideSlotProps {
  photo: PhotoItem
  index: number
  selected: boolean
  open: () => void
}

export interface CarouselThumbSlotProps {
  photo: PhotoItem
  index: number
  selected: boolean
  goTo: (i: number) => void
}

export interface CarouselCaptionSlotProps {
  photo: PhotoItem
  index: number
  count: number
}

export interface CarouselControlsSlotProps {
  goToPrev: () => void
  goToNext: () => void
  canGoToPrev: boolean
  canGoToNext: boolean
  selectedIndex: number
  snapCount: number
  goTo: (i: number) => void
}

export interface CarouselDotsSlotProps {
  snaps: number[]
  selectedIndex: number
  goTo: (i: number) => void
}
</file>
<file name="extend.ts" path="/packages/vue/src/extend.ts">
/**
 * Extension API for building custom lightbox implementations.
 *
 * Import from '@nuxt-photo/vue/extend' when you need:
 * - Full engine access via `useLightboxContext`
 * - Injection keys for custom provide/inject wiring
 * - PhotoGroup context for custom collection components
 *
 * For most use cases, prefer the public API:
 * - `useLightbox` — consuming a lightbox (open/close/nav)
 * - `useLightboxProvider` — building a custom lightbox component
 */

// Full engine composable
export { useLightboxContext, type LightboxTransitionOption } from './composables/useLightboxContext'

// Typed inject helper — use inside primitive components instead of raw inject()
export { useLightboxInject } from './composables/useLightboxInject'

// Provider function (for manual context wiring)
export { provideLightboxContexts } from './provide/lightbox'

// Injection keys and context types
export {
  type LightboxContext,
  type LightboxConsumerAPI,
  type LightboxRenderState,
  type LightboxDOMBindings,
  LightboxContextKey,
  type LightboxSlideRenderer,
  LightboxSlideRendererKey,
  ImageAdapterKey,
  PhotoGroupContextKey,
  type PhotoGroupContext,
  LightboxComponentKey,
  LightboxDefaultsKey,
  type LightboxDefaults,
  LightboxSlotsKey,
  type LightboxSlotOverrides,
} from './provide/keys'

// Slot prop types
export * from './types'
</file>
<file name="globals.d.ts" path="/packages/vue/src/globals.d.ts">
import type { DebugFlags } from '@nuxt-photo/core'

declare global {
  interface Window {
    __NUXT_PHOTO_DEBUG__?: DebugFlags
  }

  interface ImportMeta {
    env: {
      DEV?: boolean
      [key: string]: unknown
    }
  }
}

export {}
</file>
<file name="index.ts" path="/packages/vue/src/index.ts">
// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'
export * from './types'
export { LightboxComponentKey, LightboxContextKey, LightboxDefaultsKey } from './provide/keys'
export type { LightboxDefaults } from './provide/keys'

// Re-export core utilities for convenience
export { responsive, resolveResponsiveParameter } from '@nuxt-photo/core'
export type {
  PhotoItem,
  SlideItem,
  AreaMetrics,
  RectLike,
  PanState,
  ZoomState,
  GestureMode,
  PanzoomMotion,
  CarouselStyle,
  CarouselConfig,
  ViewerState,
  TransitionMode,
  ImageAdapter,
  PhotoAdapter,
  ImageSource,
  LayoutInput,
  LayoutEntry,
  LayoutGroup,
  ResponsiveParameter,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
} from '@nuxt-photo/core'
</file>
<file name="ghostState.test.ts" path="/packages/vue/test/ghostState.test.ts">
// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { createGhostState, resetOpenState, resetCloseState, setThumbRef } from '../src/composables/ghost/state'
import { openTransition } from '../src/composables/ghost/openTransition'
import { createCloseTransition } from '../src/composables/ghost/closeTransition'
import type { CloseCallbacks, GhostState, TransitionCallbacks } from '../src/composables/ghost/types'
import { createPhotoSet } from '@test-fixtures/photos'

function makeGhostState(
  getAbsoluteFrameRect: GhostState['getAbsoluteFrameRect'] = () => null,
): GhostState {
  const photos = createPhotoSet()
  return createGhostState(
    ref(0),
    computed(() => photos[0]!),
    ref({ left: 0, top: 0, width: 1200, height: 800 }),
    getAbsoluteFrameRect,
  )
}

function makeTransitionCallbacks(): TransitionCallbacks {
  return {
    syncGeometry: () => {},
    refreshZoomState: () => {},
    resetGestureState: () => {},
    cancelTapTimer: () => {},
  }
}

function makeCloseCallbacks(): CloseCallbacks {
  return {
    ...makeTransitionCallbacks(),
    setPanzoomImmediate: () => {},
    isZoomedIn: computed(() => false),
  }
}

describe('resetOpenState', () => {
  it('resets all properties to the "lightbox is open" state', () => {
    const state = makeGhostState()

    // Simulate a partially-completed open transition
    state.ghostVisible.value = true
    state.ghostSrc.value = '/some-image.jpg'
    state.hiddenThumbIndex.value = 3
    state.overlayOpacity.value = 0.5
    state.mediaOpacity.value = 0.5
    state.chromeOpacity.value = 0
    state.animating.value = true
    state.closeDragY.value = 42
    state.disableBackdropTransition.value = true

    resetOpenState(state)

    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(1)
    expect(state.chromeOpacity.value).toBe(1)
    expect(state.animating.value).toBe(false)
    expect(state.closeDragY.value).toBe(0)
    expect(state.disableBackdropTransition.value).toBe(false)
  })

  it('does not reset lightboxMounted (lightbox should stay open)', () => {
    const state = makeGhostState()
    state.lightboxMounted.value = true

    resetOpenState(state)

    expect(state.lightboxMounted.value).toBe(true)
  })
})

describe('resetCloseState', () => {
  it('resets all properties to the "lightbox is closed" state', () => {
    const state = makeGhostState()
    let guardCleared = false

    // Simulate a fully-open lightbox
    state.lightboxMounted.value = true
    state.ghostVisible.value = true
    state.ghostSrc.value = '/some-image.jpg'
    state.hiddenThumbIndex.value = 2
    state.overlayOpacity.value = 1
    state.mediaOpacity.value = 1
    state.chromeOpacity.value = 1
    state.animating.value = true
    state.closeDragY.value = 100
    state.disableBackdropTransition.value = true

    resetCloseState(state, () => { guardCleared = true })

    expect(guardCleared).toBe(true)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.closeDragY.value).toBe(0)
    expect(state.disableBackdropTransition.value).toBe(false)
    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
    expect(state.chromeOpacity.value).toBe(0)
    expect(state.animating.value).toBe(false)
    expect(state.lightboxMounted.value).toBe(false)
  })
})

describe('setThumbRef', () => {
  it('stores an HTMLElement in thumbRefs', () => {
    const state = makeGhostState()
    const el = document.createElement('div')

    setThumbRef(state, 0)(el)

    expect(state.thumbRefs.get(0)).toBe(el)
  })

  it('unwraps $el from a ComponentPublicInstance', () => {
    const state = makeGhostState()
    const el = document.createElement('img')
    const component = { $el: el } as any

    setThumbRef(state, 1)(component)

    expect(state.thumbRefs.get(1)).toBe(el)
  })

  it('deletes the entry when passed null', () => {
    const state = makeGhostState()
    const el = document.createElement('div')

    setThumbRef(state, 2)(el)
    expect(state.thumbRefs.has(2)).toBe(true)

    setThumbRef(state, 2)(null)
    expect(state.thumbRefs.has(2)).toBe(false)
  })

  it('ignores non-HTMLElement values without crashing', () => {
    const state = makeGhostState()
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    setThumbRef(state, 3)(svgEl)

    expect(state.thumbRefs.has(3)).toBe(false)
  })
})

describe('error propagation', () => {
  it('openTransition rethrows errors from getAbsoluteFrameRect and resets state', async () => {
    const boom = new Error('geometry-failure')
    const state = makeGhostState(() => { throw boom })

    await expect(openTransition(state, 0, makeTransitionCallbacks())).rejects.toBe(boom)

    expect(state.animating.value).toBe(false)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(1)
    expect(state.mediaOpacity.value).toBe(1)
  })

  it('closeTransition rethrows errors from getAbsoluteFrameRect and resets state', async () => {
    const boom = new Error('geometry-failure')
    const state = makeGhostState(() => { throw boom })
    state.lightboxMounted.value = true

    const { close } = createCloseTransition(state)

    await expect(close(makeCloseCallbacks())).rejects.toBe(boom)

    expect(state.animating.value).toBe(false)
    expect(state.lightboxMounted.value).toBe(false)
    expect(state.ghostVisible.value).toBe(false)
    expect(state.ghostSrc.value).toBe('')
    expect(state.hiddenThumbIndex.value).toBeNull()
    expect(state.overlayOpacity.value).toBe(0)
    expect(state.mediaOpacity.value).toBe(0)
  })
})
</file>
<file name="primitiveGuards.test.ts" path="/packages/vue/test/primitiveGuards.test.ts">
// @vitest-environment jsdom

import { createApp, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LightboxRoot, PhotoTrigger } from '@nuxt-photo/vue'
import { makePhoto } from '@test-fixtures/photos'

function mountExpectingError(component: any, props?: Record<string, unknown>) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    render: () => h(component, props ?? {}),
  })

  let captured: unknown = null
  app.config.errorHandler = (error) => {
    captured ??= error
  }

  app.mount(container)
  app.unmount()
  container.remove()

  if (captured instanceof Error) {
    throw captured
  }

  if (captured) {
    throw new Error(String(captured))
  }
}

describe('primitive injection guards', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('throws an actionable error when LightboxRoot is used without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => mountExpectingError(LightboxRoot)).toThrow(
      /\[nuxt-photo\] `LightboxRoot` requires an active lightbox context/,
    )
  })

  it('throws an actionable error when PhotoTrigger is used without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => mountExpectingError(PhotoTrigger, {
      photo: makePhoto({ id: 'guarded-trigger' }),
      index: 0,
    })).toThrow(
      /\[nuxt-photo\] `PhotoTrigger` requires an active lightbox context/,
    )
  })
})
</file>
<file name="publicApi.test.ts" path="/packages/vue/test/publicApi.test.ts">
import { describe, expect, it } from 'vitest'
import * as api from '@nuxt-photo/vue'
import * as extendApi from '@nuxt-photo/vue/extend'

describe('@nuxt-photo/vue public API', () => {
  it('exports the intended lightbox controller and primitives', () => {
    expect(api).toHaveProperty('useLightbox')
    expect(api).toHaveProperty('LightboxRoot')
    expect(api).toHaveProperty('LightboxSlide')
    expect(api).toHaveProperty('PhotoImage')
  })

  it('exports AlbumLayout types', () => {
    // Type re-exports are erased at runtime, but the module should not throw on import
    // and should include the responsive helper
    expect(api).toHaveProperty('responsive')
    expect(api).toHaveProperty('resolveResponsiveParameter')
  })

  it('does not expose internal lightbox engine symbols from the root entrypoint', () => {
    expect(api).not.toHaveProperty('useLightboxContext')
    expect(api).not.toHaveProperty('useLightboxInject')
    expect(api).not.toHaveProperty('provideLightboxContexts')
    expect(api).not.toHaveProperty('LightboxControllerKey')
    expect(api).not.toHaveProperty('PhotoGroupContextKey')
    expect(api).not.toHaveProperty('ImageAdapterKey')
    expect(api).not.toHaveProperty('useCarousel')
    expect(api).not.toHaveProperty('usePanzoom')
    expect(api).not.toHaveProperty('useGestures')
    expect(api).not.toHaveProperty('useGhostTransition')
    expect(api).not.toHaveProperty('createTransitionMode')
    expect(api).not.toHaveProperty('createDebug')
  })
})

describe('@nuxt-photo/vue/extend API', () => {
  it('exports the extension composables and keys', () => {
    expect(extendApi).toHaveProperty('useLightboxContext')
    expect(extendApi).toHaveProperty('useLightboxInject')
    expect(extendApi).toHaveProperty('provideLightboxContexts')
    expect(extendApi).toHaveProperty('LightboxContextKey')
    expect(extendApi).toHaveProperty('LightboxSlideRendererKey')
    expect(extendApi).toHaveProperty('ImageAdapterKey')
    expect(extendApi).toHaveProperty('PhotoGroupContextKey')
    expect(extendApi).toHaveProperty('LightboxComponentKey')
    expect(extendApi).toHaveProperty('LightboxSlotsKey')
    expect(extendApi).toHaveProperty('LightboxDefaultsKey')
  })

  it('does not export deprecated individual keys', () => {
    expect(extendApi).not.toHaveProperty('LightboxControllerKey')
    expect(extendApi).not.toHaveProperty('LightboxChromeKey')
    expect(extendApi).not.toHaveProperty('LightboxOverlayKey')
    expect(extendApi).not.toHaveProperty('LightboxPortalKey')
    expect(extendApi).not.toHaveProperty('LightboxTriggerKey')
    expect(extendApi).not.toHaveProperty('LightboxStageKey')
    expect(extendApi).not.toHaveProperty('LightboxSlidesKey')
    expect(extendApi).not.toHaveProperty('LightboxCaptionKey')
  })
})
</file>
<file name="useGestures.test.ts" path="/packages/vue/test/useGestures.test.ts">
// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useGestures } from '../src/composables/useGestures'
import { createPhotoSet } from '@test-fixtures/photos'

function createGestureConfig(zoomedIn = false) {
  const isZoomedIn = ref(zoomedIn)
  const currentScale = zoomedIn ? 2 : 1
  const currentPan = ref({ x: 0, y: 0 })
  const panzoomMotion = {
    x: currentPan.value.x,
    y: currentPan.value.y,
    scale: currentScale,
    targetX: currentPan.value.x,
    targetY: currentPan.value.y,
    targetScale: currentScale,
    velocityX: 0,
    velocityY: 0,
    velocityScale: 0,
    tension: 170,
    friction: 17,
    rafId: 0,
  }

  const setPanzoomImmediate = vi.fn((scale: number, pan: { x: number; y: number }) => {
    panzoomMotion.scale = scale
    panzoomMotion.x = pan.x
    panzoomMotion.y = pan.y
    currentPan.value = pan
  })

  return {
    config: {
      lightboxMounted: ref(true),
      animating: ref(false),
      ghostVisible: ref(false),
      isZoomedIn: computed(() => isZoomedIn.value),
      zoomAllowed: computed(() => true),
      mediaAreaRef: ref(document.createElement('div')),
      currentPhoto: computed(() => createPhotoSet()[0]!),
      areaMetrics: ref({ left: 0, top: 0, width: 1200, height: 800 }),
      uiVisible: ref(true),
      panState: currentPan,
      zoomState: ref({ fit: 1, secondary: 2, max: 3, current: currentScale }),
      closeDragY: ref(0),
      controlsDisabled: computed(() => false),

      panzoomMotion,
      setPanzoomImmediate,
      startPanzoomSpring: vi.fn(),
      clampPan: vi.fn((pan: { x: number; y: number }) => pan),
      clampPanWithResistance: vi.fn((pan: { x: number; y: number }) => pan),
      applyWheelZoom: vi.fn(),
      toggleZoom: vi.fn(),
      getPanBounds: vi.fn(() => ({ x: 220, y: 120 })),

      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      goTo: vi.fn(),
      selectedSnap: vi.fn(() => 0),

      handleCloseGesture: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    },
    setPanzoomImmediate,
  }
}

describe('useGestures', () => {
  it('closes on Escape when the lightbox is mounted and idle', () => {
    const { config } = createGestureConfig(false)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(config.close).toHaveBeenCalledTimes(1)
  })

  it('navigates with arrow keys when not zoomed in', () => {
    const { config } = createGestureConfig(false)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).toHaveBeenCalledTimes(1)
    expect(config.goToPrev).toHaveBeenCalledTimes(1)
    expect(config.setPanzoomImmediate).not.toHaveBeenCalled()
  })

  it('pans with arrow keys instead of navigating when zoomed in', () => {
    const { config, setPanzoomImmediate } = createGestureConfig(true)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).not.toHaveBeenCalled()
    expect(config.goToPrev).not.toHaveBeenCalled()
    expect(setPanzoomImmediate).toHaveBeenNthCalledWith(1, 2, { x: -80, y: 0 })
    expect(setPanzoomImmediate).toHaveBeenNthCalledWith(2, 2, { x: 0, y: 0 })
  })
})
</file>
<file name="usePanzoom.test.ts" path="/packages/vue/test/usePanzoom.test.ts">
// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { computeZoomLevels } from '@nuxt-photo/core'
import { usePanzoom } from '../src/composables/usePanzoom'
import { createPhotoSet } from '@test-fixtures/photos'

describe('usePanzoom', () => {
  it('refreshes zoom state from the current photo and area metrics', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)

    expect(panzoom.zoomState.value).toEqual(computeZoomLevels(1600, 1000, 1200, 800))
    expect(panzoom.panState.value).toEqual({ x: 0, y: 0 })
  })

  it('returns a centered pan target when zooming back to fit', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)
    panzoom.setPanzoomImmediate(2, { x: 180, y: -90 })

    expect(panzoom.getTargetPanForZoom(panzoom.zoomState.value.fit, { x: 320, y: 240 })).toEqual({ x: 0, y: 0 })
  })

  it('clamps pan after recalculating geometry at the current zoom', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)
    panzoom.setPanzoomImmediate(panzoom.zoomState.value.max, { x: 1000, y: -1000 })
    panzoom.refreshZoomState(false)

    const bounds = panzoom.getPanBounds(currentPhoto.value, panzoom.zoomState.value.max)
    expect(panzoom.panState.value).toEqual({ x: bounds.x, y: -bounds.y })
  })

  it('applies transforms to the active slide ref only', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)
    const inactive = document.createElement('div')
    const active = document.createElement('div')

    panzoom.setActiveSlideIndex(1)
    panzoom.setPanzoomImmediate(2, { x: 30, y: -40 })
    panzoom.setSlideZoomRef(0)(inactive)
    panzoom.setSlideZoomRef(1)(active)

    expect(inactive.style.transform).toBe('translate3d(0px, 0px, 0) scale(1)')
    expect(active.style.transform).toBe('translate3d(30px, -40px, 0) scale(2)')
  })
})
</file>
<file name="build.config.ts" path="/packages/vue/build.config.ts">
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/', builder: 'mkdist', format: 'esm', declaration: true },
  ],
  clean: true,
  externals: ['vue', 'embla-carousel-vue', 'embla-carousel', '@nuxt-photo/core'],
  failOnWarn: false,
})
</file>
<file name="package.json" path="/packages/vue/package.json">
{
  "name": "@nuxt-photo/vue",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./extend": {
      "import": "./dist/extend.mjs",
      "types": "./dist/extend.d.ts"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "dependencies": {
    "@nuxt-photo/core": "workspace:*",
    "embla-carousel-vue": "9.0.0-rc01"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "embla-carousel": "9.0.0-rc01",
    "unbuild": "^3.5.0",
    "typescript": "^5.9.2",
    "vue": "^3.5.13",
    "vue-tsc": "^2.2.8"
  }
}
</file>
<file name="tsconfig.json" path="/packages/vue/tsconfig.json">
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "preserve"
  },
  "include": ["src"]
}
</file>
<file name="config.json" path="/scripts/size/config.json">
{
  "core": {
    "responsive": {
      "label": "responsive named import",
      "sizeLimit": "450 B",
      "brotliLimit": 450
    },
    "all": {
      "label": "full namespace import",
      "sizeLimit": "8.5 kB",
      "brotliLimit": 8704
    }
  },
  "vue": {
    "use-lightbox": {
      "label": "useLightbox named import",
      "brotliLimit": 19456
    },
    "photo-image": {
      "label": "PhotoImage component import",
      "brotliLimit": 1024
    },
    "all": {
      "label": "full package import",
      "brotliLimit": 21504
    }
  },
  "nuxt": {
    "module": {
      "label": "module enabled, no usage",
      "brotliDeltaLimit": 1024
    },
    "usage": {
      "label": "module enabled with PhotoImage usage",
      "brotliDeltaLimit": 1536
    }
  }
}
</file>
<file name="run.mjs" path="/scripts/size/run.mjs">
import { build as esbuildBuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import limits from './config.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..')
const fixturesRoot = resolve(root, 'test', 'size')
const resultsRoot = resolve(root, 'test-results', 'size')
const analyzeRoot = resolve(root, 'test-results', 'size-analyze')
const nuxiBin = resolve(root, 'node_modules', '.bin', 'nuxi')
const sizeLimitBin = resolve(root, 'node_modules', '.bin', 'size-limit')

const args = process.argv.slice(2)
const analyze = args.includes('--analyze')
const target = ['core', 'vue', 'nuxt'].find(arg => args.includes(arg)) ?? 'all'

const coreScenarios = [
  {
    id: 'responsive',
    name: 'core:responsive',
    source: "import { responsive } from '@nuxt-photo/core'; console.log(responsive)",
  },
  {
    id: 'all',
    name: 'core:all',
    source: "import * as core from '@nuxt-photo/core'; console.log(core)",
  },
]

const vueScenarios = [
  { id: 'use-lightbox', name: 'vue:use-lightbox' },
  { id: 'photo-image', name: 'vue:photo-image' },
  { id: 'all', name: 'vue:all' },
]

const nuxtScenarios = [
  { id: 'baseline', name: 'nuxt:baseline' },
  { id: 'module', name: 'nuxt:module' },
  { id: 'usage', name: 'nuxt:usage' },
]

main()

async function main() {
  prepareDir(resultsRoot)
  if (analyze) prepareDir(analyzeRoot)

  ensureBuild(target)

  let sizeLimitResults = new Map()
  if (target === 'all' || target === 'core') {
    sizeLimitResults = runSizeLimit()
  }

  const failures = []

  if (target === 'all' || target === 'core') {
    const rows = []
    for (const scenario of coreScenarios) {
      const result = await measureCoreScenario(scenario)
      const sizeLimitResult = sizeLimitResults.get(scenario.name)
      const passed = sizeLimitResult?.passed ?? result.brotli <= limits.core[scenario.id].brotliLimit
      if (!passed) failures.push(scenario.name)
      rows.push({
        scenario: limits.core[scenario.id].label,
        raw: formatBytes(result.raw),
        gzip: formatBytes(result.gzip),
        brotli: formatBytes(result.brotli),
        limit: formatBytes(limits.core[scenario.id].brotliLimit),
        status: passed ? 'PASS' : 'FAIL',
      })
    }
    printTable('Core', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Limit(br)', 'Status'], rows.map(row => [
      row.scenario,
      row.raw,
      row.gzip,
      row.brotli,
      row.limit,
      row.status,
    ]))
  }

  if (target === 'all' || target === 'vue') {
    const rows = []
    for (const scenario of vueScenarios) {
      const result = await measureViteFixture(scenario.id)
      const passed = result.brotli <= limits.vue[scenario.id].brotliLimit
      if (!passed) failures.push(scenario.name)
      rows.push([
        limits.vue[scenario.id].label,
        formatBytes(result.raw),
        formatBytes(result.gzip),
        formatBytes(result.brotli),
        formatBytes(limits.vue[scenario.id].brotliLimit),
        passed ? 'PASS' : 'FAIL',
      ])
    }
    printTable('Vue', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Limit(br)', 'Status'], rows)
  }

  if (target === 'all' || target === 'nuxt') {
    const measured = new Map()
    for (const scenario of nuxtScenarios) {
      measured.set(scenario.id, runNuxtFixture(scenario.id))
    }
    const baseline = measured.get('baseline')
    const moduleResult = measured.get('module')
    const usageResult = measured.get('usage')

    const moduleDelta = diffSizes(moduleResult, baseline)
    const usageDelta = diffSizes(usageResult, baseline)
    const modulePassed = moduleDelta.brotli <= limits.nuxt.module.brotliDeltaLimit
    const usagePassed = usageDelta.brotli <= limits.nuxt.usage.brotliDeltaLimit

    if (!modulePassed) failures.push('nuxt:module')
    if (!usagePassed) failures.push('nuxt:usage')

    printTable('Nuxt', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Delta(br)', 'Limit(br)', 'Status'], [
      [
        'baseline build',
        formatBytes(baseline.raw),
        formatBytes(baseline.gzip),
        formatBytes(baseline.brotli),
        '-',
        '-',
        'BASELINE',
      ],
      [
        limits.nuxt.module.label,
        formatBytes(moduleResult.raw),
        formatBytes(moduleResult.gzip),
        formatBytes(moduleResult.brotli),
        formatSignedBytes(moduleDelta.brotli),
        formatBytes(limits.nuxt.module.brotliDeltaLimit),
        modulePassed ? 'PASS' : 'FAIL',
      ],
      [
        limits.nuxt.usage.label,
        formatBytes(usageResult.raw),
        formatBytes(usageResult.gzip),
        formatBytes(usageResult.brotli),
        formatSignedBytes(usageDelta.brotli),
        formatBytes(limits.nuxt.usage.brotliDeltaLimit),
        usagePassed ? 'PASS' : 'FAIL',
      ],
    ])
  }

  if (analyze) {
    console.log(`\nAnalyze output written to ${relative(root, analyzeRoot) || analyzeRoot}`)
  }

  if (failures.length > 0) {
    console.error(`\nSize regression detected in: ${failures.join(', ')}`)
    process.exit(1)
  }
}

function ensureBuild(surface) {
  if (surface === 'all') {
    runCommand('pnpm', ['run', 'build'])
    return
  }

  const buildSets = {
    core: ['@nuxt-photo/core'],
    vue: ['@nuxt-photo/core', '@nuxt-photo/vue'],
    nuxt: ['@nuxt-photo/core', '@nuxt-photo/vue', '@nuxt-photo/recipes', '@nuxt-photo/nuxt'],
  }

  for (const pkg of buildSets[surface]) {
    runCommand('pnpm', ['--filter', pkg, 'build'])
  }
}

function runSizeLimit() {
  const stdout = execFileSync(sizeLimitBin, ['--json'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })

  const parsed = JSON.parse(stdout)
  const results = new Map()
  for (const entry of parsed) {
    results.set(entry.name, entry)
  }
  return results
}

async function measureCoreScenario(scenario) {
  const result = await esbuildBuild({
    stdin: {
      contents: scenario.source,
      resolveDir: root,
      sourcefile: `${scenario.id}.ts`,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    treeShaking: true,
    minify: true,
    write: false,
    metafile: analyze,
  })

  const output = result.outputFiles[0].contents

  if (analyze && result.metafile) {
    writeFileSync(resolve(analyzeRoot, `${scenario.name}.metafile.json`), JSON.stringify(result.metafile, null, 2))
  }

  return sizeBuffer(output)
}

async function measureViteFixture(fixtureId) {
  const tempDir = prepareFixture('vue', fixtureId)
  const analyzerFile = resolve(analyzeRoot, `vite-${fixtureId}.html`)

  await viteBuild({
    configFile: false,
    root: tempDir,
    logLevel: 'silent',
    plugins: [
      vue(),
      analyze ? visualizer({ filename: analyzerFile, gzipSize: true, brotliSize: true, open: false, template: 'treemap' }) : null,
    ].filter(Boolean),
    resolve: {
      preserveSymlinks: false,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      reportCompressedSize: false,
      rollupOptions: {
        external: ['vue'],
      },
    },
  })

  const assets = collectAssets(resolve(tempDir, 'dist', 'assets'))
  if (analyze) {
    writeFileSync(resolve(analyzeRoot, `vite-${fixtureId}.assets.json`), JSON.stringify(assets.files, null, 2))
  }
  return assets.totals
}

function runNuxtFixture(fixtureId) {
  const tempDir = prepareFixture('nuxt', fixtureId)
  runCommand(nuxiBin, ['build'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NUXT_TELEMETRY_DISABLED: '1',
    },
  })
  const assets = collectAssets(resolve(tempDir, '.output', 'public', '_nuxt'))
  if (analyze) {
    writeFileSync(resolve(analyzeRoot, `nuxt-${fixtureId}.assets.json`), JSON.stringify(assets.files, null, 2))
  }
  return assets.totals
}

function prepareFixture(surface, fixtureId) {
  const sourceDir = resolve(fixturesRoot, surface, fixtureId)
  const tempDir = resolve(resultsRoot, `${surface}-${fixtureId}`)
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(dirname(tempDir), { recursive: true })
  cpSync(sourceDir, tempDir, { recursive: true })
  return tempDir
}

function prepareDir(dir) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

function collectAssets(dir) {
  const files = []
  walk(dir, file => {
    const extension = extname(file)
    if (extension !== '.js' && extension !== '.css') return
    const relativePath = relative(dir, file)
    const contents = readFileSync(file)
    files.push({
      file: relativePath,
      ...sizeBuffer(contents),
    })
  })

  const totals = files.reduce((sum, file) => ({
    raw: sum.raw + file.raw,
    gzip: sum.gzip + file.gzip,
    brotli: sum.brotli + file.brotli,
  }), { raw: 0, gzip: 0, brotli: 0 })

  return { totals, files }
}

function walk(dir, onFile) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
    } else {
      onFile(fullPath)
    }
  }
}

function sizeBuffer(buffer) {
  return {
    raw: buffer.byteLength,
    gzip: gzipSync(buffer).byteLength,
    brotli: brotliCompressSync(buffer).byteLength,
  }
}

function diffSizes(value, baseline) {
  return {
    raw: value.raw - baseline.raw,
    gzip: value.gzip - baseline.gzip,
    brotli: value.brotli - baseline.brotli,
  }
}

function printTable(title, headers, rows) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map(row => String(row[index]).length)))

  const line = (cells) => cells.map((cell, index) => String(cell).padEnd(widths[index])).join('  ')

  console.log(`\n${title}`)
  console.log(line(headers))
  console.log(line(widths.map(width => '-'.repeat(width))))
  for (const row of rows) {
    console.log(line(row))
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return `${kb.toFixed(kb >= 10 ? 1 : 2)} kB`
}

function formatSignedBytes(bytes) {
  return bytes >= 0 ? `+${formatBytes(bytes)}` : `-${formatBytes(Math.abs(bytes))}`
}

function runCommand(command, commandArgs, options = {}) {
  try {
    return execFileSync(command, commandArgs, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    })
  } catch (error) {
    const details = [error.stdout, error.stderr].filter(Boolean).join('\n')
    throw new Error(details || error.message)
  }
}
</file>
<file name="photos.ts" path="/test/fixtures/photos.ts">
import type { PhotoItem } from '@nuxt-photo/core'

export function makePhoto(overrides: Partial<PhotoItem> = {}): PhotoItem {
  const id = overrides.id ?? `photo-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    src: `/photos/${id}.jpg`,
    thumbSrc: `/photos/${id}.jpg`,
    width: 1600,
    height: 1000,
    alt: `Fixture ${id}`,
    caption: `Caption ${id}`,
    description: `Description ${id}`,
    ...overrides,
  }
}

export function createPhotoSet(): PhotoItem[] {
  return [
    makePhoto({ id: 'desert', width: 1600, height: 1000, alt: 'Desert' }),
    makePhoto({ id: 'ocean', width: 1200, height: 1500, alt: 'Ocean' }),
    makePhoto({ id: 'canyon', width: 1600, height: 1067, alt: 'Canyon' }),
    makePhoto({ id: 'forest', width: 1500, height: 1000, alt: 'Forest' }),
    makePhoto({ id: 'alpine', width: 1400, height: 1750, alt: 'Alpine' }),
    makePhoto({ id: 'coast', width: 1600, height: 1100, alt: 'Coast' }),
    makePhoto({ id: 'lavender', width: 1800, height: 1200, alt: 'Lavender' }),
    makePhoto({ id: 'waterfall', width: 1300, height: 1700, alt: 'Waterfall' }),
    makePhoto({ id: 'city', width: 1600, height: 900, alt: 'City' }),
    makePhoto({ id: 'amber', width: 1400, height: 1400, alt: 'Amber' }),
    makePhoto({ id: 'winter', width: 1700, height: 1100, alt: 'Winter' }),
    makePhoto({ id: 'redwoods', width: 1500, height: 1900, alt: 'Redwoods' }),
  ]
}

export function createPlainPhotoSet(): PhotoItem[] {
  return [
    makePhoto({ id: 'one', width: 1600, height: 900 }),
    makePhoto({ id: 'two', width: 1200, height: 1600 }),
    makePhoto({ id: 'three', width: 1500, height: 1000 }),
    makePhoto({ id: 'four', width: 1400, height: 1400 }),
    makePhoto({ id: 'five', width: 1300, height: 1700 }),
    makePhoto({ id: 'six', width: 1800, height: 1200 }),
    makePhoto({ id: 'seven', width: 1600, height: 1000 }),
    makePhoto({ id: 'eight', width: 1100, height: 1500 }),
  ]
}
</file>
<file name="app.vue" path="/test/size/nuxt/baseline/app.vue">
<template>
  <div>nuxt-photo baseline fixture</div>
</template>
</file>
<file name="nuxt.config.ts" path="/test/size/nuxt/baseline/nuxt.config.ts">
export default defineNuxtConfig({})
</file>
<file name="package.json" path="/test/size/nuxt/baseline/package.json">
{
  "private": true,
  "type": "module"
}
</file>
<file name="app.vue" path="/test/size/nuxt/module/app.vue">
<template>
  <div>nuxt-photo module fixture</div>
</template>
</file>
<file name="nuxt.config.ts" path="/test/size/nuxt/module/nuxt.config.ts">
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
</file>
<file name="package.json" path="/test/size/nuxt/module/package.json">
{
  "private": true,
  "type": "module"
}
</file>
<file name="app.vue" path="/test/size/nuxt/usage/app.vue">
<script setup lang="ts">
const photo = {
  id: 'fixture-photo',
  src: '/demo.jpg',
  width: 1200,
  height: 800,
  alt: 'Fixture photo',
}
</script>

<template>
  <PhotoImage :photo="photo" />
</template>
</file>
<file name="nuxt.config.ts" path="/test/size/nuxt/usage/nuxt.config.ts">
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
</file>
<file name="package.json" path="/test/size/nuxt/usage/package.json">
{
  "private": true,
  "type": "module"
}
</file>
<file name="index.html" path="/test/size/vue/all/index.html">
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>nuxt-photo size fixture</title>
  </head>
  <body>
    <script type="module" src="/main.ts"></script>
  </body>
  </html>
</file>
<file name="main.ts" path="/test/size/vue/all/main.ts">
import * as NuxtPhoto from '@nuxt-photo/vue'

console.log(NuxtPhoto)
</file>
<file name="index.html" path="/test/size/vue/photo-image/index.html">
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>nuxt-photo size fixture</title>
  </head>
  <body>
    <script type="module" src="/main.ts"></script>
  </body>
  </html>
</file>
<file name="main.ts" path="/test/size/vue/photo-image/main.ts">
import { PhotoImage } from '@nuxt-photo/vue'

console.log(PhotoImage)
</file>
<file name="index.html" path="/test/size/vue/use-lightbox/index.html">
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>nuxt-photo size fixture</title>
  </head>
  <body>
    <script type="module" src="/main.ts"></script>
  </body>
  </html>
</file>
<file name="main.ts" path="/test/size/vue/use-lightbox/main.ts">
import { useLightbox } from '@nuxt-photo/vue'

console.log(useLightbox)
</file>
<file name=".size-limit.cjs" path="/.size-limit.cjs">
const config = require('./scripts/size/config.json')

module.exports = [
  {
    name: 'core:responsive',
    path: 'packages/core/dist/index.mjs',
    import: '{ responsive }',
    limit: config.core.responsive.sizeLimit,
  },
  {
    name: 'core:all',
    path: 'packages/core/dist/index.mjs',
    import: '*',
    limit: config.core.all.sizeLimit,
  },
]
</file>
<file name="knip.json" path="/knip.json">
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    ".": {
      "entry": ["package.json", "test/**/*.ts"]
    },
    "packages/core": {
      "entry": ["test/**/*.ts"],
      "project": ["src/**/*.ts", "test/**/*.ts"]
    },
    "packages/vue": {
      "entry": ["test/**/*.ts"],
      "project": ["src/**/*.ts", "test/**/*.ts"],
      "ignoreDependencies": ["vue-tsc"]
    },
    "packages/recipes": {
      "entry": ["test/**/*.ts"],
      "project": ["src/**/*.{ts,vue}", "test/**/*.ts"],
      "ignoreDependencies": ["vue-tsc"]
    },
    "packages/nuxt": {
      "entry": ["src/runtime/*.ts"],
      "project": ["src/**/*.ts", "test/**/*.ts"],
      "ignoreDependencies": ["nuxt", "@nuxt-photo/recipes"],
      "ignoreUnresolved": ["#imports"]
    },
    "docs": {
      "entry": ["app/**/*.vue", "app/**/*.ts", "server/**/*.ts", "content.config.ts"],
      "project": ["app/**/*.ts", "server/**/*.ts", "*.ts"],
      "ignoreDependencies": [
        "@iconify-json/lucide",
        "@iconify-json/simple-icons",
        "@iconify-json/vscode-icons",
        "@nuxt/fonts"
      ]
    },
    "playground": {
      "entry": ["pages/**/*.vue", "components/**/*.vue", "composables/**/*.ts"],
      "project": ["*.ts", "composables/**/*.ts"]
    },
    "playground-tailwind": {
      "entry": ["components/**/*.vue", "composables/**/*.ts"],
      "project": ["*.ts", "composables/**/*.ts"]
    }
  }
}
</file>
<file name="package.json" path="/package.json">
{
  "name": "nuxt-photo",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r --filter=!nuxt-photo-playground --filter=!nuxt-photo-playground-tw --filter=!nuxt-photo-docs build",
    "dev": "pnpm -r --parallel --filter=!nuxt-photo-playground --filter=!nuxt-photo-playground-tw --filter=!nuxt-photo-docs dev",
    "dev:playground": "pnpm run build && pnpm --filter nuxt-photo-playground dev",
    "dev:playground-tw": "pnpm run build && pnpm --filter nuxt-photo-playground-tw dev",
    "dev:docs": "pnpm run build && pnpm --filter nuxt-photo-docs dev",
    "build:playground": "pnpm run build && pnpm --filter nuxt-photo-playground build",
    "build:docs": "pnpm --filter nuxt-photo-docs build",
    "size": "node scripts/size/run.mjs",
    "size:core": "node scripts/size/run.mjs core",
    "size:vue": "node scripts/size/run.mjs vue",
    "size:nuxt": "node scripts/size/run.mjs nuxt",
    "size:analyze": "node scripts/size/run.mjs all --analyze",
    "test:unit": "vitest run",
    "test:module-package": "pnpm --filter @nuxt-photo/nuxt build && node --input-type=module -e \"const mod = await import(new URL('./packages/nuxt/dist/module.mjs', import.meta.url)); if (!mod.default) throw new Error('Missing default export from built module')\"",
    "test:e2e": "pnpm run build:playground && playwright test",
    "test": "pnpm test:unit && pnpm test:module-package && pnpm test:e2e",
    "lint": "pnpm -r lint"
  },
  "engines": {
    "node": ">=18"
  },
  "browserslist": [
    "last 2 versions",
    "not dead",
    "> 0.5%"
  ],
  "devDependencies": {
    "@nuxt-photo/core": "workspace:*",
    "@playwright/test": "^1.58.2",
    "@size-limit/preset-small-lib": "^12.1.0",
    "@vitejs/plugin-vue": "^6.0.5",
    "@vue/server-renderer": "^3.5.31",
    "jsdom": "^29.0.1",
    "rollup-plugin-visualizer": "^7.0.1",
    "size-limit": "^12.1.0",
    "vitest": "^4.1.2",
    "vue": "^3.5.31"
  }
}
</file>
<file name="vitest.config.ts" path="/vitest.config.ts">
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@nuxt-photo/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@nuxt-photo/vue/extend': fileURLToPath(new URL('./packages/vue/src/extend.ts', import.meta.url)),
      '@nuxt-photo/vue': fileURLToPath(new URL('./packages/vue/src/index.ts', import.meta.url)),
      '@nuxt-photo/recipes': fileURLToPath(new URL('./packages/recipes/src/index.ts', import.meta.url)),
      '@nuxt-photo/nuxt': fileURLToPath(new URL('./packages/nuxt/src/module.ts', import.meta.url)),
      '@test-fixtures': fileURLToPath(new URL('./test/fixtures', import.meta.url)),
    },
  },
  test: {
    root: rootDir,
    include: [
      'packages/*/test/**/*.test.ts',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['packages/vue/test/**', 'jsdom'],
      ['packages/recipes/test/**', 'jsdom'],
    ],
  },
})
</file>
</project_files>
</context>