---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Honor thumbnail quality and cap thumbnail and slide candidates at the source width. Remove repeated URLs from providers that round widths. Decode pre-encoded local paths once before passing them to Nuxt Image.

Breaking changes: `image.thumb.sizes` now uses an HTML sizes string instead of Nuxt Image shorthand. The `image.slide.maxDensity` option is removed.

Add `image.thumb.widths` to configure thumbnail candidates. Add `image.format`, defaulting to WebP for IPX and ipxStatic; AVIF and auto are also supported. Add `image.placeholder` to control tiny generated placeholders, enabled by default for IPX and ipxStatic. Other providers keep their format behavior and default to no generated placeholder. An explicit photo placeholder always wins.

Reject malformed module options, including non-plain objects, sparse width arrays, and non-string enum values.
