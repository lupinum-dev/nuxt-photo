---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Give every gallery component the same API. `Photo`, `PhotoAlbum`, `PhotoGroup` and `PhotoCarousel` support `v-model:active` with a photo ID, and expose the same `GalleryHandle` (`open`, `openById`, `close`, `isOpen`, `activeId`, `activePhoto`); it replaces `LightboxHandle`. The active photo follows its ID when the collection changes, so removing an earlier photo keeps the same photo open.

Props are renamed and grouped:

- `lightbox` takes an object: `:lightbox="{ component, transition, navigation }"`. Bare components and the top-level `transition` and `navigation` props are removed.
- One `ui` object replaces `imgClass`, `captionClass`, `itemClass`, `slideClass`, `thumbClass` and `controlsClass`.
- `priority` replaces `loading`.
- `PhotoCarousel` takes `controls` (`['arrows', 'thumbnails', 'counter']` by default, add `'dots'`) instead of `showArrows`, `showThumbnails`, `showCounter` and `showDots`, and `loop` and `drag-free` props instead of `options`.
- `PhotoCarousel` drops `direction`: every component reads the direction from `dir` or CSS on the page.
- `Photo` supports `validation="drop"`.

The root entry exports only the public contract. `provideLightbox`, `useLightboxProvider`, `useContainerWidth` and `resolveResponsiveParameter` are removed; build custom compositions with `LightboxProvider` and `useLightbox`.

`PhotoAlbum` emits `end-reached` when its end comes within one screen, for "load more".
