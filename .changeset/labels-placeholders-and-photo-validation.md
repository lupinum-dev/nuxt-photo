---
'@lupinum/vue-photo': minor
---

Localized labels, placeholder previews, and a `Photo` validation policy

**Labels.** Every built-in UI string and accessibility label is localizable in one place. Provide a partial label set through `LightboxDefaults` or read the resolved set with the new `usePhotoLabels()` composable:

```ts
nuxtApp.vueApp.provide(LightboxDefaultsKey, {
  labels: { close: 'Schließen', viewPhoto: (index) => `Foto ${index} ansehen` },
})
```

New exports: `usePhotoLabels`, `resolvePhotoLabels`, `DEFAULT_PHOTO_LABELS`, and the `PhotoLabels` type.

**Placeholders.** `PhotoItem` accepts an optional `placeholder` — a tiny LQIP or dominant-color data URI painted behind the image until it decodes, removing load pop-in without affecting layout. Adapters can supply it through the new `ImageSource.placeholder` field.

**Validation.** `<Photo>` accepts `validation="drop"` to render nothing for invalid photos instead of throwing, matching the album and carousel policy surface.

**Sizes.** `PhotoAlbum`'s `sizes` prop now also accepts a plain HTML `sizes` string, which passes through verbatim; the structured form keeps deriving layout-exact `calc()` values and now rejects tokens containing quotes, semicolons, or braces with a clear error instead of emitting broken CSS.
