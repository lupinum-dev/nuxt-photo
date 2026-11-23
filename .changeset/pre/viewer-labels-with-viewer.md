---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Change the label catalogs so that labels only the lightbox viewer shows load with the viewer.

A page with an album or a carousel no longer ships the viewer's close, navigation, zoom, tool and error labels before a visitor reaches for a photo. `usePhotoLabels()` still returns every label, and label overrides and locales apply as before.
