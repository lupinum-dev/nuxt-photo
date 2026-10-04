---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Reduce PhotoImage bundles by resolving translations only in label consumers and keeping config validation and collection duplicate tracking out of the primitive's imports. Configuration precedence, reactive locale changes and image validation remain unchanged.
