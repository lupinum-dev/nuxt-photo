<p align="center">
  <img src="https://raw.githubusercontent.com/lupinum-dev/nuxt-photo/main/docs/public/icon.png" width="128" alt="Nuxt Photo icon">
</p>

<h1 align="center">@lupinum/vue-photo</h1>

<p align="center">Photo albums, carousels and a lightbox for Vue 3, with images sized to the layout.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lupinum/vue-photo"><img src="https://img.shields.io/npm/v/@lupinum/vue-photo?color=42B883" alt="npm version"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml"><img src="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <a href="https://discord.lupinum.com"><img src="https://img.shields.io/badge/Discord-join%20the%20chat-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

> [!WARNING]
> Vue Photo 1.0 is in beta. Install it from the `next` npm tag.

## Purpose

Use this package in plain Vue applications. Nuxt applications install
[`@lupinum/nuxt-photo`](https://www.npmjs.com/package/@lupinum/nuxt-photo)
instead, which registers the same components.

## Requirements

- Node.js 22.18 or 24.11 and later maintenance releases
- Vue 3.5 or later
- The pixel width and height of each photo

## Installation

```bash
pnpm add @lupinum/vue-photo@next
```

## Quick start

```vue
<script setup lang="ts">
import { PhotoAlbum, type PhotoItem } from '@lupinum/vue-photo'
import '@lupinum/vue-photo/styles.css'

const photos: PhotoItem[] = [
  { id: 'one', src: '/one.jpg', width: 1200, height: 800, alt: 'First photo' },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Selecting a photo opens the lightbox. Set labels, lightbox options and an image
provider for the whole app once with `app.use(createPhoto({ ... }))`.

## Exports

- Components: `Photo`, `PhotoAlbum`, `PhotoGroup`, `PhotoCarousel`, `Lightbox`,
  and the lightbox building blocks such as `LightboxProvider`, `LightboxRoot`,
  `PhotoTrigger` and `PhotoImage`.
- Functions: `createPhoto`, `definePhotoProvider`, `validatePhotos`,
  `responsive`, `useLightbox` and `usePhotoLabels`.
- Types such as `PhotoItem`, `GalleryHandle` and `PhotoProvider`, and the
  stylesheet `@lupinum/vue-photo/styles.css`.

Import from the package root only. Generated files and deep imports are internal.

## Agent setup

`@lupinum/vue-photo` ships its documentation inside the package for coding
agents such as Claude Code, Codex and Cursor. The pages match the installed
version, so an agent does not follow the website for a different version.

To set it up, give your coding agent this task:

```text
Set up @lupinum/vue-photo for coding agents as described under "Agent setup" in its README.
```

### Steps for the agent

1. Find `node_modules/@lupinum/vue-photo/dist/agent/AGENTS.md`. Look in the
   directory of the project that depends on `@lupinum/vue-photo` first, then
   in its parent directories up to the repository root (workspaces can hoist
   packages). Read it; it lists the documentation pages.
2. Add the section below to the project's agent instructions: `AGENTS.md`, or
   `CLAUDE.md` if the project has only that file. If it has neither, create
   `AGENTS.md`. Write the path relative to the repository root, through
   `node_modules/@lupinum/vue-photo` (for example
   `apps/web/node_modules/@lupinum/vue-photo/...` in a workspace). Never write
   a resolved path such as `node_modules/.pnpm/...`: it contains the version and
   breaks after an upgrade. If a section for `@lupinum/vue-photo` already
   exists, leave it as it is.

   Use the path you found in place of the sample path:

   ```md
   ## @lupinum/vue-photo

   Before you change code that uses @lupinum/vue-photo, read
   `node_modules/@lupinum/vue-photo/dist/agent/AGENTS.md` and the pages it
   lists. They document the installed version. Prefer them over what you
   remember about this package and over the website.
   ```

3. Do not copy the documentation into the project and do not install a skill.
   The section points into the installed package, so it stays correct after
   every upgrade or downgrade.

If the file does not exist, the installed version has no packaged
documentation. Read the package README and its TypeScript types instead.

## Documentation

Read the [Vue API documentation](https://nuxt-photo.lupinum.com/docs/reference/composables) and the [root README](https://github.com/lupinum-dev/nuxt-photo#readme).

## Support and security

Use [GitHub issues](https://github.com/lupinum-dev/nuxt-photo/issues) or the [Lupinum OSS Discord](https://discord.lupinum.com) for support. Report vulnerabilities through the [private security process](https://github.com/lupinum-dev/nuxt-photo/security/policy).

## License

Released by [Lupinum OG](https://lupinum.com) under the [MIT License](https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE).
