# @nuxt-photo/nuxt

Nuxt 4 module for Nuxt Photo.

## Install

```bash
pnpm add @nuxt-photo/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

Optional:

```bash
pnpm add @nuxt/image
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
})
```

## What it provides

- auto-registered recipe components like `<PhotoAlbum>` and `<PhotoGroup>`
- auto-imported `useLightbox`, `useLightboxProvider`, and `responsive`
- optional `@nuxt/image` integration
- structure or full theme CSS loading

See the repo README and docs for the full contract and examples.
