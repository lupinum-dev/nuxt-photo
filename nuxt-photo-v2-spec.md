# Nuxt Photo v2 — Architecture & Build Specification

Status: Draft v1  
Date: 2026-03-25  
Audience: maintainers / contributors / implementers

---

## 1. Goal

Rebuild the library from scratch with the same product surface, but a cleaner architecture, better package boundaries, and a first-class transition system for thumbnail → lightbox motion.

This spec combines the strongest ideas from the three architecture directions:

- **Pure core domain** for layout, collection, geometry, and viewer logic.
- **Headless Vue primitives** for composition and markup ownership.
- **Thin Nuxt integration** for auto-imports, SSR defaults, and `@nuxt/image` bridging.
- **Recipe components** for ergonomic drop-in usage.
- **A dedicated transition engine** for the “move the image into the lightbox” effect.

The most important product requirement is:

> **Opening a photo into the lightbox must feel physically continuous.**
> The thumbnail should appear to become the lightbox image, not disappear and be replaced.

That requirement drives the architecture.

---

## 2. Product Principles

### 2.1 API design principles

1. **One obvious happy path** for common use.
2. **Headless escape hatches** for advanced composition.
3. **Own your markup** by default.
4. **Own your styling** by default.
5. **Strong types are part of the API**.
6. **Package boundaries reflect architecture**.
7. **No black-box mega component**.
8. **No config-first UI customization** when composition is clearer.

### 2.2 Engineering principles

1. **Pure logic first**: algorithms and state machines live outside Vue.
2. **Vue owns rendering and reactivity**.
3. **Imperative DOM is allowed only in the transition runtime** where measurement and animation timing need it.
4. **The transition system is a subsystem, not an afterthought**.
5. **Feature separation happens through exports and package seams, not runtime flags**.
6. **Recipe components compose primitives; primitives compose core**.

---

## 3. What v2 ships

v2 keeps the conceptual product split, but rebuilds internals completely.

### Public product surfaces

- `Photo` — single-image smart component
- `PhotoAlbum` — layouted image collection with optional viewer integration
- `PhotoGallery` — arbitrary custom thumbnails connected to a viewer
- `Lightbox` — headless-capable overlay/viewer

### Public low-level primitives

- `PhotoProvider`
- `PhotoTrigger`
- `PhotoImage`
- `LightboxRoot`
- `LightboxViewport`
- `LightboxSlide`
- `LightboxControls`
- `LightboxPortal`
- `LightboxOverlay`

### Public composables

- `usePhotoCollection`
- `usePhotoLayout`
- `useLightbox`
- `usePhotoTrigger`
- `usePhotoTransition` (advanced)

---

## 4. Core architecture

The codebase is split into four layers.

## 4.1 `@nuxt-photo/core`

Framework-free TypeScript. No Vue. No Nuxt. No component concepts.

### Responsibilities

- item normalization
- collection modeling
- responsive value resolution
- layout algorithms
- viewer state machine
- geometry and bounds math
- image source selection planning
- transition planning and fallback decisions

### Core modules

#### `core/collection`

Canonical data model used by every product surface.

```ts
type PhotoItem = {
  id: string | number
  src: string
  thumbSrc?: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  blurhash?: string
  meta?: Record<string, unknown>
}

type SlideItem =
  | { type: 'image'; photo: PhotoItem }
  | { type: 'custom'; id: string; data?: unknown; width?: number; height?: number }
```

#### `core/layout`

Pure algorithms returning layout geometry.

- `computeRowsLayout(input)`
- `computeColumnsLayout(input)`
- `computeMasonryLayout(input)`
- `resolveResponsiveValue(value, width)`

#### `core/viewer`

Finite-state machine and controller logic.

```ts
type ViewerState =
  | { status: 'closed' }
  | { status: 'opening'; activeId: string | number }
  | { status: 'open'; activeId: string | number }
  | { status: 'closing'; activeId: string | number }
```

