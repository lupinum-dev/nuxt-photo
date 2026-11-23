---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Fix a `PhotoAlbum` that lost its layout after hydration and showed its photos in one column.

The album named its generated CSS with `useId()`. Some apps give a component a different ID on the server than in the browser, for example a page rendered from Markdown. The CSS then no longer matched the album. The name now comes from the CSS itself, so it is the same on both sides. Albums with the same photos and layout share one name.
