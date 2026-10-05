---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Back closes the lightbox. Opening adds a browser history entry; set `lightbox: { history: false }` to turn it off.

- `lightbox.deepLink` puts the open photo in the URL (`?photo=<id>` by default), so a link opens that photo.
- `lightbox.tools` adds `download`, `share` and `fullscreen` buttons, and the `#tools` slot adds your own.
- Only the open slide and one on each side are mounted. The previous and next images load in the background once the open image is shown, except when the visitor saves data.
- Nuxt apps set one custom lightbox for the whole app with a file path: `nuxtPhoto.lightbox.component: '~/components/MyLightbox.vue'`.
