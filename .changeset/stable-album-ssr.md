---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Render balanced album columns and masonry on the server, reuse their photo assignment during hydration, and provide pixel-based thumbnail sizes from the initial layout estimate. This prevents thumbnail remounts, layout shifts, and oversized image requests caused by the old SSR fallback grid.
