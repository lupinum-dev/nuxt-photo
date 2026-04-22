# @nuxt-photo/nuxt

Nuxt module for Nuxt Photo.

Install this package when you want the default Nuxt experience: auto-registered components, prefixed auto-imported helpers, and CSS wiring from one module entry.

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
- auto-registered primitives like `<LightboxRoot>` and `<PhotoImage>`
- auto-imported `useNuxtPhotoLightbox`, `useNuxtPhotoLightboxProvider`, and `nuxtPhotoResponsive`
- optional `@nuxt/image` integration
- structure-only or full-theme CSS loading

## Optional `@nuxt/image`

Add `@nuxt/image` when you want provider-backed image rendering and generated `srcset` values:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
})
```

## Where next

- [Root documentation](../../README.md)
- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/installation)
