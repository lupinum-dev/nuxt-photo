---
title: Styling
description: CSS architecture, custom properties, and theming with Tailwind.
navigation: true
---

# Styling

nuxt-photo separates **structural CSS** (layout, positioning) from **theme CSS** (colors, backgrounds, typography). This makes it easy to use the default look, customize specific aspects, or replace the visual layer entirely.

## CSS Architecture

The styles are split into five files across two layers:

### Structure (layout and positioning)

| File                     | What it styles                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `lightbox-structure.css` | Lightbox fixed positioning, viewport grid, button layout, media containers, touch interactions |
| `album.css`              | Album grid, row/column/masonry layout structures                                               |
| `photo-structure.css`    | Photo figure layout, image sizing                                                              |

### Theme (visual appearance)

| File                 | What it styles                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| `lightbox-theme.css` | Backdrop blur, button glass-morphism, counter, caption colors, image border-radius |
| `photo.css`          | Photo gradient placeholder, caption styling                                        |

## CSS Options in Nuxt

The `css` module option controls which layers are injected:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nuxtPhoto: {
    css: 'structure', // default
  },
})
```

| Value         | Includes                                                  |
| ------------- | --------------------------------------------------------- |
| `'none'`      | Nothing. You must provide all CSS.                        |
| `'structure'` | Structure files only. You provide the visual theme.       |
| `'all'`       | Structure + theme. The default look works out of the box. |

## CSS Custom Properties

The theme is built on CSS custom properties. Override them to customize the appearance without replacing the entire theme:

```css
.np-lightbox {
  /* Backdrop */
  --np-backdrop-bg: rgba(0, 0, 0, 0.85);
  --np-backdrop-blur: 16px;

  /* Buttons */
  --np-btn-radius: 999px;
  --np-btn-bg: rgba(255, 255, 255, 0.1);
  --np-btn-hover-bg: rgba(255, 255, 255, 0.16);
  --np-btn-color: white;
  --np-btn-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 16px 40px rgba(0, 0, 0, 0.24);
  --np-btn-blur: 8px;
  --np-btn-disabled-opacity: 0.45;

  /* Counter */
  --np-counter-color: rgba(255, 255, 255, 0.72);

  /* Image */
  --np-img-radius: 16px;

  /* Caption */
  --np-caption-color: white;
  --np-caption-heading-size: 22px;
  --np-caption-secondary: rgba(255, 255, 255, 0.72);
}
```

### Example: Dark theme with sharper images

```css
.np-lightbox {
  --np-backdrop-bg: rgba(0, 0, 0, 0.95);
  --np-backdrop-blur: 0px;
  --np-img-radius: 0px;
  --np-btn-bg: rgba(255, 255, 255, 0.05);
  --np-btn-hover-bg: rgba(255, 255, 255, 0.1);
}
```

### Example: Light theme

```css
.np-lightbox {
  --np-backdrop-bg: rgba(255, 255, 255, 0.92);
  --np-backdrop-blur: 20px;
  --np-btn-bg: rgba(0, 0, 0, 0.06);
  --np-btn-hover-bg: rgba(0, 0, 0, 0.1);
  --np-btn-color: #1a1a1a;
  --np-counter-color: rgba(0, 0, 0, 0.6);
  --np-caption-color: #1a1a1a;
  --np-caption-secondary: rgba(0, 0, 0, 0.6);
}
```

## CSS Classes Reference

### Album

| Class                                         | Element         |
| --------------------------------------------- | --------------- |
| `.np-album`                                   | Root container  |
| `.np-album--rows` / `--columns` / `--masonry` | Layout modifier |
| `.np-album__item`                             | Photo wrapper   |
| `.np-album__img`                              | Photo `<img>`   |
| `.np-album__row` / `__column` / `__grid`      | Group wrappers  |

### Photo

| Class                | Element         |
| -------------------- | --------------- |
| `.np-photo`          | Root `<figure>` |
| `.np-photo__img`     | Image           |
| `.np-photo__caption` | Caption         |

### Lightbox

| Class                    | Element                          |
| ------------------------ | -------------------------------- |
| `.np-lightbox`           | Root                             |
| `.np-lightbox__backdrop` | Overlay                          |
| `.np-lightbox__viewport` | Media area                       |
| `.np-lightbox__btn`      | Button (prev, next, close, zoom) |
| `.np-lightbox__counter`  | Photo counter                    |
| `.np-lightbox__caption`  | Caption area                     |

## Tailwind Integration

Use `css: 'structure'` to keep the layout working while styling everything with Tailwind:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nuxtPhoto: {
    css: 'structure',
  },
})
```

Then style the lightbox elements using Tailwind classes via the `itemClass` and `imgClass` props on `PhotoAlbum`, or build a fully custom lightbox with [primitives](/docs/components/primitives) and apply Tailwind classes directly.

See the `playground-tailwind` example in the repository for a complete Tailwind integration.

## Plain Vue (Without Nuxt)

Import the CSS files manually:

```ts
// Required: structural styles
import '@nuxt-photo/recipes/styles/lightbox-structure.css'
import '@nuxt-photo/recipes/styles/album.css'
import '@nuxt-photo/recipes/styles/photo-structure.css'

// Optional: default theme
import '@nuxt-photo/recipes/styles/lightbox-theme.css'
import '@nuxt-photo/recipes/styles/photo.css'
```
