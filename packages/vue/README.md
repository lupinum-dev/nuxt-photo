# @nuxt-photo/vue

Vue composables, primitives, and stable injection keys for Nuxt Photo.

Use this package when you need custom lightbox UI, lower-level integration than the recipe components, or direct access to the Vue bindings without the Nuxt module.

## Install

```bash
pnpm add @nuxt-photo/vue
```

## Example

`useLightboxProvider()` is the advanced entrypoint for custom lightbox components.

```ts
import { useLightboxProvider, type PhotoItem } from '@nuxt-photo/vue'

const photos: PhotoItem[] = [
  { id: 'desert', src: '/photos/desert.jpg', width: 1280, height: 800 },
  { id: 'ocean', src: '/photos/ocean.jpg', width: 960, height: 1200 },
]

const lightbox = useLightboxProvider(photos, {
  transition: 'auto',
})
```

It creates the shared lightbox context that Vue primitives consume.

## Public surface

The root entrypoint exports:

- composables like `useLightbox`, `useLightboxProvider`, `useContainerWidth`, and `responsive`
- primitives like `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `PhotoTrigger`, and `PhotoImage`
- stable injection keys like `LightboxComponentKey`, `ImageAdapterKey`, `LightboxDefaultsKey`, and `PhotoGroupContextKey`

## Stability

Use the root `@nuxt-photo/vue` entrypoint for both normal usage and advanced customization.

Undocumented exports and generated deep paths are internal.

## Where next

- [Root documentation](../../README.md)
- [Documentation site](https://nuxt-photo.lupinum.com/docs/composables/use-lightbox-provider)
