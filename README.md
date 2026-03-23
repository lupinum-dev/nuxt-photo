# nuxt-photo

`nuxt-photo` is a Nuxt-first photo module for responsive albums, standalone images, and headless lightboxes.

It gives you four distinct building blocks:

- `PhotoImg` for a single image with optional lightbox and caption handling
- `PhotoAlbum` for responsive gallery layouts with a built-in lightbox path
- `PhotoGallery` for custom thumbnail markup backed by the shared lightbox runtime
- `PhotoLightbox` for fully headless, programmatic lightbox control

## Why This Exists

This module is opinionated about the split between layout and lightbox:

- layout belongs in `PhotoAlbum`
- custom thumbnail DOM belongs in `PhotoGallery`
- single-image rendering belongs in `PhotoImg`
- overlay behavior belongs in `PhotoLightbox`

That separation keeps the API smaller and avoids the usual "one component does everything badly" problem.

## Install

```bash
npx nuxt module add nuxt-photo
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
})
```

`@nuxt/image` is optional. When present, `PhotoImage` renders through `NuxtImg`. Without it, the module falls back to a plain `<img>`.

## Quick Start

```vue
<script setup lang="ts">
import type { PhotoItem } from 'nuxt-photo'

const items: PhotoItem[] = [
  {
    src: '/photos/coast.jpg',
    thumbnailSrc: '/photos/coast-thumb.jpg',
    alt: 'Ocean waves meeting a rocky coast',
    caption: 'Coast',
    width: 1600,
    height: 1100,
  },
  {
    src: '/photos/lake.jpg',
    thumbnailSrc: '/photos/lake-thumb.jpg',
    alt: 'Mountain lake with pine trees',
    caption: 'Lake',
    width: 1500,
    height: 1800,
  },
]
</script>

<template>
  <PhotoImg
    src="/photos/hero.jpg"
    thumbnail-src="/photos/hero-thumb.jpg"
    alt="Hero image"
    caption="Hero"
    :width="1600"
    :height="1200"
  />

  <PhotoAlbum
    :items="items"
    layout="masonry"
    :columns="{ 0: 2, 768: 3 }"
    :spacing="{ 0: 8, 768: 12 }"
    :padding="0"
    :image="{ sizes: 'sm:46vw lg:31vw' }"
  />
</template>
```

## Choose The Right Component

### `PhotoImg`

Use it when you have one image and want:

- semantic figure/caption markup
- optional lightbox behavior
- a lightweight thumbnail source separate from the full-size source

### `PhotoAlbum`

Use it when layout is the job:

- justified rows
- balanced columns
- masonry/waterfall columns
- optional built-in lightbox per album

### `PhotoGallery`

Use it when you want to own the thumbnail markup:

- cards
- buttons
- links
- custom overlays
- mixed thumbnail UIs

### `PhotoLightbox`

Use it when the overlay is the primary surface:

- programmatic open/close
- custom controls
- custom slide rendering
- mixed image and non-image slides

## Data Model

The base gallery item is `PhotoItem`:

```ts
interface PhotoItem {
  key?: string | number
  src: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  thumbnailSrc?: string
  href?: string
}
```

For lightbox-only or mixed-content flows, use `LightboxItem`, which supports both image items and custom slides.

## Usage Patterns

### 1. Single image with optional caption and lightbox

`PhotoImg` is the default entry point for standalone images.

```vue
<PhotoImg
  src="/photos/mountain.jpg"
  thumbnail-src="/photos/mountain-thumb.jpg"
  alt="Fog over a mountain valley"
  caption="Mountain Fog"
  description="Morning mist drifting across a quiet alpine valley."
  :width="1600"
  :height="1200"
  caption-visible="both"
/>
```

`caption-visible` accepts:

- `'none'`
- `'below'`
- `'lightbox'`
- `'both'`

The `lightbox` prop accepts:

- `true` for default behavior
- `false` to disable the lightbox
- a `LightboxOptions` object to customize interaction

```vue
<PhotoImg
  src="/photos/waterfall.jpg"
  alt="Waterfall in a mossy gorge"
  :width="1200"
  :height="1200"
  :lightbox="false"
  caption-visible="below"
/>
```

