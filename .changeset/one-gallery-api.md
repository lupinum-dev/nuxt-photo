---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Give every gallery component the same API. `Photo`, `PhotoAlbum`, `PhotoGroup` and `PhotoCarousel` support `v-model:active` with a photo ID and expose the same `GalleryHandle` (`open`, `openById`, `close`, `isOpen`, `activeId`, `activePhoto`). The active photo follows its ID when the collection changes, so removing an earlier photo keeps the same photo open.

- `lightbox` takes `true`, `false` or an options object: `{ component, transition, navigation, history, deepLink, tools }`.
- One `ui` object sets classes on each part of a component.
- `priority` loads the first images first.
- `PhotoCarousel` shows the `controls` you list (`['arrows', 'thumbnails', 'counter']` by default, plus `'dots'`) and takes `loop` and `drag-free`.
- Every component reads its direction from `dir` or CSS on the page.
- `Photo` supports `validation="drop"`.
- `PhotoAlbum` emits `end-reached` when its end comes within one screen, for "load more".

The root entry exports the public contract only. Build custom lightboxes with `LightboxProvider` and `useLightbox`.
