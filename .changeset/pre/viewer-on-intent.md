---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change when the lightbox viewer loads: only when a visitor reaches for a photo.

A page with `Photo`, `PhotoAlbum`, `PhotoCarousel` or `PhotoGroup` no longer ships the viewer in its first JavaScript. The viewer loads as one separate chunk when a pointer, touch or keyboard focus reaches a photo, when the browser is idle after a photo became visible, or when code opens a photo. The idle load does not happen when the visitor turned on data saving. A page that opens with a deep-linked photo still renders the open lightbox on the server. `useLightbox()` in a component slot works before the viewer has loaded: `open` and `openById` load it and resolve when the lightbox is open. The `columns` and `masonry` layout rules move from the shared stylesheet into the CSS that each such album generates.

Migration: a component that you pass as `lightbox.component` now mounts when a photo first opens, not when the page mounts. Move code that must run at page mount out of that component.