### 2. A few standalone images that share one lightbox

If each thumbnail is still conceptually its own standalone image, `PhotoImg` supports grouping via `group`.

```vue
<template>
  <div class="grid">
    <PhotoImg
      v-for="photo in photos"
      :key="photo.src"
      :src="photo.src"
      :thumbnail-src="photo.thumbnailSrc"
      :alt="photo.alt"
      :width="photo.width"
      :height="photo.height"
      group="portfolio"
    />
  </div>
</template>
```

Recommendation: use `group` only for simple shared-lightbox behavior across otherwise independent images. If you want custom thumbnail DOM or a more deliberate gallery surface, use `PhotoGallery` instead.

### 3. Responsive album layouts

`PhotoAlbum` renders one of three layout modes:

- `rows`: justified rows
- `columns`: balanced columns with variable widths
- `masonry`: equal-width waterfall columns

```vue
<script setup lang="ts">
import type { PhotoItem } from 'nuxt-photo'

const items: PhotoItem[] = [
  {
    src: '/photos/coast.jpg',
    thumbnailSrc: '/photos/coast-thumb.jpg',
    alt: 'Ocean waves meeting a rocky coast',
    caption: 'Coast',
    width: 1600,
    height: 1100,
  },
  {
    src: '/photos/lake.jpg',
    thumbnailSrc: '/photos/lake-thumb.jpg',
    alt: 'Mountain lake with pine trees',
    caption: 'Lake',
    width: 1500,
    height: 1800,
  },
]
</script>

<template>
  <PhotoAlbum
    :items="items"
    layout="masonry"
    :columns="{ 0: 2, 768: 3, 1280: 4 }"
    :spacing="{ 0: 8, 768: 12, 1280: 16 }"
    :padding="0"
    :target-row-height="{ 0: 180, 768: 220, 1280: 260 }"
    :image="{
      sizes: 'sm:46vw md:31vw xl:23vw',
    }"
  />
</template>
```

Responsive props accept either a single value or a breakpoint map:

- `columns`
- `spacing`
- `padding`
- `targetRowHeight`

`rowConstraints` is available for `rows` layouts when you need more control over justified rows.

### 4. Controlled album lightbox

`PhotoAlbum` supports `v-model:lightbox-index`, which is the cleanest way to open or close an album lightbox from outside the component.

```vue
<script setup lang="ts">
const lightboxIndex = ref<number | null>(null)
</script>

<template>
  <button type="button" @click="lightboxIndex = 0">
    Open first
  </button>

  <button type="button" @click="lightboxIndex = null">
    Close
  </button>

  <PhotoAlbum
    v-model:lightbox-index="lightboxIndex"
    :items="items"
    layout="rows"
    :spacing="{ 0: 8, 768: 12 }"
    :padding="0"
    :target-row-height="{ 0: 180, 768: 220 }"
  />
</template>
```

Album events:

- `click`
- `update:lightbox-index`
- `lightbox-open`
- `lightbox-close`

`PhotoAlbum` uses the same `lightbox` contract as `PhotoImg`:

- `true` for defaults
- `false` to disable the lightbox entirely
- a `LightboxOptions` object for per-album behavior

### 5. Custom album photo rendering

When you still want the album layout engine but need to control each thumbnail, use the `#photo` slot.

Use `PhotoImage` inside custom slots when you want to preserve the module's `NuxtImg` vs `<img>` switching behavior.

```vue
<PhotoAlbum
  :items="items"
  layout="masonry"
  :columns="{ 0: 2, 768: 3 }"
  :spacing="{ 0: 10, 768: 12 }"
  :padding="0"
>
  <template #photo="{ item, imageProps, layout, open, selected }">
    <button
      class="photo-card"
      type="button"
      :data-selected="selected"
      @click="open"
    >
      <PhotoImage v-bind="imageProps" />
      <span class="photo-card__overlay">
        <strong>{{ item.caption || item.alt }}</strong>
        <span>{{ layout.mode }} #{{ layout.index + 1 }}</span>
      </span>
    </button>
  </template>
</PhotoAlbum>
```

If you do not need custom markup, prefer `photo-class` and `image-class` over replacing the slot. Less code, less surface area to maintain.

