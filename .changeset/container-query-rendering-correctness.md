---
'@lupinum/vue-photo': patch
---

Container-query rendering correctness

Setting `defaultContainerWidth` together with `breakpoints` on `<PhotoAlbum>` no longer emits a dead `@container` stylesheet. Inline calc widths are authoritative when `defaultContainerWidth` is set; the container-query path now renders only when it can actually own the layout (breakpoints without `defaultContainerWidth`). Albums relying on the old dual emission need no change — the inline widths they rendered are unchanged.

Fractional breakpoints no longer leave uncovered 1px windows between spans: integer breakpoints keep the clean `n - 1` upper bound, fractional ones emit a subtractive `calc()` bound.

An empty rows layout at every breakpoint now logs one dev-time warning instead of silently rendering unsized items.
