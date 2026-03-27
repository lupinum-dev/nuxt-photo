---
title: Photo
description: A single photo with optional solo lightbox and auto-registration with PhotoGroup.
navigation: true
---

# Photo

The `Photo` component renders a single image with an optional caption. When placed inside a [`PhotoGroup`](/docs/components/photo-group), it auto-registers itself so clicking it opens the shared lightbox. When used standalone with the `lightbox` prop, it creates its own solo lightbox.

## Usage

### Standalone with lightbox

```vue
<Photo :photo="photo" lightbox />
```

Clicking the photo opens a single-image lightbox.

### Inside a PhotoGroup

```vue
<PhotoGroup>
  <Photo :photo="photo1" />
  <Photo :photo="photo2" />
  <Photo :photo="photo3" />
</PhotoGroup>
```

Each `Photo` auto-registers with the parent `PhotoGroup`. Clicking any photo opens the shared lightbox and allows navigating between all registered photos.

### With custom slide content

```vue
<Photo :photo="photo" lightbox>
  <template #slide="{ photo, index }">
    <div class="custom-slide">
      <img :src="photo.src" :alt="photo.alt" />
      <p>Custom overlay content</p>
    </div>
  </template>
</Photo>
```

### Opting out of a group

```vue
<PhotoGroup>
  <Photo :photo="photo1" />
  <Photo :photo="photo2" lightbox-ignore />  <!-- not part of the group -->
</PhotoGroup>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `photo` | `PhotoItem` | — | **Required.** The photo data object. |
| `lightbox` | `boolean \| Component` | `undefined` | Enables a solo lightbox when this Photo is not inside a PhotoGroup. Pass `true` for the default lightbox, or a custom lightbox component. |
| `lightboxIgnore` | `boolean` | `undefined` | Opts this photo out of a parent PhotoGroup. The photo renders as a plain image with no click interaction. |
| `adapter` | `ImageAdapter` | `undefined` | Custom image adapter for this photo. Overrides any adapter provided via injection. |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Image loading strategy. |
| `imgClass` | `string` | `undefined` | Extra CSS classes applied to the inner `<img>` element. |
| `captionClass` | `string` | `undefined` | Extra CSS classes applied to the `<figcaption>` element. |

## Slots

| Slot | Props | Description |
|---|---|---|
| `slide` | `{ photo: PhotoItem, index: number }` | Custom content for the lightbox slide. Only used when this Photo has a solo lightbox or is registered with a PhotoGroup. |

## Behavior

- **Renders as `<figure>`** with an `<img>` and optional `<figcaption>` (shown when `photo.caption` is set).
- **Auto-registration:** When inside a `PhotoGroup` in `auto` mode (no `:photos` prop on the group), `Photo` registers itself on mount and unregisters on unmount.
- **Solo lightbox:** When `lightbox` is truthy and there's no parent `PhotoGroup`, the component creates its own `useLightboxProvider` context and renders the lightbox.
- **Hidden state:** During lightbox FLIP transitions, the source thumbnail fades to opacity 0 to avoid visual duplication.
- **Keyboard accessible:** When interactive (solo or auto-grouped), the `<figure>` gets `role="button"` and `tabindex="0"` and responds to Enter and Space keys.

## CSS Classes

| Class | Element |
|---|---|
| `.np-photo` | Root `<figure>` element |
| `.np-photo__img` | Inner `<img>` element |
| `.np-photo__caption` | `<figcaption>` element |
