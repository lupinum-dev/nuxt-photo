---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Fix `createPhoto` options having no effect in the Vite dev server of a plain Vue app: the package now ships compiled JavaScript components instead of `.vue` files.

Vite no longer needs `optimizeDeps: { exclude: ['@lupinum/vue-photo'] }`; you can delete that line. Public export names and stylesheet paths stay the same.

Remove the internal entries `@lupinum/vue-photo/viewer-structure` and `@lupinum/vue-photo/viewer-themed`. Only `@lupinum/nuxt-photo` of the same version used them; it now generates the viewer host itself, so Nuxt apps change nothing. They were never public API: if your app imported one, import `@lupinum/vue-photo/viewer` and the stylesheet `@lupinum/vue-photo/styles/lightbox-structure.css` (plus `lightbox-theme.css` for the full look) instead.
