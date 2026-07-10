# Nuxt Photo vNext

This document records the architecture shipped as `0.2.0`. The library is
greenfield: vNext is a hard cutover, not a compatibility layer. Historical API
migration is intentionally out of scope because there are no consumers to
migrate.

## Design rules

- One source of truth for every important concept.
- Public APIs expose library concepts, not vendor internals.
- Invalid input fails at the nearest public boundary with actionable errors.
- Public collections and controller state are readonly.
- Setup-time capabilities remain stable for the lifetime of a mounted provider.
- Autonomous async failures are reported through Vue; awaited public methods
  reject normally.
- Only one lightbox may own modal focus and page isolation at a time.

## Public surface

The primary recipes are `Photo`, `PhotoAlbum`, `PhotoGroup`, and
`PhotoCarousel`. Advanced composition uses `LightboxProvider`, the lightbox and
photo primitives, and `useLightbox`/`useLightboxProvider`.

`PhotoItem` uses a non-empty string `id`, a non-empty `src`, and positive finite
dimensions. Optional library-consumed strings are validated. `meta` accepts any
non-null application-owned object and is never interpreted by the library.
`PhotoValidationError` is a runtime root export so callers can use
`instanceof` and inspect structured issues.

## Canonical photo ownership

Each provider owns an explicit ordered photo collection. `PhotoGroup` requires
`photos`; it never infers navigation order from descendant mount order.
Descendant `Photo` and `PhotoAlbum` recipes register only capability batches:
thumbnail elements and optional custom slide renderers keyed by photo ID.

Capability replacement is copy-on-write and validated before commit. Every
registered descendant ID must exist in the group collection, and multiple
owners cannot provide competing custom renderers for one ID. This keeps
navigation order stable while allowing visual layout order to change.

## Carousel boundary

The carousel API owns a deliberately small option set: `loop`, `dragFree`, and
positive-integer `slidesToScroll`, plus typed autoplay settings. Embla 9 RC is
exactly pinned across core, Vue, and autoplay packages.

Actual snap grouping is geometry-dependent because `containScroll: 'trimSnaps'`
is supported. The library therefore does not maintain an arithmetic shadow
model. `integrations/embla/snapModel.ts` is the single exact-version adapter
allowed to inspect Embla's internal slide-to-snap tables. Runtime selection,
dots, thumbnails, navigation, and `reInit` all derive from that adapter. A
focused real-geometry canary test is required for every Embla upgrade.

## Lightbox lifecycle

The runtime reconciles a latest-intent open/closed target through one abortable
runner. Open, close, reopen, collection changes, and transition failures settle
to a defined lifecycle state. Global modal ownership serializes provider
handoffs so two dialogs cannot make one another inert.

Component event promises are returned to Vue. Failures originating in native
listeners, watchers, or other autonomous paths go through the Vue application
error handler, falling back to a namespaced console error. Public controller
methods remain awaitable and reject on real failures.

`LightboxRoot` owns focus trapping, page sibling isolation, late-sibling
isolation, restoration, and focus return. A closed lightbox renders no Teleport,
which keeps server and client hydration trees identical.

## Nuxt module

Nuxt configuration is normalized and validated before setup side effects.
Unknown keys are errors at every supported nesting level. The app facade mirrors
the Vue runtime/type surface without exposing package-relative implementation
details to users.

## Release contract

A release is acceptable only when all of the following pass:

- formatting and ESLint;
- package, public-API, playground, Tailwind playground, and docs type checks;
- unit and SSR hydration tests;
- production playground browser tests across desktop and mobile engines;
- Vue and Nuxt bundle-size budgets;
- docs production build and prerender;
- tarball content checks plus a fresh packed-consumer Nuxt build;
- dependency audit with no moderate-or-higher vulnerabilities.

The durable user-facing change ledger lives in `CHANGELOG.md`; architecture and
sharp-edge details live in the reference documentation. No migration guide or
legacy shim is part of vNext.
