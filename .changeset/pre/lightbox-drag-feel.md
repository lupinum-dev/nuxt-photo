---
'@lupinum/vue-photo': patch
---

Fix the lightbox drag feel on touch screens. A swipe, a drag down to close and a pan no longer jump when they start, and the photo stays under the finger while it moves. After the finger lifts, the photo settles with one quick spring that keeps the finger's speed, starts on the first frame and does not bounce. Swiping and the close drag now settle the same way.
