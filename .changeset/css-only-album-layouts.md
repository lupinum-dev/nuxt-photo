---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Add four `PhotoAlbum` layouts that CSS places completely, so the server HTML is final at every container width and nothing moves after hydration: `grid` (same-size tiles), `bento` (big and small tiles without gaps, with a typed `featured` option), `mosaic` (a few photos fill one frame; the last tile shows how many more there are) and `accordion` (slices that open on hover or keyboard focus). They crop photos to fill their tiles, and each tile downloads the size it is shown at. Bento and mosaic may move a photo a few places to crop less; the page, the Tab key and the lightbox follow the order on screen, and `open(index)` still uses the position in `photos`.
