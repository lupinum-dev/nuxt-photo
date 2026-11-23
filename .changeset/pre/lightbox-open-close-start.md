---
'@lupinum/vue-photo': patch
---

Fix a stutter when the lightbox opens and closes on phones.

Every open and close now starts on one frame, so its first frame shows the photo at its starting place. The photo flies on one spring, and a close by a drag down continues the drag's speed. The flying photo shows only once its image is decoded, so it never appears as an empty grey box. In `transition: 'auto'`, a thumbnail partly under a sticky header or partly off screen opens and closes with a fade, so no photo flies over the page's header.
