---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Add grid, bento, mosaic and accordion layouts to `PhotoAlbum`.

CSS places every tile, so the server HTML is final at every container width and nothing moves after hydration. `grid` shows same-size tiles. `bento` mixes big and small tiles without gaps and takes a typed `featured` option. In `mosaic`, a few photos fill one frame and the last tile shows how many more there are. `accordion` slices open on hover or keyboard focus. All four crop photos to fill their tiles, and each tile downloads the size it is shown at. Bento and mosaic may move a photo a few places to crop less. The page, the Tab key and the lightbox follow the order on screen; `open(index)` still uses the position in `photos`.
