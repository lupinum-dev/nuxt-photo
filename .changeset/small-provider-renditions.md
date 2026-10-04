---
'@lupinum/nuxt-photo': patch
'@lupinum/vue-photo': patch
---

Include the Vue default widths below the smallest Nuxt Image screen × density for unrestricted providers, so small thumbnails do not start at 640px with default screens. Vercel keeps its strict screens-only allowlist.

Lower the shared Vue ladder floor to 128px for thumbnail strips and small columns. Unrestricted Nuxt providers include that width below their configured screens; Vercel apps must configure a 128px screen to request it.
