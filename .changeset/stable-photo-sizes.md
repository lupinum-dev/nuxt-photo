---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

`Photo` takes a `sizes` prop for photos that are not full width. A `priority` photo keeps its server-rendered `sizes` after the page loads, so its preload and the image request the same file.
