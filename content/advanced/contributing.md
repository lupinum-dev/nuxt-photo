---
title: Contributing
description: Development setup, testing, and build pipeline.
navigation: true
---

# Contributing

## Prerequisites

- **Node.js** >= 18
- **pnpm** (workspace manager)

## Setup

```bash
# Clone the repository
git clone https://github.com/your-org/nuxt-photo.git
cd nuxt-photo

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development

```bash
# Watch mode for all packages
pnpm dev

# Run the main playground (Nuxt app with all features)
pnpm dev:playground

# Run the Tailwind playground
pnpm dev:playground-tw
```

The playgrounds are full Nuxt applications that demonstrate all features. They're the best way to develop and test changes.

### Playground Pages

| Page          | What it demonstrates                                  |
| ------------- | ----------------------------------------------------- |
| `/`           | Basic gallery with rows layout                        |
| `/layouts`    | All four layout types with parameter controls         |
| `/headless`   | PhotoGroup patterns, programmatic open, headless mode |
| `/nuxt-image` | `@nuxt/image` integration                             |

## Project Structure

```
packages/
├── core/          # Framework-free algorithms and types
├── vue/           # Vue composables and primitives
├── recipes/       # Ready-to-use components and styles
└── nuxt/          # Nuxt module
playground/        # Main demo app
playground-tailwind/ # Tailwind-styled demo
test/
└── fixtures/      # Shared test helpers (photo generators)
```

## Testing

```bash
# Run all tests
pnpm test

# Unit tests only (Vitest)
pnpm test:unit

# E2E tests only (Playwright)
pnpm test:e2e

# Verify Nuxt module exports
pnpm test:module-package
```

### Unit Tests

Unit tests use **Vitest** with environment-aware configuration:

- **Core tests** run in `node` environment (no DOM needed)
- **Vue and Recipes tests** run in `jsdom` environment

Test files are in `packages/*/test/`:

| Package | Tests                                                                                    |
| ------- | ---------------------------------------------------------------------------------------- |
| Core    | Layout algorithms, responsive helpers, geometry, transitions, photo adapters, collection |
| Vue     | Gesture handling, pan/zoom, primitive component guards, public API exports               |
| Recipes | Component contracts, SSR rendering                                                       |
| Nuxt    | Module setup and configuration                                                           |

### E2E Tests

E2E tests use **Playwright** with Chromium:

```bash
# Build playground first, then run tests
pnpm test:e2e
```

Tests are in `playground/tests/e2e/` and cover:

- Gallery rendering and lightbox interaction
- Layout switching between all four types
- Headless mode and programmatic control
- `@nuxt/image` integration

### Test Fixtures

Shared test helpers in `test/fixtures/photos.ts`:

```ts
import {
  makePhoto,
  createPhotoSet,
  createPlainPhotoSet,
} from '../../test/fixtures/photos'

// Single photo with specified dimensions
const photo = makePhoto({ width: 1600, height: 900 })

// Set of photos with varying aspect ratios
const photos = createPhotoSet(10)
```

## Build Pipeline

```bash
# Build all packages (order matters due to dependencies)
pnpm build
```

The build order follows the dependency graph: core → vue → recipes → nuxt.

| Package | Build tool          | Output                                    |
| ------- | ------------------- | ----------------------------------------- |
| Core    | Unbuild (rollup)    | Single bundled `.mjs` + `.d.ts`           |
| Vue     | Unbuild (mkdist)    | Directory structure preserved             |
| Recipes | Unbuild (mkdist)    | Directory structure preserved + CSS files |
| Nuxt    | Nuxt Module Builder | `module.mjs` + `module.d.mts`             |

## Code Style

- TypeScript strict mode
- No explicit `any` in public APIs (internal use is okay)
- Vue components use `<script setup>` with `defineProps` and `withDefaults`
- CSS uses the `np-` prefix for all class names
- CSS custom properties use the `--np-` prefix

## Static Checks

```bash
pnpm lint
pnpm typecheck
pnpm format:check
```
