---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Album thumbnails now download the size they are shown at. The album passes each photo's real width to the browser, so phones no longer load oversized files and large screens no longer get blurry ones. The object form of `sizes` now works for columns and masonry layouts too.

New `priority` props load the first images on the page first: `<PhotoAlbum :priority="4">` makes the first four thumbnails eager with `fetchpriority="high"`, and `<Photo priority>` does the same for a single photo. Use them for images visible without scrolling.
