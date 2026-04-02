---
title: PhotoGallery
description: Deprecated convenience wrapper around PhotoGroup + PhotoAlbum.
navigation: true
---

# PhotoGallery

::callout{type="warning"}
`PhotoGallery` is **deprecated**. Use [`PhotoGroup`](/docs/components/photo-group) + [`PhotoAlbum`](/docs/components/photo-album) directly instead — it gives you more control and makes the component hierarchy explicit.
::

## What It Does

`PhotoGallery` is a thin convenience wrapper that combines `PhotoGroup` and `PhotoAlbum` into a single component. It exists for simple cases where you just want a grid with a lightbox and don't need the flexibility of composing the pieces yourself.

## Migration

Replace `PhotoGallery` with the explicit composition:

::code-group

```vue [Before (deprecated)]
<PhotoGallery :photos="photos" layout="masonry" :spacing="8" />
```

```vue [After (recommended)]
<PhotoGroup>
  <PhotoAlbum :photos="photos" layout="masonry" :spacing="8" />
</PhotoGroup>
```

::

Or even simpler — `PhotoAlbum` already includes its own lightbox when not inside a `PhotoGroup`:

```vue
<PhotoAlbum :photos="photos" layout="masonry" :spacing="8" />
```

## Props

`PhotoGallery` accepts the same props as [`PhotoAlbum`](/docs/components/photo-album) — they're passed through directly.

| Prop | Type | Default | Description |
|---|---|---|---|
| `photos` | `PhotoItem[] \| any[]` | — | **Required.** Array of photos. |
| `layout` | `AlbumLayout \| AlbumLayout['type']` | `'rows'` | Layout algorithm. |
| `spacing` | `ResponsiveParameter<number>` | `8` | Gap between images. |
| `padding` | `ResponsiveParameter<number>` | `0` | Outer padding around images. |
| `adapter` | `ImageAdapter` | `undefined` | Custom image adapter. |
| `lightbox` | `boolean \| Component` | `true` | Whether to enable the lightbox. |
