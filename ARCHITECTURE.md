# Nuxt Photo architecture

This file maps the implementation for contributors. Consumer documentation
lives in `docs/content/docs` and does not expose repository paths.

## Package boundaries

```text
@lupinum/nuxt-photo  Nuxt registration, SSR integration, and app facade
        ↓
@lupinum/vue-photo   Public Vue components, composables, primitives, and types
        ↓
core                 Framework-light validation, layout, image, and geometry logic
```

`@lupinum/nuxt-photo/app` re-exports the public Vue package. It does not keep a
second list of application symbols.

## Vue source boundaries

- `packages/vue/src/components` owns the ready-made components and local helpers.
- `packages/vue/src/composables` owns public composables.
- `packages/vue/src/primitives` owns the lower-level lightbox components.
- `packages/vue/src/lightbox` owns lifecycle, transitions, carousel state,
  pan and zoom, and input handling.
- `packages/vue/src/core` owns logic that does not depend on Vue components.
- `packages/vue/src/internal` owns shared implementation details that are not public.

Imports flow from components toward core. Core does not import Vue components.
Nuxt source imports the public Vue package instead of source-tree internals.

## Runtime ownership

`packages/vue/src/lightbox/runtime.ts` coordinates open and close intent,
cancellation, and lifecycle status. Transition code does not own a second open
flag. Starting a conflicting operation aborts the current transition so a stale
image load or animation cannot publish state later.

`PhotoGroup.photos` is the collection and navigation-order source. Descendants
register thumbnail and slide-renderer capabilities by stable photo ID. Vue mount
order and keyed DOM moves cannot reorder the collection.

Embla owns carousel motion and dragging. Nuxt Photo uses its documented public
methods and owns the smaller public carousel contract. Each slide is one snap.

## Where to start

| Change                        | Start in                                                                   |
| ----------------------------- | -------------------------------------------------------------------------- |
| Photo validation              | `packages/vue/src/core/photo`                                              |
| Album layout                  | `packages/vue/src/core/layout` and `components/photo-album/layoutState.ts` |
| Ready-made component behavior | `packages/vue/src/components/Photo*.vue`                                   |
| Open and close lifecycle      | `packages/vue/src/lightbox/runtime.ts`                                     |
| Transitions                   | `packages/vue/src/lightbox/transitions`                                    |
| Gestures and keyboard input   | `packages/vue/src/lightbox/input`                                          |
| Pan and zoom                  | `packages/vue/src/lightbox/panzoom.ts`                                     |
| Carousel mechanics            | `packages/vue/src/components/photo-carousel/usePhotoCarouselRuntime.ts`    |
| Nuxt registration             | `packages/nuxt/src/module.ts` and `packages/nuxt/src/runtime`              |

## Change invariants

- Public export changes update exact export tests and reference documentation.
- Lifecycle changes add a race or cancellation test.
- Gesture changes test resource cleanup as well as successful interaction.
- Carousel changes pass real-browser left-to-right and right-to-left tests.
- Package changes pass the packed-consumer release check.
- Setup-time lightbox capabilities change through remounting, not live mutation.

Runtime dependencies need one clear owner. Use documented dependency APIs and
protect the used contract with an integration test.
