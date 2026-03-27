Improve vue support:

Okay, I've spent a good chunk of time reading through the codebase — the core engine, the Vue composables, the primitives, the recipes layer, all of it. There's a lot of solid work here already. But there are some real opportunities to make the Vue layer sharper, more idiomatic, and easier for developers to work with.

Let me break this down by what I think matters most.

**The composable API surface is... a lot.** `useLightboxContext` returns 50+ properties (you even noted this in the comments). That's a sign it's doing too much in one place. Right now it orchestrates the carousel, panzoom, ghost transitions, AND gestures all in one giant function. If you split it into a coordinator pattern — where `useLightboxContext` composes smaller, focused composables and only exposes a curated public API — you'd get better tree-shaking, easier testing, and developers wouldn't feel like they're drinking from a firehose.

Something like separating the "what consumers need" (open, close, nav, state) from "what primitive components need" (gesture handlers, opacity refs, embla ref) more cleanly. You're halfway there with `useLightbox` vs `useLightboxProvider` vs `useLightboxContext`, but the boundaries are blurry.

**Reactivity gaps with Map-based state.** `thumbRefs` in the ghost state is a plain `Map<number, HTMLElement>` — Vue can't track changes to it. Same with `slideZoomRefs` in `usePanzoom` and `registrationMap` in `PhotoGroup.vue`. You're working around this with `registrationVersion` (a manual counter), which works but it's fragile. Consider using `shallowReactive(new Map())` or Vue 3.4+'s built-in reactive Map support. It'd clean up a few subtle bugs waiting to happen.

**The `PanzoomMotion` object bypasses Vue's reactivity entirely.** This is intentional for performance (direct RAF manipulation), and honestly that's the right call for 60fps animation. But the bridge between the imperative animation state and Vue's reactive state (`syncPanzoomRefs`) is manual and easy to get out of sync. A thin wrapper that clearly documents "this is intentionally non-reactive for perf, here's where the sync points are" would help future you (or contributors) avoid accidentally breaking the contract.

**Vue 3.5 features you're leaving on the table.** You require Vue 3.5+ in your peer deps, so you could use `useTemplateRef()` instead of the manual ref-setting pattern. Your `setThumbRef` and `setSlideZoomRef` functions do a lot of work to handle both Elements and ComponentPublicInstances — `useTemplateRef` handles that natively. Also, `useId()` (which you're already using in `usePhotoLayout`) could replace some of the Symbol-based registration IDs.

**The provide/inject key situation is getting complex.** You have `LightboxContextKey`, `LightboxSlideRendererKey`, `ImageAdapterKey`, `PhotoGroupContextKey`, `LightboxComponentKey`, `LightboxSlotsKey`, `LightboxDefaultsKey` — seven injection keys. Some of these could be consolidated. For instance, `LightboxSlotsKey` and `LightboxSlideRendererKey` both deal with custom rendering... they could be one key with a richer type. And `LightboxDefaultsKey` + `LightboxComponentKey` could merge into a single "lightbox config" injection.

**SSR safety is inconsistent.** Some places check `typeof window !== 'undefined'`, some check `typeof document !== 'undefined'`, and the body-scroll lock uses both. A single `isClient` utility (or importing one from VueUse if you're open to that dependency) would make this consistent and greppable.

**The image loading cache in `loader.ts` is global and never cleared** (well, it evicts after 500 entries, but it persists across route navigations in an SPA). In a Nuxt context with lots of pages, this could grow. Consider tying the cache lifecycle to the app instance or using a WeakRef-based approach.

**Error boundaries are minimal.** If `ensureImageLoaded` fails during a transition, the ghost state can get stuck. You have the `MAX_ANIMATION_MS` guard timer (good!), but errors in the open transition's try/catch just force-set opacity to 1 — the ghost element might still be visible, the body scroll might still be locked. The `resetOpenState` function doesn't cover all the state that `resetCloseState` does.

**Testing the Vue layer is thin compared to core.** Core has great algorithm tests. But the Vue composables? `usePanzoom.test.ts` and `useGestures.test.ts` cover basics, but there's no test for the full open→navigate→zoom→close lifecycle. The `recipeContracts.test.ts` tests mounting but not the actual transition flow. Adding integration tests with `@vue/test-utils` that exercise the state machine through realistic sequences would catch regressions the unit tests miss.

**One more thing** — the Embla carousel dependency is pinned to an RC version (`^9.0.0-rc01`). That's a risk. If Embla's API changes before stable release, you're exposed. Worth either pinning exact or abstracting the carousel interface so you could swap implementations. You've already done some of this abstraction in `useCarousel`, but the Embla types leak through (`EmblaCarouselType` in the `on` callbacks).

The bones are really solid here. The layered architecture (core → vue → recipes → nuxt) is well thought out, and the separation between headless primitives and opinionated recipes is exactly right. These suggestions are about tightening the Vue-specific layer to match the quality of the core algorithms.