# @nuxt-photo/core

Framework-free layout, geometry, image, transition, and shared type utilities for Nuxt Photo.

Use this package when you want the gallery math and reusable helpers without Vue or Nuxt.

## Install

```bash
pnpm add @nuxt-photo/core
```

## Example

`responsive()` is one of the main public helpers. It lets layout values change with container width without pushing media-query logic into your component code.

```ts
import { responsive } from '@nuxt-photo/core'

const spacing = responsive({
  0: 8,
  640: 12,
  960: 16,
})
```

## Public surface

The root entrypoint exports:

- shared types like `PhotoItem`, `AlbumLayout`, `PanState`, and `ZoomState`
- layout helpers like `responsive` and `resolveResponsiveParameter`
- framework-free layout, geometry, image, viewer, and transition helpers

## Where next

- [Root documentation](../../README.md)
- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/introduction)
