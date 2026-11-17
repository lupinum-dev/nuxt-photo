---
'@lupinum/vue-photo': patch
---

Fix lightbox CSS variables set in app CSS, such as `--np-btn-bg` or `--np-frame-inset-inline` on `.np-lightbox`, losing to the defaults of the lightbox stylesheets. The defaults now have zero specificity, so a rule on `.np-lightbox` wins wherever the lightbox CSS loads.
