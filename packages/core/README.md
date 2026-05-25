# @nuxt-photo/core

Framework-free photo data, layout, image, geometry, viewer, and transition utilities for Nuxt Photo.

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

The root entrypoint intentionally stays focused on framework-free photo primitives:

- shared types like `PhotoItem`, `AlbumLayout`, `PanState`, and `ZoomState`
- photo normalization and responsive value helpers
- album layout functions for rows, columns, and masonry
- image adapter and image-load helpers
- geometry, viewer, gesture, and transition-planning helpers

Debug, DOM locking, environment, animation, and package-internal runtime helpers are not exported from this root entrypoint.

## Where next

- [Root documentation](https://github.com/lupinum-dev/nuxt-photo#readme)
- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/introduction)