Exposes controller semantics:

- `open(id, options?)`
- `close()`
- `next()`
- `prev()`
- `setActive(id)`
- `setZoom(scale)`
- `panTo(x, y)`

#### `core/transition`

This is the most important new subsystem.

It decides:

- whether a smooth connected open is possible
- what geometry to animate from and to
- whether to animate live image pixels or a transition ghost layer
- when to fall back to fade/scale
- how to classify failures for debugging and telemetry

Core output:

```ts
type OpenTransitionPlan = {
  mode: 'connected' | 'fade' | 'scale-fade'
  sourceRect?: DOMRectLike
  targetRect?: DOMRectLike
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
```

#### `core/image`

Resolves image source intent for:

- thumbnail rendering
- album rendering
- lightbox rendering
- preloading
- responsive source planning

---

## 4.2 `@nuxt-photo/vue`

Vue bindings over core.

### Responsibilities

- reactivity wrappers
- provide/inject context
- composables
- headless render primitives
- controlled/uncontrolled state helpers

### Key design rule

> Vue owns the DOM structure.
> The transition runtime may temporarily measure and animate elements, but it must not become the main rendering model.

### Composables

#### `usePhotoCollection(items, options?)`
Returns normalized reactive collection metadata.

#### `usePhotoLayout(collection, options)`
Wraps core layout algorithms and container measurement.

#### `useLightbox(collection, options?)`
Wraps the viewer controller and lightbox state machine.

#### `usePhotoTrigger(lightbox, itemId)`
Provides open handlers, ARIA bindings, and registration hooks.

#### `usePhotoTransition(lightbox)`
Advanced composable exposing transition state and hooks.

---

## 4.3 `@nuxt-photo/recipes`

Opinionated default components built from primitives.

### Components

#### `Photo`
A smart single-image component.

Responsibilities:
- render one image
- optional caption
- optional lightbox on click
- progressive enhancement only

#### `PhotoAlbum`
A layout renderer.

Responsibilities:
- compute layout
- render items
- optionally connect items to a shared viewer
- never own the viewer architecture itself

#### `PhotoGallery`
A trigger renderer.

Responsibilities:
- connect arbitrary custom thumbnail markup to a viewer
- no layout engine
- no album-specific behavior

#### `Lightbox`
A viewer recipe.

Responsibilities:
- render a default overlay / slide viewport / controls
- expose slots for override
- compose `LightboxRoot`, `LightboxViewport`, `LightboxControls`, etc.

---

## 4.4 `@nuxt-photo/nuxt`

Thin Nuxt adapter only.

### Responsibilities

- auto-imports
- optional component registration
- CSS registration
- SSR-safe defaults
- `@nuxt/image` adapter integration

### Non-responsibilities

- layout math
- lightbox logic
- animation decisions
- core package architecture

### Target module options

```ts
export interface NuxtPhotoOptions {
  autoImports?: boolean
  components?: boolean | { prefix?: string }
  css?: 'none' | 'structural' | 'default'
  image?: {
    provider?: 'nuxt-image' | 'native' | 'custom'
  }
  viewer?: {
    reducedMotionBehavior?: 'fade' | 'instant'
    preload?: 'adjacent' | 'visible' | 'none'
  }
}
```

---

## 5. The key architectural decision: Vue-native, but not naïve

There is a real tension between two styles:

1. **Strictly reactive Vue only** — elegant, but can struggle with very precise connected-motion timing.
2. **Imperative DOM animation engine** — very smooth, but can turn the app into a wrapped vanilla JS library.

### Decision

v2 uses a **hybrid model**:

- **Vue controls structure, state, slots, visibility, slide rendering, and composability.**
- **A small transition runtime controls measurement and connected-motion transforms during open/close only.**

This is the recommended design because the “moving image into lightbox” effect depends on:

