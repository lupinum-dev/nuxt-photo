# @nuxt-photo/nuxt

Nuxt module for Nuxt Photo.

Install this package when you want the default Nuxt experience: auto-registered components, auto-imported helpers, and CSS wiring from one module entry.

## Install

```bash
pnpm add @nuxt-photo/nuxt
```

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

## What it provides

- auto-registered recipe components like `<PhotoAlbum>` and `<PhotoGroup>`
- opt-in primitive auto-registration for advanced lightbox composition
- auto-imported `useLightbox`, `useLightboxProvider`, and `responsive`
- optional `@nuxt/image` integration
- structure-only or full-theme CSS loading

## Optional `@nuxt/image`

Add `@nuxt/image` when you want provider-backed image rendering and generated `srcset` values:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt', '@nuxt/image'],
})
```

Module order does not matter. Nuxt Photo detects Nuxt Image after configured
modules finish installing.

## Where next

- [Root documentation](https://github.com/lupinum-dev/nuxt-photo#readme)
- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/installation)
