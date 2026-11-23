---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': patch
---

Add `@lupinum/vue-photo/styles/*` to import a single stylesheet, for example `@lupinum/vue-photo/styles/lightbox-structure.css`. The Nuxt module now uses the Vue package only through its exports map, so a strict package manager no longer depends on the internal file layout of `@lupinum/vue-photo`. The new entries `@lupinum/vue-photo/internal`, `/locales/photo`, `/locales/viewer` and `/viewer` are for `@lupinum/nuxt-photo` of the same version only: semantic versioning does not cover them.
