---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

New `localImages` option: set `nuxtPhoto: { localImages: true }` and photos from your `public/` folder no longer need `width` and `height`. Nuxt Photo reads the real dimensions when the app builds, and again whenever files change during `nuxt dev`. Remote images still need both values. The dimensions ship to the browser as a small lookup table, which is why the option is off by default.
