<script setup lang="ts">
import { computed, ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const loop = ref(true)
const dragFree = ref(false)
const autoplay = ref(false)
const thumbnails = ref(true)
const dots = ref(false)
const lightbox = ref(true)
const code = computed(
  () => `<PhotoCarousel
  :photos="photos"
  :loop="${loop.value}"
  :drag-free="${dragFree.value}"
  :autoplay="${autoplay.value}"
  :show-thumbnails="${thumbnails.value}"
  :show-dots="${dots.value}"
  :lightbox="${lightbox.value}"
/>`,
)

function reset() {
  loop.value = true
  dragFree.value = false
  autoplay.value = false
  thumbnails.value = true
  dots.value = false
  lightbox.value = true
}
</script>

<template>
  <InteractiveExample
    title="Configure the carousel"
    description="Change the small library-owned option surface."
    @reset="reset"
  >
    <PhotoCarousel
      :key="`${loop}-${dragFree}`"
      :photos="demoPhotos.slice(0, 8)"
      :loop="loop"
      :drag-free="dragFree"
      :autoplay="autoplay"
      :show-thumbnails="thumbnails"
      :show-dots="dots"
      :lightbox="lightbox"
      slide-aspect="16/9"
    />
    <template #controls>
      <label class="docs-control"><input v-model="loop" type="checkbox" /><span>Loop</span></label>
      <label class="docs-control"
        ><input v-model="dragFree" type="checkbox" /><span>Drag free</span></label
      >
      <label class="docs-control"
        ><input v-model="autoplay" type="checkbox" /><span>Autoplay</span></label
      >
      <label class="docs-control"
        ><input v-model="thumbnails" type="checkbox" /><span>Thumbnails</span></label
      >
      <label class="docs-control"><input v-model="dots" type="checkbox" /><span>Dots</span></label>
      <label class="docs-control"
        ><input v-model="lightbox" type="checkbox" /><span>Open lightbox</span></label
      >
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState
        :value="{
          loop,
          dragFree,
          autoplay,
          thumbnails,
          dots,
          lightbox,
        }"
    /></template>
  </InteractiveExample>
</template>
