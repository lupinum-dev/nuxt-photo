---
title: Architecture
description: The four-package design, dependency graph, and layered component model.
navigation: true
---

# Architecture

nuxt-photo is built as five packages with a strict dependency hierarchy. Each layer adds functionality on top of the previous one.

## Package Hierarchy

```
@nuxt-photo/core       (Layer 0 — framework-free)
  ↑
@nuxt-photo/engine     (Layer 1 — framework-free orchestration)
  ↑
@nuxt-photo/vue        (Layer 2 — Vue composables & primitives)
  ↑
@nuxt-photo/recipes    (Layer 3 — ready-to-use components)
  ↑
@nuxt-photo/nuxt       (Layer 4 — Nuxt module integration)
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

## Layer 1: Engine

`@nuxt-photo/engine` owns the framework-free runtime state and command layer for the lightbox:

- Deterministic engine state (`status`, active index, zoom/pan state, gesture phase, render flags)
- Command-oriented API (`open`, `close`, `next`, `prev`, state patching)
- Subscription-based updates for framework adapters

This layer exists to keep orchestration out of Vue-specific composables.

## Layer 2: Vue

`@nuxt-photo/vue` adds Vue 3 reactivity and component abstractions:

- **Composables** — `useLightbox`, `useLightboxProvider`, `useContainerWidth`
- **Primitive components** — `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, `LightboxCaption`, `LightboxPortal`, `PhotoTrigger`, `PhotoImage`
- **Provide/inject system** — Stable keys for global adapters/defaults and internal context wiring

The root `@nuxt-photo/vue` entrypoint is the public Vue surface.

## Layer 3: Recipes

`@nuxt-photo/recipes` provides the high-level components most users interact with:

- **Photo** — Single photo with optional solo lightbox
- **PhotoAlbum** — Photo grid with layout algorithms and integrated lightbox
- **PhotoGroup** — Shared lightbox context for multiple albums/photos
- **PhotoCarousel** — Embla-based carousel with thumbnails and integrated lightbox
- **Lightbox** — The default lightbox UI with controls, counter, zoom button, and caption

It also contains all CSS files (structure and theme).

## Layer 4: Nuxt Module

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
@nuxt-photo/engine                  ← "Framework-free orchestration" layer
  ↓ uses
Core algorithms + state machine    ← "Framework-free" layer
```

**Most users** stay at the top layer. They use `PhotoAlbum` and everything works.

**Custom lightbox builders** drop to the middle layer. They call `useLightboxProvider` and compose primitives like `LightboxRoot`, `LightboxControls`, etc.

**Advanced integrations** build on `useLightboxProvider` plus primitives, or drop to `@nuxt-photo/engine` when they need the runtime below Vue.

## Build System

- **Core:** Unbuild with rollup bundling → single `.mjs` + `.d.ts`
- **Vue / Recipes:** Unbuild with mkdist → preserves directory structure for tree-shaking
- **Nuxt:** Nuxt Module Builder → `module.mjs` + `module.d.mts`
