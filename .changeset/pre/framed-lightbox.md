---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Hang each lightbox photo in a mat, like a framed print, with its caption directly underneath instead of over the photo. Set the mat with `--np-frame-inset-top`, `--np-frame-inset-bottom`, and `--np-frame-inset-inline` on any lightbox root. The lightbox then publishes where the photo is drawn as `--np-frame-x`, `--np-frame-y`, `--np-frame-width`, and `--np-frame-height`, so custom and Tailwind lightboxes can anchor captions and arrows to the photo. The included theme adds icon buttons on dark glass that stay readable over any photo, arrows beside the photo, and a soft glow of the photo's colors behind it (`--np-ambient-opacity: 0` turns it off). The new `LightboxAmbient` primitive draws that glow and crossfades to the next photo only after its image has loaded, so custom lightboxes get the same smooth backdrop. Visible lightbox controls no longer force `pointer-events: auto`, so a full-screen controls layer stays click-through.
