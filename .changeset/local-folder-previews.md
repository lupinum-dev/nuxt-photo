---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Add Nuxt-only `usePhotoFolder()` with folder-sized SSR and prerender payloads, and cached build-time WebP previews when the optional `sharp` peer is available. `localImages` installs dimensions and previews without requiring dimensions in photo data; `localImages: false` ships no global public image manifest.

PhotoAlbum emits `end-reached` when its end is within one viewport, once until the photo count grows.
