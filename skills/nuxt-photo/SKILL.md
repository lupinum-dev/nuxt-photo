---
name: nuxt-photo
description: Build, customize, migrate, or debug Nuxt Photo galleries in Nuxt apps. Use when Codex needs to install @nuxt-photo/nuxt, render Photo, PhotoAlbum, PhotoGroup, or PhotoCarousel, map CMS data to PhotoItem, configure @nuxt/image or native image loading, write a custom image adapter, tune responsive/SSR/CLS behavior, customize or replace the lightbox, or fix Nuxt Photo usage issues.
---

# Nuxt Photo

Use this skill to add or fix Nuxt Photo in a Nuxt 4 app without guessing at the library contract.

## Core Workflow

1. Inspect the target app first: package manager, Nuxt version, `nuxt.config`, existing image/CMS pipeline, and whether `@nuxt/image` is already used.
2. Pick the smallest working layer:
   - Use `<PhotoAlbum>` for normal galleries.
   - Use `<PhotoGroup :photos="photos">` when several recipe components should share one explicit lightbox collection.
   - Use `<PhotoCarousel>` for horizontal swipeable galleries.
   - Use primitives for custom thumbnail layouts or when the default recipe UI cannot satisfy the design.
3. Normalize all data to `PhotoItem`: every rendered photo needs stable `id`, `src`, real intrinsic `width`, and real intrinsic `height`.
4. Prefer module defaults unless the app has a concrete reason to change them. The default CSS mode is `structure`; use `css: 'all'` for a styled first result.
5. Verify with the app's normal checks. At minimum, run the relevant typecheck/build path and manually inspect the gallery if a browser target is available.

## References

Read only what the task needs:

- `references/gallery-basics.md`: installation, module config, `PhotoItem`, recipe components, and minimal examples.
- `references/customization.md`: CSS strategy, image providers, custom adapters, lightbox replacement, responsive tuning, SSR/CLS.
- `references/troubleshooting.md`: common agent mistakes, symptoms, and verification commands.

If this skill lives inside the Nuxt Photo repo, treat `docs/content/docs/**` and `packages/**/src` as the source of truth when a detail appears stale.

## Implementation Rules

- Do not invent dimensions. If source data lacks width/height, derive them from the image pipeline, CMS metadata, upload processing, or ask the user.
- Do not use array indexes as `PhotoItem.id` for dynamic lists.
- Do not add direct sibling dependencies unless app code imports them directly:
  - Common app imports can come from `@nuxt-photo/nuxt`.
  - Direct imports from `@nuxt-photo/vue`, `@nuxt-photo/vue`, or `@nuxt-photo/vue` require that package in the app's own dependencies.
- Do not set `nuxtPhoto.css: 'none'` unless the app provides a complete replacement for structure CSS.
- Do not call `useLightboxProvider()` inside a recipe lightbox override passed through `:lightbox` or `LightboxComponentKey`; the recipe already owns that provider.
- Do not generate nondeterministic adapter URLs during SSR render. Pre-sign URLs before rendering or store signed URLs on the `PhotoItem`.
