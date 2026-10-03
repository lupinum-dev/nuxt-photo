---
name: nuxt-photo
description: Build, customize, migrate, or debug photo galleries with Nuxt Photo (@lupinum/nuxt-photo) in Nuxt or Vue apps. Use when adding a photo album, gallery, lightbox, or carousel; rendering Photo, PhotoAlbum, PhotoGroup, or PhotoCarousel; mapping CMS or API images to PhotoItem; configuring @nuxt/image, Cloudinary, or a custom image adapter; tuning responsive layouts, SSR, or layout shift; styling with CSS variables or Tailwind; customizing or replacing the lightbox; or fixing a Nuxt Photo error.
---

# Nuxt Photo

Add or fix photo albums, a lightbox, and carousels with Nuxt Photo without
guessing at its contract. The installed types describe every prop, and errors
name their fix; read them first.

## Workflow

1. Inspect the app: package manager, Nuxt version, `nuxt.config`, where photo
   data comes from, and whether `@nuxt/image` is installed.
2. Pick the smallest component that does the job:
   - `<PhotoAlbum>` for a gallery in rows, columns, or masonry (lightbox on).
   - `<Photo>` for one image; add `lightbox` to open it.
   - `<PhotoGroup :photos="all">` around albums and photos that share one
     lightbox order.
   - `<PhotoCarousel>` for horizontal browsing; add `:lightbox="true"`.
   - `LightboxProvider`, `PhotoTrigger`, and primitives only when the design
     needs your own thumbnail layout or lightbox markup.
3. Map every record to `PhotoItem` once, where the data enters the app.
4. Change the look with props, CSS variables, and `Lightbox` slots before you
   build from primitives.
5. Run the app's typecheck and build, and open the page when a browser is
   available: photos keep their shape while loading, the lightbox opens, arrows
   navigate, `Escape` returns focus to the thumbnail.

## Rules that break galleries

- Every photo needs a stable string `id`, a `src`, and the real pixel `width`
  and `height` of the image file. Never invent sizes and never use the array
  index as `id`. If the data has no size, read it from the CMS, the image
  service, or at upload on the server, or ask the user.
- Install the beta as `@lupinum/nuxt-photo@next` while npm `latest` is 0.2.
- In Nuxt, import from `@lupinum/nuxt-photo/app` or use auto-imports. Import
  `@lupinum/vue-photo` only in plain Vue apps.
- Use `css: 'all'` for the included look. `'structure'` (default) has no colors;
  the app must style the lightbox. Never use `'none'` without replacing all
  structural CSS.
- `lightbox` is read once at mount. To change it later, change the component
  `key` too. Use `:lightbox="false"`, not `lightbox="false"`.
- Inside `PhotoGroup`, every shown photo must be in the group's `photos`.
- Image adapters must return the same URL on server and client: sign URLs
  before rendering, never with `Date.now()` or random values in the adapter.
- A custom lightbox passed to `:lightbox` or `LightboxComponentKey` must not call
  `provideLightbox()`; the gallery already provides it.
- Nuxt 4 files live under `app/`: `app/components`, `app/plugins`, `app/utils`.

## References

Read only what the task needs. They are generated from the docs site.

- `references/gallery-basics.md`: install, first album, `PhotoItem`, CMS
  mapping, image sizes, validation, and shared lightbox order.
- `references/customization.md`: responsive layouts and SSR, image delivery
  with Nuxt Image and Cloudinary, custom adapters, CSS variables and Tailwind,
  and lightbox slots.
- `references/troubleshooting.md`: every error message with its fix, visible
  symptoms, and known limits.

For anything else, such as the carousel, programmatic control, primitives, or
exact prop tables, fetch the page from the docs:

- Index of all pages: https://nuxt-photo.lupinum.com/llms.txt
- One page as Markdown: `https://nuxt-photo.lupinum.com/raw/docs/<section>/<page>.md`,
  for example `/raw/docs/guides/control-the-lightbox.md` or
  `/raw/docs/reference/photo-carousel.md`.
