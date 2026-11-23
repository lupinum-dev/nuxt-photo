# Nuxt Photo architecture

This file maps the implementation for contributors. Consumer documentation
lives in `docs/content/docs` and does not expose repository paths. The reasons
behind the shape are in [decisions.md](decisions.md) (D12 to D30 cover the
current design).

## Packages and entries

```text
@lupinum/nuxt-photo   Nuxt module, plugins, local images, /app and /primitives facades
        ↓ (only through the Vue exports map)
@lupinum/vue-photo    components, composables, lightbox engine, styles
        ↓
core                  validation, layout plans, image sizes, geometry; no Vue components
```

`@lupinum/vue-photo` has one stable root entry (five components, `PhotoImage`,
composables, helpers, types) and `/primitives`, the advanced lightbox parts.
`@lupinum/nuxt-photo/app` and `/primitives` re-export them; they keep no second
list of names. The entries `/internal`, `/locales/*` and `/viewer*` exist only
for `@lupinum/nuxt-photo` of the same version.

## Owners

Each fact has one owner:

| Fact                         | Owner                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Active photo, open or closed | the gallery store, `gallery/runtime.ts`; the viewer reconciles to it            |
| Open and close lifecycle     | the abortable reconciler in `lightbox/runtime.ts`                               |
| Position on the page         | CSS generated once from a layout plan (`core/layout`)                           |
| Per-frame motion             | the viewer, by direct style writes and CSS variables, never Vue state           |
| Markup                       | Vue templates, so server rendering works                                        |
| Which element is a thumbnail | the DOM: triggers carry `data-np-photo-id`, found by `thumbnailFor(id)`         |
| URL                          | `lightbox/history.ts` (`history`, `deepLink`); an app may bind `v-model:active` |
| Photo identity               | `core/photo/normalize.ts`: `id`, or `src` when `id` is absent                   |

## Groups and the eager/lazy split

Every recipe (`Photo`, `PhotoAlbum`, `PhotoCarousel`) talks to one group
through `PhotoGroupContext`: the surrounding `PhotoGroup`, or a group of one
that it creates with `usePhotoGroup` (`components/photo-group/usePhotoGroup.ts`).
Whoever creates a group renders its viewer. The group API addresses photos by
ID; a recipe maps `photos[index]` to an ID with `photoAt`
(`core/photo/lookup.ts`). `PhotoGroup.photos` is the collection and navigation
order; descendants register slide renderers by photo ID.

The eager part of a group is the gallery store, the capability index, the
deep-link check (`gallery/deepLink.ts`) and the intent loader
(`gallery/viewer.ts`). Everything else of the viewer sits behind one dynamic
`import('@lupinum/vue-photo/viewer')`: `ViewerHost.vue` runs `provideLightbox`
on the group's photos and store and renders `Lightbox` or `lightbox.component`.
The loader imports the chunk on the first `pointerover`, `touchstart` or
`focusin` on a trigger, on an idle callback after the first trigger enters the
viewport (not with `saveData`), and on any open request; it mounts the host on
the first open request. With a deep link the server renders the host at once.
All callers share one load promise, because Vite's preload helper waits for
the chunk's CSS only in the first call of an `import()`.

`architecture.test.ts` walks the static import graph of every recipe and fails
when viewer code (`lightbox/**`, `Lightbox.vue`, primitives, viewer labels,
viewer core modules) or Embla outside the carousel becomes eager.

## Layout plans

Every album layout returns one `AlbumPlan` (`core/layout/plan.ts`): a CSS
string, per-item class and style, order, and width shares for `sizes`.
`PhotoAlbum` has one template and renders the plan on the server; there is no
layout measurement.

