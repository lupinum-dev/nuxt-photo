---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Change configuration to one place and labels to follow the page language.

Nuxt apps set `nuxtPhoto` in `nuxt.config.ts`; plain Vue apps install settings with `app.use(createPhoto(config))`. An unknown or invalid option stops setup with a `TypeError` that names it.

Labels follow the page language. Ten languages are bundled: `en de fr es it nl pt pt-PT ar he`, where `pt` is Brazilian Portuguese. Nuxt uses the active `@nuxtjs/i18n` locale and bundles only the languages the app needs; plain Vue reads the `lang` of the page. `labels: 'de'` picks a language, and an object overrides single labels.

`validatePhotos()` checks photo data and returns the valid photos and every problem without throwing.
