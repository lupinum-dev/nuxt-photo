---
'@lupinum/nuxt-photo': minor
---

Localized labels, honest fallback warnings, and a typed app-config surface

**Labels.** New `nuxtPhoto.labels` option localizes every built-in UI string and accessibility label. `goToSlide` and `viewPhoto` accept an `{index}` placeholder. Omitted labels fall back to English.

```ts
nuxtPhoto: {
  labels: {
    close: 'Schließen',
    viewPhoto: 'Foto {index} ansehen',
  }
}
```

**Warnings.** Two previously silent degradations now log one build-time warning:

- `provider: 'auto'` without `@nuxt/image`: photos render with native sources.
- `image.thumb`/`image.slide` configured without `@nuxt/image`: that config has no effect.

Set `nuxtPhoto.image.provider = 'native'` to declare native rendering and silence both.

**Typed app config.** `useAppConfig().nuxtPhoto` is now checked against the declared `NuxtPhotoAppConfig` shape in every project. The augmentation previously shipped but was not wired into generated types, so unknown keys passed silently; they may now fail typecheck. Remove unknown keys or extend the interface in your app.

Module options no longer overwrite values you set in `app.config.ts`: keys the module does not manage are preserved as-is.
