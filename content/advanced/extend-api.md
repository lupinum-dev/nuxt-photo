---
title: Engine And Customization
description: The old /extend entrypoint is gone; use the stable Vue API and engine layer directly.
navigation: true
---

# Engine And Customization

`@nuxt-photo/vue/extend` has been removed.

Use:

- `@nuxt-photo/vue` for `useLightboxProvider`, primitives, and stable injection keys like `LightboxComponentKey`, `ImageAdapterKey`, and `LightboxDefaultsKey`
- `@nuxt-photo/engine` for the framework-free lightbox runtime and state commands

## Custom lightbox UI

Build custom lightboxes on the stable Vue surface:

```vue
<script setup lang="ts">
import { useLightboxProvider } from '@nuxt-photo/vue'

const ctx = useLightboxProvider(photos)
</script>
```

Then compose primitives such as `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, and `LightboxCaption`.

## Global overrides

Provide these keys from `@nuxt-photo/vue` at app level:

- `LightboxComponentKey`
- `ImageAdapterKey`
- `LightboxDefaultsKey`

## When to use the engine package

Reach for `@nuxt-photo/engine` only when you are intentionally building below Vue and need the framework-free lightbox orchestration layer directly.