### 6. Custom thumbnail galleries

`PhotoGallery` is the right API when the thumbnail layer is fully custom.

The important piece is `bindThumbnail`, which lets the lightbox resolve the source element for open/close transitions.

```vue
<script setup lang="ts">
import type { LightboxItem } from 'nuxt-photo'

const items: LightboxItem[] = [
  {
    type: 'image',
    src: '/photos/coast.jpg',
    msrc: '/photos/coast-thumb.jpg',
    alt: 'Ocean waves meeting a rocky coast',
    caption: 'Coast',
    width: 1600,
    height: 1100,
  },
  {
    type: 'image',
    src: '/photos/lake.jpg',
    msrc: '/photos/lake-thumb.jpg',
    alt: 'Mountain lake with pine trees',
    caption: 'Lake',
    width: 1500,
    height: 1800,
  },
]
</script>

<template>
  <PhotoGallery :items="items">
    <template #thumbnail="{ item, index, open, bindThumbnail }">
      <button
        :ref="bindThumbnail"
        class="thumb"
        type="button"
        @click="open"
      >
        <img
          v-if="item.type !== 'custom'"
          :src="item.msrc || item.src"
          :alt="item.alt || ''"
        >
        <span>{{ index + 1 }}</span>
      </button>
    </template>
  </PhotoGallery>
</template>
```

Gallery events:

- `open`
- `close`
- `change`
- `destroy`

### 7. Headless lightbox with custom controls

`PhotoLightbox` is the lowest-level UI component. It owns the runtime and DOM binding, but not the chrome.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { LightboxItem } from 'nuxt-photo'

const lightbox = ref<{
  open: (index?: number) => boolean | undefined
  close: () => void
  setUiVisible: (isVisible: boolean) => void
} | null>(null)

const items: LightboxItem[] = [
  {
    type: 'image',
    src: '/photos/coast.jpg',
    msrc: '/photos/coast-thumb.jpg',
    alt: 'Ocean waves meeting a rocky coast',
    width: 1600,
    height: 1100,
  },
  {
    type: 'custom',
    id: 'credits',
    width: 1200,
    height: 800,
    title: 'Credits',
  },
]
</script>

<template>
  <button type="button" @click="lightbox?.open(0)">
    Open lightbox
  </button>

  <PhotoLightbox
    ref="lightbox"
    :items="items"
    :options="{
      openAnimation: 'fade',
      closeAnimation: 'fade',
      preload: [1, 1],
    }"
  >
    <template #controls="{ close, prev, next, setUiVisible, state }">
      <div v-if="state.isOpen.value" class="controls">
        <button type="button" @click="prev()">Prev</button>
        <span>{{ state.currIndex.value + 1 }} / {{ state.totalItems.value }}</span>
        <button type="button" @click="next()">Next</button>
        <button type="button" @click="setUiVisible(!state.uiVisible.value)">
          Toggle UI
        </button>
        <button type="button" @click="close()">Close</button>
      </div>
    </template>

    <template #slide="{ item, isActive }">
      <article v-if="item.type === 'custom'" :data-active="isActive">
        {{ item.title }}
      </article>
    </template>
  </PhotoLightbox>
</template>
```

Exposed methods on the component ref:

- `open(index?, options?, sourceElement?, initialPointerPos?)`
- `close()`
- `setUiVisible(isVisible)`

### 8. Lightbox controls slot on every higher-level API

You do not need to drop down to `PhotoLightbox` just to replace controls.

The `controls` slot is available on:

- `PhotoImg`
- `PhotoAlbum`
- `PhotoGallery`
- `PhotoLightbox`

```vue
<PhotoAlbum :items="items" layout="masonry">
  <template #controls="{ close, next, prev, state }">
    <div v-if="state.isOpen.value" class="toolbar">
      <button type="button" @click="prev()">Prev</button>
      <span>{{ state.currIndex.value + 1 }} / {{ state.totalItems.value }}</span>
      <button type="button" @click="next()">Next</button>
      <button type="button" @click="close()">Close</button>
    </div>
  </template>
