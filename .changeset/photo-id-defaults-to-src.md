---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change `PhotoItem.id` to optional: a photo without `id` uses its `src`. An explicit `id` still wins, and deep links, `v-model:active`, `openById()` and `data-np-photo-id` use the resolved ID. Two photos with the same resolved ID raise a `duplicate-id` issue that names both photos' `src`; give each of them an `id`.

Remove the `missing-id` validation code. Add the `ResolvedPhotoItem` type: every photo handed back (slot props, `activePhoto`, `useLightbox().photos`, `validatePhotos()`) has `id: string`.

Migration: replace a check for the `missing-id` code with nothing, since photos without `id` are now valid. Where two photos share a `src`, give each an `id`. Type values you read back from components as `ResolvedPhotoItem` when you need `id: string`.
