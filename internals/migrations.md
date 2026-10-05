# Temporary compatibility

## Nuxt Module Builder transformer

- Introduced: 2026-10-05.
- Reason: Module Builder 1.0.3 selects transformer 0.2, but its `mkdist` dependency requires transformer 0.1. Strict peer checks reject that combination.
- Dependent: `@nuxt/module-builder` in the Nuxt package build toolchain; a parent-scoped override retains transformer 0.1.17.
- Remove when Module Builder resolves a transformer version accepted by its `mkdist` peer range and the full verification gate passes without the override.
- Tracking issue: none.

## Nuxt Image internal fetch adapter

- Introduced: 2026-10-05.
- Reason: Image 2.1.0 uses IPX's Node adapter. Internal image fetches during docs social-image prerendering do not complete; Nuxt exits successfully with HTML but no final assets or server output.
- Dependents: the Ginko docs layer and playground. An exact Image 2.0.0 override retains IPX's H3 adapter, including for the layer's transitive dependency.
- Remove when a newer Image adapter completes internal image fetches and the full gate plus styled docs screenshots pass without the override.
- Tracking issue: none.
