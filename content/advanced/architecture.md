---
title: Architecture
description: The four-package design, dependency graph, and layered component model.
navigation: true
---

# Architecture

nuxt-photo is built as four packages with a strict dependency hierarchy. Each layer adds functionality on top of the previous one.

## Package Hierarchy

```
@nuxt-photo/core       (Layer 0 — framework-free)
  ↑
@nuxt-photo/vue        (Layer 1 — Vue composables & primitives)
  ↑
@nuxt-photo/recipes    (Layer 2 — ready-to-use components)
  ↑
@nuxt-photo/nuxt       (Layer 3 — Nuxt module integration)
```

Dependencies flow upward — each package only depends on the ones below it.

## Layer 0: Core

`@nuxt-photo/core` is pure TypeScript with **zero dependencies**. No Vue, no DOM APIs (except in optional utility functions). It contains:

- **Layout algorithms** — Knuth-Plass row justification, shortest-path column distribution, and masonry greedy placement (see [Layout Algorithms deep dive](/docs/advanced/layout-algorithms))
- **Physics engine** — Spring model for zoom/pan animations, velocity tracking, easing functions
- **Geometry** — Rectangle operations, visibility calculations, pan bounds
- **Viewer state machine** — The `closed → opening → open → closing → closed` lifecycle
- **Transition planner** — Decides FLIP vs fade based on thumbnail visibility and geometry
- **Collection** — Photo array normalization and ID management
- **Image adapter** — The native adapter and adapter type system
- **Types** — All shared TypeScript types (`PhotoItem`, `AlbumLayout`, `ResponsiveParameter`, etc.)

**Why framework-free?** The core algorithms are reusable. If someone builds a React or Svelte version, they can import `@nuxt-photo/core` directly.

## Layer 1: Vue

`@nuxt-photo/vue` adds Vue 3 reactivity and component abstractions:

- **Composables** — `useLightbox`, `useLightboxProvider`, `useLightboxContext` (full engine), `useContainerWidth`, `useGestures`, `usePanzoom`, `useCarousel`, `useGhostTransition`
- **Primitive components** — `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, `LightboxCaption`, `LightboxPortal`, `PhotoTrigger`, `PhotoImage`
- **Provide/inject system** — Injection keys and context types for sharing lightbox state across the component tree

This package has two export paths:

- `@nuxt-photo/vue` — Public API (composables, primitives)
- `@nuxt-photo/vue/extend` — Extension API (injection keys, context types, internal types for building custom lightboxes)

## Layer 2: Recipes

`@nuxt-photo/recipes` provides the high-level components most users interact with:

- **Photo** — Single photo with optional solo lightbox
- **PhotoAlbum** — Photo grid with layout algorithms and integrated lightbox
- **PhotoGroup** — Shared lightbox context for multiple albums/photos
- **PhotoCarousel** — Embla-based carousel with thumbnails and integrated lightbox
- **Lightbox / InternalLightbox** — The default lightbox UI with controls, counter, zoom button, and caption

It also contains all CSS files (structure and theme).

## Layer 3: Nuxt Module

`@nuxt-photo/nuxt` integrates everything into Nuxt:

- Auto-imports composables (`useLightbox`, `useLightboxProvider`, `responsive`)
- Registers all components globally (with optional prefix)
- Injects CSS based on the `css` option
- Detects `@nuxt/image` and installs the image adapter plugin
- Provides global lightbox defaults via app config

## The Component Model

Components are designed in concentric layers of abstraction:

```
PhotoAlbum / PhotoGroup / Photo     ← "Just works" layer
  ↓ uses
useLightboxProvider + primitives    ← "Custom UI" layer
  ↓ uses
useLightboxContext                  ← "Full engine" layer
  ↓ uses
Core algorithms + state machine    ← "Framework-free" layer
```

**Most users** stay at the top layer. They use `PhotoAlbum` and everything works.

**Custom lightbox builders** drop to the middle layer. They call `useLightboxProvider` and compose primitives like `LightboxRoot`, `LightboxControls`, etc.

**Advanced integrations** use `useLightboxContext` directly for full access to 50+ reactive properties (zoom state, pan bounds, gesture mode, transition plans, etc.).

## Build System

- **Core:** Unbuild with rollup bundling → single `.mjs` + `.d.ts`
- **Vue / Recipes:** Unbuild with mkdist → preserves directory structure for tree-shaking
- **Nuxt:** Nuxt Module Builder → `module.mjs` + `module.d.mts`