- measuring the trigger element at click time
- measuring the target viewport geometry
- potentially decoding the destination image first
- animating a temporary promoted layer at 60fps+
- coordinating scroll-lock, overlay fade, and image handoff

That should not be spread across generic component logic.

### Therefore:

- We do **not** build the transition purely with Vue `<Transition>`.
- We do **not** build the entire viewer as an imperative DOM engine.
- We build a **small dedicated transition runtime** that plugs into a Vue-first viewer.

This is the most realistic path to “buttery” motion.

---

## 6. Smooth open/close transition spec

This section is the heart of v2.

## 6.1 User experience requirement

When a user taps or clicks a thumbnail:

1. The thumbnail visually remains present.
2. A motion handoff begins immediately.
3. The image appears to expand and reposition into the lightbox viewport.
4. The overlay and surrounding chrome fade in around the motion.
5. At the end of the transition, control hands off to the real slide DOM.

The reverse should happen on close when possible.

---

## 6.2 Transition modes

### Mode A — Connected transform (preferred)
Used when geometry is reliable.

Behavior:
- source rect measured from trigger element
- target rect measured from final fitted image bounds in viewport
- temporary transition layer created
- source thumbnail hidden visually but layout preserved
- transform interpolates source → target
- opacity/overlay animate in parallel
- handoff to real slide once transition completes

### Mode B — Scale + fade fallback
Used when source exists but geometry confidence is weak.

Behavior:
- image opens from approximate center/scale
- overlay and content fade in
- no fake geometry precision promised

### Mode C — Fade fallback
Used when source is missing, off-screen, or reduced motion is enabled.

Behavior:
- overlay fades in
- active slide fades in
- no connected motion

---

## 6.3 Geometry model

### Source geometry
Measured from the clicked trigger / thumbnail element.

Required:
- viewport-relative rect
- natural aspect ratio if available
- source visibility check
- CSS transform awareness

### Target geometry
Computed from:
- viewport size
- lightbox paddings
- image aspect ratio
- `object-fit` behavior
- safe-area insets

We do **not** measure target layout after full viewer paint if we can deterministically compute it sooner.

---

## 6.4 Transition runtime phases

### Phase 1 — Capture
At trigger click/open call:
- locate registered trigger element
- read bounding client rect
- snapshot scroll position
- classify visibility / confidence
- create transition plan

### Phase 2 — Prepare
- lock scroll if needed
- render overlay shell
- ensure destination image resource is ready or ready enough
- mount transition layer in portal root
- mark source as transition-owned

### Phase 3 — Animate
- run transform/opacity animation using WAAPI or RAF-backed transform updates
- keep animation on compositor-friendly properties only:
  - `transform`
  - `opacity`
- never animate width/height/top/left during the active motion

### Phase 4 — Handoff
- show real lightbox slide
- remove transition layer
- restore source state
- complete viewer state from `opening` → `open`

### Phase 5 — Reverse close
Attempt symmetric connected close if:
- source trigger still exists
- source is measurable
- source is not heavily occluded

Otherwise use scale/fade fallback.

---

## 6.5 Rendering strategy for the moving image

The moving image is **not** the final slide DOM.

We use a **ghost layer**:

- a promoted absolutely/fixed positioned element in a portal
- contains the best available bitmap/source
- receives only transform and opacity changes
- exists only during transition

Benefits:
- isolates motion from viewer layout
- avoids slide internals being forced to animate during mount
- makes close animation symmetrical

---

## 6.6 Performance requirements

1. Motion must primarily use `transform` and `opacity`.
2. The transition layer should be GPU-promoted.
3. No synchronous reflow loops during animation.
4. Geometry reads happen before animation start, then batched.
5. Heavy viewer code may lazy-load, but the transition shell must be fast enough to start immediately.
6. Image decoding should use optimistic preflight where possible.

---

## 6.7 Reduced motion

If the user prefers reduced motion:
- default to `fade`
- allow app override to `instant`
- never force connected transforms

---

## 6.8 Debugging and observability

