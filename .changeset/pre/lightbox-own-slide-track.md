---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Fix the lightbox swipe and close drag on touch screens, which stopped after the first move in Chromium.

In `slide` mode the lightbox now moves photos with its own pointer code instead of Embla, so the viewer loads less JavaScript. The track follows the pointer one to one, a release goes to the next or previous photo by position and speed, a new drag catches a photo that is still settling, and the collection loops. Arrow keys, buttons and the wheel use the same slide. `PhotoCarousel` still uses Embla.
