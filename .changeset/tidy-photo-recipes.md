---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Use `lightbox: { component, transition, navigation }` for recipe lightbox options. Bare components and top-level transition/navigation props are removed. A PhotoGroup owns its children's lightbox options.

Replace individual class props with the per-recipe `ui` object, and carousel visibility flags with `controls`. Use `priority` instead of `loading`. Photo now supports `validation="drop"` and reports invalid photos. PhotoItem dimensions are optional in TypeScript but must be provided or resolved at runtime.

The root exports now match the public contract. `provideLightbox`, container measurement and responsive resolution helpers, and internal controller/renderer types are no longer exported; use LightboxProvider and useLightbox for custom composition.