The transition subsystem should expose debug info in development:

```ts
type TransitionDebugEvent = {
  phase: 'capture' | 'prepare' | 'animate' | 'handoff' | 'fallback'
  itemId: string | number
  mode: 'connected' | 'fade' | 'scale-fade'
  reason: string
  durationMs?: number
}
```

This makes it possible to diagnose why motion fell back.

---

## 7. Layout architecture

Layout should be pure and adapter-driven.

### Adapter interface

```ts
interface AlbumLayoutAdapter {
  name: string
  compute(input: LayoutInput): LayoutOutput
}
```

### Built-in adapters

- `rows`
- `columns`
- `masonry`

### Public API behavior

```vue
<PhotoAlbum layout="masonry" />
```

or

```ts
const layout = createCustomLayoutAdapter(...)
```

```vue
<PhotoAlbum :layout="layout" />
```

### Rule

Layout engines never know about lightbox open state.

They only compute geometry.

---

## 8. Data model and collection model

Everything should normalize to a collection.

### Why

This unifies the product model:
- `Photo` = collection of 1
- `PhotoAlbum` = layout renderer over a collection
- `PhotoGallery` = trigger renderer over a collection
- `Lightbox` = viewer over a collection

### Collection responsibilities

- normalized item IDs
- lookup by ID / index
- active item helpers
- neighboring item helpers
- preload candidates
- trigger registration map

---

## 9. Image adapter model

We do not bake image rendering into the core architecture.

### Adapter contract

```ts
interface ImageAdapter {
  resolveThumbnail(item: PhotoItem, options: ResolveImageOptions): ResolvedImage
  resolveSlide(item: PhotoItem, options: ResolveImageOptions): ResolvedImage
}
```

### Provided adapters

- `native`
- `nuxt-image`
- `custom`

### Rule

`PhotoImage` is the only leaf image-renderer primitive. Everything else composes it.

---

## 10. Package structure

```txt
packages/
  core/
    src/
      collection/
      layout/
      viewer/
      transition/
      image/
      index.ts

  vue/
    src/
      composables/
        usePhotoCollection.ts
        usePhotoLayout.ts
        useLightbox.ts
        usePhotoTrigger.ts
        usePhotoTransition.ts
      components/
        PhotoProvider.vue
        PhotoTrigger.vue
        PhotoImage.vue
        LightboxRoot.vue
        LightboxViewport.vue
        LightboxSlide.vue
        LightboxControls.vue
        LightboxOverlay.vue
        LightboxPortal.vue
      index.ts

  recipes/
    src/
      Photo.vue
      PhotoAlbum.vue
      PhotoGallery.vue
      Lightbox.vue
      index.ts

  nuxt/
    src/
      module.ts
      runtime/
        plugin.ts
        image-adapter.ts
      index.ts

  styles/
    structural.css
    default.css
```

---

## 11. Export strategy

The architecture should be visible in the exports.

### Exports

- `@nuxt-photo/core`
- `@nuxt-photo/vue`
- `@nuxt-photo/recipes`
- `@nuxt-photo/nuxt`

Optional finer-grained subpaths:

- `@nuxt-photo/vue/lightbox`
- `@nuxt-photo/vue/album`
- `@nuxt-photo/vue/image`

### Rule

Do not rely on runtime module flags for real bundle separation.
Use ESM boundaries and lazy loading.

---

## 12. Styling model

Two layers only.

### `structural.css`
Minimal required structural rules:
- portal stacking context helpers
- overflow / containment helpers
- visually hidden utilities if needed
- transition-layer helpers

### `default.css`
Optional presentational defaults:
- controls appearance
- overlay look
- spacing tokens
- caption styling

### Rule

A user should be able to ship only structural CSS and fully own the appearance.

---

## 13. State management and control model

All major surfaces should support controlled and uncontrolled use.

### Canonical v-models

- `v-model:open`
- `v-model:index`
- `v-model:activeId`