- The plan evaluates the layout at each width of the breakpoint ladder
  (`DEFAULT_BREAKPOINTS` in `core/layout/constants.ts`, replaced from their
  smallest value up by the caller's breakpoints or `responsive()` keys) and
  writes container-query spans. Function-valued options are called at each
  ladder width.
- Rows (`core/layout/rows/plan.ts`): flex items with grow factors and hidden
  break elements that each span shows at its row ends. A memo keeps rows
  stable on append.
- Columns and masonry (`columns.ts`, `masonry.ts`): absolutely positioned items
  from CSS variables. Masonry picks columns once per run of ladder widths with
  the same column count, spacing and padding.
- Grid, bento, mosaic and accordion share `frame.ts`.
- `useElementWidth` measures the container only to choose `sizes`.

## Seams chosen by the Nuxt module

The Vue package imports three named entries by its own name (package
self-reference): `@lupinum/vue-photo/locales/photo`, `/locales/viewer` and
`/viewer`. Plain Vue resolves them to the full catalogs and the plain host.
The Nuxt module sets `nuxt.options.alias` for them: the catalogs become
generated files with only the app's languages (`locales.ts`), and `/viewer`
becomes `/viewer-structure` or `/viewer-themed` for `css: 'structure'` or
`'all'`, so the lightbox CSS loads with the viewer chunk and a server-rendered
deep link inlines it. The module resolves every Vue entry it registers
(components, primitives, stylesheets, hosts) from its own location, because an
app installed with a strict package manager cannot import `@lupinum/vue-photo`
by name. Build-time code (`options.ts`, `locales.ts`) bundles the Vue config
validator and label templates from source; nothing else reaches into Vue
source.

## The viewer

- `lightbox/runtime.ts` coordinates open and close intent, cancellation and
  status. Starting a conflicting operation aborts the current transition.
- `LightboxRoot` renders a native `<dialog>` (inside a `Teleport` to the
  configured target; Nuxt passes `#teleports`). A synchronous watch calls
  `showModal()` in the same task as hydration. The browser makes the page
  inert and keeps focus; Escape arrives as `cancel` and runs the animated
  close. The fullscreen target is the inner `[data-np-lightbox-surface]`.
- `lightbox/track.ts` moves slides in `slide` mode with one transform write per
  pointer move and settles with the Web Animations API. The fade modes, pan,
  pinch and the close drag use the same pointer code (`lightbox/input`).
- Motion finds its parts under the lightbox root by attribute
  (`transitions/visual-state.ts`): `data-np-motion`, `data-np-transition-*`
  and `data-np-slide="<index>"`. The same module owns every animation the
  open and close start (`fly` for the ghost's flight with its following parts,
  `fade` for linear opacity changes) and remembers where the ghost is drawn.
  `transitions/animation.ts` has the one start gate every animation's clock
  passes (D37). The one ref setter left is
  `setSlideZoomRef`: panzoom writes the zoom transform to that element on every
  spring frame, and the setter is the mount hook that gives a new slide the
  current zoom.

## The carousel

Embla owns `PhotoCarousel` motion and dragging, and only that.
`usePhotoCarouselRuntime.ts` creates both Embla instances from
`embla-carousel` on mount, reinitializes them when an option changes value and
destroys them on unmount. `gallery/embla.ts` keeps Embla a projection of the
gallery store. Each slide is one snap.

## Where to start

| Change                        | Start in                                                                |
| ----------------------------- | ----------------------------------------------------------------------- |
| Photo validation              | `packages/vue/src/core/photo`                                           |
| Album layout                  | `packages/vue/src/core/layout`                                          |
| Ready-made component behavior | `packages/vue/src/components/Photo*.vue`                                |
| Viewer loading                | `components/photo-group/usePhotoGroup.ts`, `gallery/viewer.ts`          |
| Open and close lifecycle      | `packages/vue/src/lightbox/runtime.ts`                                  |
| Transitions                   | `packages/vue/src/lightbox/transitions`                                 |
| Gestures and keyboard input   | `packages/vue/src/lightbox/input`, `lightbox/track.ts`                  |
| Pan and zoom                  | `packages/vue/src/lightbox/panzoom.ts`                                  |
| Carousel mechanics            | `packages/vue/src/components/photo-carousel/usePhotoCarouselRuntime.ts` |
| Nuxt registration             | `packages/nuxt/src/module.ts` and `packages/nuxt/src/runtime`           |

## Change invariants

- Public export changes update exact export tests and reference documentation.
- Lifecycle changes add a race or cancellation test.
- Gesture changes test resource cleanup as well as successful interaction.
- Carousel changes pass real-browser left-to-right and right-to-left tests.
- Package changes pass the packed-consumer release check.
- Setup-time lightbox capabilities change through remounting, not live mutation.
- Code that only the viewer uses stays out of the eager import graph.

Runtime dependencies need one clear owner. Use documented dependency APIs and
protect the used contract with an integration test.
