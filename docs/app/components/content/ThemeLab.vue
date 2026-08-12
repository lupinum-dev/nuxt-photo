<script setup lang="ts">
import { computed, ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const radius = ref(10)
const spacing = ref(8)
const overlay = ref('#090d18')
const code = computed(
  () => `.gallery {
  --np-lightbox-bg: ${overlay.value};
  --gallery-radius: ${radius.value}px;
}

.gallery :deep(.np-album__item) {
  border-radius: var(--gallery-radius);
  overflow: hidden;
}`,
)
function reset() {
  radius.value = 10
  spacing.value = 8
  overlay.value = '#090d18'
}
</script>

<template>
  <InteractiveExample
    title="Tune the visual layer"
    description="Keep structure CSS, then override the small surface your design needs."
    @reset="reset"
  >
    <div
      class="theme-lab"
      :style="{
        '--gallery-radius': `${radius}px`,
        '--np-lightbox-bg': overlay,
      }"
    >
      <PhotoAlbum :photos="demoPhotos.slice(0, 6)" layout="rows" :spacing="spacing" />
    </div>
    <template #controls>
      <label class="docs-control docs-control--stacked"
        ><span
          >Corner radius <output>{{ radius }}px</output></span
        ><input v-model.number="radius" type="range" min="0" max="24"
      /></label>
      <label class="docs-control docs-control--stacked"
        ><span
          >Album spacing <output>{{ spacing }}px</output></span
        ><input v-model.number="spacing" type="range" min="0" max="20"
      /></label>
      <label class="docs-control docs-control--stacked"
        ><span>Lightbox surface</span><input v-model="overlay" type="color"
      /></label>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state><DemoState :value="{ radius, spacing, overlay }" /></template>
  </InteractiveExample>
</template>
