---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

All four photo recipes now support `v-model:active` with a photo ID or `null`, and expose `GalleryHandle` with open, openById, close, isOpen, activeId, and activePhoto. Replace the removed LightboxHandle type with GalleryHandle. PhotoCarousel also exposes scrollTo, next, and prev for its inline track.

Gallery selection now follows photo IDs across collection changes, so removing an earlier photo keeps the same photo active. Remove PhotoCarousel's direction prop and use ancestor dir or CSS direction on the gallery root. Direction is read at mount and each lightbox open; remount the inline carousel when direction changes.
