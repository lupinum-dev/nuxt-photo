---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Remove the `defaultContainerWidth` prop of `PhotoAlbum` and the `.np-album__column` and `.np-album__skeleton` classes: the `rows`, `columns` and `masonry` layouts now render from CSS alone.

The server sends an album that CSS places at every container width, so it no longer jumps after hydration, and with JavaScript turned off it looks the same. Layouts are planned at 320, 480, 640, 768, 1024, 1280, 1536, 1920 and 2560 pixels, or at your `breakpoints` and `responsive()` keys from the smallest one up. A function value for `spacing`, `padding`, `targetRowHeight` or `columns` is called at each of these widths instead of only at width 0, and the warning about it is gone. Column widths, spacing and padding stay the same. In `columns` and `masonry`, photos are one flat list in `photos` order, so keyboard focus in `masonry` follows `photos` order instead of going column by column. Photos you append keep their place in `rows` and `masonry`, and a `masonry` photo keeps its column while the container resizes within one column count.

Migration: delete `default-container-width` from every `PhotoAlbum`; no layout needs a replacement. Move CSS that targets `.np-album__column` to `.np-album__item` or `.np-album__frame`, and delete rules for `.np-album__skeleton`.