### Events

- `open`
- `opened`
- `close`
- `closed`
- `change`
- `changed`

### Rule

Model-driven state is primary; events are secondary.

---

## 14. Accessibility requirements

1. Trigger elements must be keyboard reachable.
2. Viewer must trap focus when modal.
3. Escape closes when enabled.
4. Arrow navigation works when relevant.
5. Announcements for slide changes should be possible.
6. Reduced motion must be respected.
7. Headless primitives must ship sensible ARIA defaults.

---

## 15. Performance requirements

1. Layout algorithms are pure and testable.
2. Viewer slide rendering should support lazy content.
3. Adjacent slides can be preloaded opportunistically.
4. Transition shell starts immediately on interaction.
5. Heavy gesture logic may lazy-load after first viewer open.
6. Resize handling should be observer-based and batched.
7. Avoid global listeners when viewer is closed.

---

## 16. Testing strategy

### Unit tests

- item normalization
- responsive value resolution
- layout outputs
- viewer state machine
- transition plan classification
- geometry math

### Component tests

- trigger registration
- controlled/uncontrolled state
- lightbox keyboard behavior
- slot composition contracts

### Visual/integration tests

- thumbnail → lightbox open transition
- close transition
- fallback transitions
- reduced motion
- album layout stability across breakpoints

### Performance checks

- frame budget during connected open/close
- no long tasks on first interaction
- decode timing tolerance

---

## 17. Migration strategy

## Phase 1 — Core extraction

Build `core` first:
- collection
- layout
- viewer machine
- transition planner
- image adapter interfaces

## Phase 2 — Vue primitives

Build `vue` primitives and composables:
- `usePhotoCollection`
- `usePhotoLayout`
- `useLightbox`
- `PhotoTrigger`
- `PhotoImage`
- `LightboxRoot`

## Phase 3 — Recipe components

Rebuild:
- `Photo`
- `PhotoAlbum`
- `PhotoGallery`
- `Lightbox`

## Phase 4 — Nuxt integration

Add:
- module
- auto-imports
- CSS registration
- image adapter wiring

## Phase 5 — Transition polish

Tune:
- connected open/close
- fallback thresholds
- decoding strategy
- debug instrumentation

## Phase 6 — Compatibility layer

Optionally provide temporary aliases for legacy names.

---

## 18. Implementation order (recommended)

1. Define canonical `PhotoItem` / `SlideItem` types.
2. Build collection model.
3. Extract layout engines into pure functions.
4. Build viewer state machine.
5. Build transition planner and geometry helpers.
6. Build the transition runtime portal/ghost layer.
7. Build Vue composables.
8. Build headless primitives.
9. Build recipe components.
10. Add Nuxt adapter.
11. Add CSS layers.
12. Add docs/playground/examples.

---

## 19. Explicit non-goals

1. No monolithic options object for UI composition.
2. No giant imperative viewer engine that bypasses Vue for everything.
3. No layout engine embedded inside gallery/viewer logic.
4. No hidden coupling between album and lightbox.
5. No dependence on runtime feature flags for architecture.
6. No promise of connected-motion success in every edge case — graceful fallback is part of the design.

---

## 20. Final decision summary

### We are choosing:

- **Pure core domain**
- **Vue-first headless primitives**
- **Thin Nuxt adapter**
- **Recipe components on top**
- **Hybrid transition runtime for buttery thumbnail → lightbox motion**

### We are not choosing:

- “Everything is just components” architecture
- “Everything is just a DOM engine wrapped in Vue” architecture
- configuration-heavy UI as the primary customization model

---

## 21. Build target

The target outcome is a library that feels like this:

- simple to use for the 80% case
- deeply composable for the 20% case
- easy to tree-shake
- easy to reason about internally
- and, most importantly,
- **visually convincing when an image opens into the lightbox**

That last point is the product differentiator and should be treated as a first-class engineering feature, not polish to add later.
