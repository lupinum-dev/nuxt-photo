# Troubleshooting

## Common Symptoms

| Symptom                                                  | Likely cause                                                                           | Fix                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Gallery collapses or shifts after load                   | Missing/wrong `width` and `height`, or `css: 'none'` without replacement structure CSS | Use real intrinsic dimensions and keep `css: 'structure'` or `css: 'all'`.                                                    |
| Lightbox opens at wrong frame                            | Thumbnail dimensions or refs do not match the rendered image                           | Fix `PhotoItem` dimensions; use `PhotoGroup` `trigger()` for custom layouts; pass through `hidden` in custom thumbnail slots. |
| `nuxtPhoto.image.provider = 'nuxt-image'` throws         | `@nuxt/image` is not installed or not listed in `modules`                              | Install `@nuxt/image` and list it before `@nuxt-photo/nuxt`, or use provider `auto` / `native`.                               |
| Direct import from `@nuxt-photo/vue` fails under pnpm    | App does not declare the package it imports                                            | Add the directly imported sibling package to app dependencies.                                                                |
| Custom recipe lightbox has no photos or duplicated state | It calls `useLightboxProvider()` even though recipe already created the provider       | Remove the provider call in components passed to `:lightbox` or `LightboxComponentKey`.                                       |
| Custom thumbnail ignores Nuxt Image/provider config      | Slot renders raw `<img>`                                                               | Render `<PhotoImage>` in the slot or accept that raw `<img>` bypasses the adapter.                                            |
| Hydration mismatch with signed image URLs                | Adapter signs URLs during render with time/random state                                | Pre-sign before render and store deterministic URLs on the photo.                                                             |
| Carousel autoplay behaves oddly                          | Both `autoplay` prop and user Autoplay plugin are supplied                             | Use only one autoplay path.                                                                                                   |

## Checks Before Editing

Inspect:

```bash
cat package.json
rg "nuxtPhoto|@nuxt-photo|@nuxt/image|PhotoAlbum|PhotoGroup|PhotoCarousel|useLightboxProvider" .
```

In Nuxt apps, check whether imports are auto-imported or explicit. If explicit imports use `@nuxt-photo/vue`, `@nuxt-photo/vue`, or `@nuxt-photo/vue`, the app should list that package directly.

## Verification Commands

Use the app's package manager. Common commands are shown with pnpm syntax; translate them for npm, yarn, or bun projects before running:

```bash
pnpm install
pnpm exec nuxi prepare
pnpm exec vue-tsc -p .nuxt/tsconfig.app.json --noEmit
pnpm build
```

For this monorepo:

```bash
pnpm build:docs
pnpm --filter nuxt-photo-docs exec vue-tsc -p .nuxt/tsconfig.app.json --noEmit
pnpm test:unit
```

Run browser verification when UI behavior changed: open the page, click a thumbnail, navigate next/previous, close with `Esc`, check mobile width, and confirm no obvious layout jump.

## Data Validation

Recipe components validate photo data before layout. In development, invalid photos throw. In production, invalid items are dropped to keep layout math safe. If photos disappear only in production, check for missing `id`, `src`, `width`, or `height`.

Bad:

```ts
const photos = apiPhotos.map((photo, index) => ({
  id: index,
  src: photo.url,
  width: 100,
  height: 100,
}))
```

Better:

```ts
const photos = apiPhotos.map((photo) => ({
  id: photo.id,
  src: photo.url,
  width: photo.width,
  height: photo.height,
  alt: photo.alt ?? undefined,
}))
```

## Decision Checklist

Before finishing a Nuxt Photo change:

- Confirm every photo has real dimensions.
- Confirm the chosen component is the shallowest layer that satisfies the request.
- Confirm module CSS mode matches the styling plan.
- Confirm direct package imports are declared dependencies.
- Confirm SSR-sensitive adapter output is deterministic.
- Confirm any custom lightbox follows the provider rule for its composition pattern.
- Confirm relevant typecheck/build/browser checks were run or explain why not.
