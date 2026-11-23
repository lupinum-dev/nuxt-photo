---
'@lupinum/nuxt-photo': patch
---

Fix the dev server answering 500 with `Unknown file extension ".vue"` for a page that renders a photo component, in an app that installed the module from the registry. `nuxt build` was not affected.
