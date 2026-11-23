---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Fix `createPhoto` options having no effect in the Vite dev server of a plain Vue app: the package now ships compiled JavaScript components instead of `.vue` files.

Vite no longer needs `optimizeDeps: { exclude: ['@lupinum/vue-photo'] }`; you can delete that line. Export names and stylesheet paths stay the same.
