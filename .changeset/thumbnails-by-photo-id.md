---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change how the lightbox finds thumbnails: it now looks them up by photo ID.

The lightbox reads a thumbnail's `data-np-photo-id` attribute when it opens or closes, so a thumbnail that re-renders while the lightbox is open is still found. The `PhotoGroup` slot controller replaces `hiddenThumbnailIndex` with `hiddenThumbnailId` and drops `setThumbnailRef`.

Migration: in the `PhotoGroup` default slot, compare `controller.hiddenThumbnailId` with `photo.id` instead of `hiddenThumbnailIndex` with an index, and replace `:ref="controller.setThumbnailRef(index)"` with `:data-np-photo-id="photo.id"` on your thumbnail element.
