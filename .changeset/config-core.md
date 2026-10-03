---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Configure plain Vue apps with `app.use(createPhoto(config))`. Nested lightbox and label overrides now merge with inherited config. The public injection keys for defaults, image adapters, lightbox components, and dimensions have been removed.

Configure Nuxt Photo only in `nuxt.config.ts`. Runtime `app.config.nuxtPhoto` is no longer read. Invalid config throws a `TypeError` at setup. Labels support nine bundled locales, HTML language detection in Vue, and the active Nuxt i18n locale. Nuxt label strings retain `{index}` and `{count}` templates. `validatePhotos` returns valid photos and validation issues without throwing.
