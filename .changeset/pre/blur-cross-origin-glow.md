---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Blur the lightbox glow for thumbnails from another origin, such as a CDN. The glow now requests those thumbnails with CORS, so the canvas can read and blur them. When the image server sends no CORS headers, it loads the thumbnail again without CORS and shows the softened glow as before.
