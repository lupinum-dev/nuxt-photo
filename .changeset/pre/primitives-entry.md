---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change the lightbox primitives to their own entry: `LightboxProvider`, `LightboxRoot`, `LightboxOverlay`, `LightboxAmbient`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, `LightboxCaption`, `PhotoTrigger` and their slot-prop types now come from `@lupinum/vue-photo/primitives`, or `@lupinum/nuxt-photo/primitives` in Nuxt. The primitives entry is advanced API and may change in a minor version. The root entry and `@lupinum/nuxt-photo/app` keep the stable API, including `PhotoImage`. `components: { primitives: true }` still registers the primitives by name.

Migration: `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/app'` becomes `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/primitives'` (in plain Vue, `@lupinum/vue-photo` becomes `@lupinum/vue-photo/primitives`).
