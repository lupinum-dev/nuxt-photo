---
'@lupinum/vue-photo': patch
---

Fix carousel CSS variables set in app CSS, such as `--np-carousel-gap` on `.np-carousel`, losing to the defaults of the carousel stylesheets. The defaults now have zero specificity, like the lightbox defaults.
