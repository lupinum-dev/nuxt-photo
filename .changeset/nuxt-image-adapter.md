---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Thumbnails and lightbox slides now request leaner, correct files through Nuxt Image:

- The thumbnail `quality` setting is applied. Before, it was ignored, and Vercel served thumbnails at quality 100.
- Images are never requested wider than the original photo, and providers that round widths no longer produce duplicate `srcset` entries.
- IPX serves WebP by default. Set `image.format` to `'avif'`, or to `'auto'` to leave the format to the provider. Providers that choose the format themselves, such as Vercel, are unchanged.
- IPX shows a tiny blurred preview while each photo loads. Turn it off with `image.placeholder: false`, or on for other providers with `true`. A photo's own `placeholderSrc` always wins.
- Local paths that are already URL-encoded, such as `/photos/my%20trip.jpg`, no longer return 404.
- New `image.thumb.widths` sets the thumbnail file widths.
- Invalid module options, such as arrays where a string is expected, now fail with a clear error.

**Breaking:** `image.thumb.sizes` is now a standard HTML `sizes` string, for example `'(max-width: 768px) 100vw, 400px'`. The old `'sm:100vw lg:400px'` form fails with a message that shows the new form. `image.slide.maxDensity` is removed, because slides are now always capped at the original photo width.
