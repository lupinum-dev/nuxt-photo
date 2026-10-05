---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Change image delivery so every image downloads at the size it is shown, without waiting while scrolling.

- `definePhotoProvider({ url })` connects any image service. In Nuxt, `nuxtPhoto.provider` or a component's `provider` prop names a Nuxt Image provider; without Nuxt Image, images use the photo's own `src`.
- Nuxt Image's `image` config owns quality, format, `screens` and `densities`. The library builds `srcset` from them (on Vercel from `screens` only, so every width is accepted), never wider than the source file, from 128 px up.
- The layout writes `sizes` from the real thumbnail width, already exact in the server HTML. `Photo` takes a `sizes` prop for photos that are not full width.
- `priority` loads the first images first and preloads them during server rendering, at most six per page.
- Images start loading 1.5 screens before they scroll into view, in every browser, and frames show a placeholder colour until the image arrives.
- IPX serves WebP by default and a small blurred preview while each photo loads. GIFs keep their animation, SVGs are served unchanged, and URL-encoded local paths work.

Local files in Nuxt:

- `localImages: true` reads `width` and `height` of files in `public/` at build time and during `nuxt dev`, so photos from there need no dimensions. It is off by default because the table ships to the browser.
- `usePhotoFolder(folder)` lists one folder of `public/` and sends only that folder in the page payload.
- With the optional `sharp` peer, local photos get build-time blurred previews and an average colour.
