---
'@lupinum/vue-photo': patch
---

Fix the glow behind the lightbox photo changing after the photo instead of with it.

The soft glow of the photo's colours now crosses over while you swipe, follows the photo when you let go, and settles in the same frame as the photo. Keys, buttons and the fade modes change it on the photos' own timing. On open, the glow is ready when the backdrop starts to appear and fades in with it, so the room no longer turns dark first and lighter again. The glow is painted from the thumbnail the page already shows when it can be read. `LightboxAmbient`'s `duration` now applies only to a photo change without motion, such as one set from outside.
