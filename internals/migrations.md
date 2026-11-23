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

## Docs theme scrollbar and color-scheme override

- Introduced: 2026-11-23.
- Reason: the docs run on `@lupinum/ginko-docs` 0.4.0-rc.11. It styles scrollbars only with `::-webkit-scrollbar` and sets no `color-scheme` for `.dark`, so Firefox draws light scrollbars on the dark site. Current theme releases set both.
- Dependent: the `color-scheme` and `scrollbar-color` rules at the end of `docs/app/assets/main.css`.
- Remove when the docs use a `@lupinum/ginko-docs` release that sets `color-scheme` and `scrollbar-color` itself (0.17.1 does) and dark-mode screenshots in Firefox show dark scrollbars without the rules.
- Tracking issue: none.
