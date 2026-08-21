---
'@lupinum/vue-photo': minor
---

measureImage helper for CMS dimension discovery

New exported `measureImage(src)` (auto-imported in Nuxt) loads an image once and resolves its intrinsic dimensions, with per-URL caching. Use it when a CMS payload lacks the `width`/`height` that `PhotoItem` requires; prefer real upload metadata when available.
