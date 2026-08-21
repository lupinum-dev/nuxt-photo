---
'@lupinum/vue-photo': minor
---

Programmatic lightbox controllers on every recipe, and a reactive `transition` prop

`<PhotoAlbum>` and `<Photo>` now expose `{ open, openById, close, isOpen }` through template refs, matching `<PhotoGroup>`. Open a gallery from your own button without restructuring markup into a `PhotoGroup`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const album = ref()
</script>

<template>
  <button @click="album.open(0)">Open gallery</button>
  <PhotoAlbum ref="album" :photos="photos" />
</template>
```

The `transition` prop on all recipe components is now reactive: changing it at runtime takes effect at the next open/close. The `lightbox` prop remains read once on mount; this is now documented explicitly. `prefers-reduced-motion` changes are picked up while the lightbox is closed instead of requiring a reload.

A disabled `<PhotoGroup>` now no-ops consistently on every controller call with one dev-time hint, instead of mixing throws and silent returns.