</PhotoAlbum>
```

### 9. Advanced layout composables

If you need a fully custom album renderer without giving up the layout engine, use `usePhotoAlbumLayout`.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoItem } from 'nuxt-photo'

const photos = computed<PhotoItem[]>(() => [
  {
    src: '/photos/coast.jpg',
    thumbnailSrc: '/photos/coast-thumb.jpg',
    alt: 'Ocean waves meeting a rocky coast',
    width: 1600,
    height: 1100,
  },
])

const {
  groups,
  containerStyle,
  groupStyle,
  measureRef,
  shouldMeasure,
} = usePhotoAlbumLayout({
  items: () => photos.value,
  layout: () => 'masonry',
  columns: () => ({ 0: 2, 768: 3 }),
  spacing: () => ({ 0: 8, 768: 12 }),
  padding: () => 0,
  image: () => ({ sizes: 'sm:46vw lg:31vw' }),
})
</script>

<template>
  <div>
    <div
      v-if="shouldMeasure"
      ref="measureRef"
      aria-hidden="true"
    />

    <div :style="containerStyle">
      <div
        v-for="group in groups"
        :key="`${group.type}-${group.index}`"
        :style="groupStyle(group)"
      >
        <PhotoImage
          v-for="entry in group.entries"
          :key="entry.item.key ?? entry.index"
          v-bind="entry.imageProps"
        />
      </div>
    </div>
  </div>
</template>
```

`usePhotoLightbox`, `usePhotoGroup`, and `useContainerWidth` are also exported for advanced integrations, but in normal app code the components are usually the better API.

## Image Configuration

The `image` prop configures image rendering behavior. Common fields:

- `preset`
- `sizes`
- `densities`
- `modifiers`
- `provider`
- `fit`
- `loading`
- `decoding`
- `fetchpriority`
- `placeholder`

Example:

```vue
<PhotoAlbum
  :items="items"
  layout="masonry"
  :image="{
    preset: 'galleryThumb',
    sizes: 'sm:46vw lg:23vw',
    fit: 'cover',
    loading: 'lazy',
    placeholder: true,
  }"
/>
```

Recommendation: keep thumbnail concerns in `image`, and keep lightbox source sizing in `nuxtPhoto.lightbox` plus `LightboxOptions` where appropriate.

## Module Configuration

### Feature flags

Feature flags are build-time cutovers, not runtime toggles.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
  nuxtPhoto: {
    features: {
      img: true,
      album: true,
      lightbox: false,
    },
  },
})
```

If a feature is disabled:

- its components are not auto-registered
- its composables are not auto-imported
- its CSS is not injected

There is no compatibility layer. Disabled means removed from the build contract.

### CSS injection

All module CSS is enabled by default.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
  nuxtPhoto: {
    css: {
      img: true,
      album: true,
      lightbox: true,
    },
  },
})
```

Disable everything:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
  nuxtPhoto: {
    css: false,
  },
})
```

### Component prefix

The default auto-import prefix is `Photo`.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
  nuxtPhoto: {
    prefix: 'Media',
  },
})
```

That would register:

- `MediaImg`
- `MediaAlbum`
- `MediaGallery`
- `MediaLightbox`
- `MediaImage`

### Lightbox image generation with `@nuxt/image`

When `@nuxt/image` is installed, lightbox image URLs can be generated through the image provider too.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
  nuxtPhoto: {
    lightbox: {
      preset: 'gallery',
      maxWidth: 2560,
      densities: 'x1 x2',
    },
  },
})
```

Use this when you want:

- constrained full-size lightbox images
- consistent provider/preset behavior
- generated `srcset` for lightbox slides

## Recommendations

- Always provide correct `width` and `height`. Missing or incorrect dimensions force the lightbox to degrade from a clean zoom transition to a fallback open animation.
- Prefer `thumbnailSrc` for inline thumbnails and `src` for the lightbox source. That keeps page weight down without sacrificing the opened image.
- Use `PhotoAlbum` when layout is the product. Use `PhotoGallery` when markup is the product.
- Use `photo-class` and `image-class` before reaching for the `#photo` slot. Slotting should be deliberate, not the default.
- Use `containerWidth` when the container size is already known. It avoids measurement work and gives deterministic layout.
- Use `defaultContainerWidth` when SSR determinism matters but the client width is not known yet.
- Use `PhotoImage` inside custom slots instead of hardcoding `NuxtImg` or `<img>`. That preserves the module's runtime switch.
- Treat feature flags as bundle partitioning, not as runtime feature switches.

