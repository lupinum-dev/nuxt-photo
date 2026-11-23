---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change the Nuxt module to load the lightbox CSS with the viewer, not on every page.

The `css` option keeps its meaning: `'structure'` loads the lightbox structure, `'all'` adds its theme, and `'none'` loads neither. A page that opens with a deep-linked photo still has the lightbox CSS in its server HTML. The new entries `@lupinum/nuxt-photo/lightbox.css` and `@lupinum/vue-photo/lightbox.css` hold the lightbox CSS for a lightbox built from primitives. With `components: { primitives: true }` the module still loads the lightbox CSS on every page. `@lupinum/vue-photo/styles.css` is unchanged.

Migration: a Nuxt app that renders lightbox primitives imported from `@lupinum/nuxt-photo/primitives`, without `components: { primitives: true }`, imports `@lupinum/nuxt-photo/lightbox.css` once.
