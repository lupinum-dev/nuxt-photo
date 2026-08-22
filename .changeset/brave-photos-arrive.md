---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Prepare the 1.0 release candidate around five complete recipe components, optional headless primitives, and one shared reactive lightbox contract.

Make lightboxes default across recipes; expose consistent recipe controllers; rename `useLightboxProvider()` to `provideLightbox()`; flatten carousel behavior props; add reactive Vue and serializable Nuxt localization; support reactive validation, transitions, adapters, and placeholders; and publish only explicit component, primitive, type, composable, provide, and stylesheet subpaths.

Make layout calculation deterministic with exact row optimization and shared JavaScript/CSS geometry, move the carousel to stable Embla 8.6.0, and split transition orchestration by responsibility.

Simplify the Nuxt module to four build-time option roots, load the complete theme by default, keep UI defaults in typed AppConfig, and keep image adapter configuration in `nuxt.config.ts` with quiet native fallback when Nuxt Image is absent.