## Public API

Components:

- `PhotoImage`
- `PhotoImg`
- `PhotoAlbum`
- `PhotoGallery`
- `PhotoLightbox`

Composables:

- `usePhotoLightbox`
- `usePhotoAlbumLayout`
- `usePhotoGroup`
- `useContainerWidth`

Common exported types:

- `PhotoItem`
- `ImageConfig`
- `LayoutType`
- `LightboxItem`
- `LightboxImageItem`
- `LightboxCustomItem`
- `LightboxOptions`
- `LightboxConfig`
- `CaptionVisibilityMode`

## Contributing

This repo is designed to be easy to work on locally:

- the main development surface is the local `playground/` app
- the canonical full validation path is `npm run verify`
- contributions should prefer small, direct changes over compatibility layers, wrappers, or migration glue

### Local Setup

Install dependencies from the repo root:

```bash
pnpm install
```

Start the local development loop:

```bash
npm run dev
```

Use the playground to verify behavior interactively:

- open the local app and exercise the examples in [`playground/pages`](./playground/pages)
- treat those pages as the fastest way to check public component behavior
- the playground loads the local module from [`../src/module`](./playground/nuxt.config.ts), so playground runs reflect your local module code directly

### Development Workflow

The intended loop is:

1. Make the change in `src/`.
2. Verify behavior in the relevant page under [`playground/pages`](./playground/pages).
3. Use the existing playground examples as the reference for supported usage patterns.
4. Run focused checks while iterating:

```bash
npm run test
npm run test:types
npm run lint
```

5. Run the full verification pass before shipping:

```bash
npm run verify
```

### Repo Orientation

- [`src/module.ts`](./src/module.ts): Nuxt module entrypoint, config surface, auto-registration, and feature gating
- [`src/runtime/app/components`](./src/runtime/app/components): public Vue components such as `PhotoImg`, `PhotoAlbum`, `PhotoGallery`, and `PhotoLightbox`
- [`src/runtime/app/composables`](./src/runtime/app/composables): higher-level integration composables used by the public component layer
- [`src/runtime/lightbox`](./src/runtime/lightbox): headless lightbox runtime internals
- [`src/runtime/utils`](./src/runtime/utils): layout and image helper logic
- [`playground/`](./playground): manual verification, examples, and API usage reference
- [`test/`](./test): contract, regression, layout, and bundle-splitting coverage

### Contribution Guidelines

- Prefer hard cutovers in refactors. Replace the old path directly instead of preserving dual paths or backward-compat adapters.
- Do not preserve legacy code unless it is explicitly required for the change.
- Fix root causes before adding new abstraction. Avoid wrappers, compatibility glue, and fast-path patches on top of a weak design.
- Prefer `delete > simplify > replace > add`.
- Keep docs and examples aligned with the actual exported API. If public behavior changes, update the README and the playground examples with it.

### What To Test

- Verify component behavior in the playground for the exact surface you changed.
- Run type checks for both the module and the playground with `npm run test:types`.
- If the change touches the overlay runtime, test lightbox open/close, navigation, and control-slot behavior.
- If the change touches layout logic, test `rows`, `columns`, and `masonry` behavior where relevant.
- If the change touches module registration, feature flags, or CSS injection, confirm the bundle-splitting and feature-gating expectations still hold.

### Pull Request Checklist

- Public behavior changes are reflected in docs and examples.
- Tests were added or updated when behavior changed.
- `npm run verify` passes.
- No obsolete compatibility code or dead paths were left behind.

## Credits

This module builds on proven work from these libraries:

- [PhotoSwipe](https://github.com/dimsemenov/photoswipe) (MIT), for the lightbox implementation model and interaction design.
- [vue-photo-album](https://github.com/tenthree/vue-photo-album) (MIT), for the photo layout algorithms used for album layouts. The upstream license text is preserved in [`src/runtime/utils/LICENSE`](./src/runtime/utils/LICENSE).

## License

MIT
