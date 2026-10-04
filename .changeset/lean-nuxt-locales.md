---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Keep config validation at Nuxt module setup and bundle only the app's configured label locales, with English fallback. Plain Vue keeps synchronous language detection and config validation, and constructs label functions only for the active locale.
