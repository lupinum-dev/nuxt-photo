---
'@lupinum/vue-photo': minor
---

PhotoCarousel: lightbox on by default, flat behavior props

`<PhotoCarousel>` now opens the built-in lightbox when a slide is activated, matching `<PhotoAlbum>`, `<Photo>`, and `<PhotoGroup>`. Set `:lightbox="false"` to keep the old behavior.

`loop`, `dragFree`, and `slidesToScroll` are now top-level props. The `options` bag still works but is deprecated; a flat prop wins when both are set.

```vue
<!-- Before -->
<PhotoCarousel :photos="photos" :options="{ loop: true, slidesToScroll: 2 }" />

<!-- After -->
<PhotoCarousel :photos="photos" loop :slides-to-scroll="2" />
```
