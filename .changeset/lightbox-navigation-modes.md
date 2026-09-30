---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Choose how the lightbox changes photos with the new `navigation` option: `slide` (default, the swipe strip), `fade` (the current photo fades out, then the next fades in), or `crossfade` (the next photo fades in over the current one). In the fade modes a swipe still works: the photo follows the finger and fades with distance, then either changes or settles back. Under reduced motion, `slide` now jumps to the next photo instead of scrolling.
