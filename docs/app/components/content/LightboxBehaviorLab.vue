<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TransitionMode } from '@lupinum/nuxt-photo/app'
import { demoPhotos } from '~/composables/demoPhotos'

const transition = ref<TransitionMode>('auto')
const captions = ref(true)
const code = computed(
  () => `<PhotoAlbum
  :photos="photos"
  layout="rows"
  transition="${transition.value}"
/>`,
)

function reset() {
  transition.value = 'auto'
  captions.value = true
}
</script>

<template>
  <InteractiveExample
    title="Try the real lightbox runtime"
    description="Open a photo, navigate, zoom, swipe, and close with Escape."
    @reset="reset"
  >
    <PhotoGroup :key="transition" :photos="demoPhotos.slice(0, 6)" :transition="transition">
      <PhotoAlbum :photos="demoPhotos.slice(0, 6)" layout="rows" :spacing="6">
        <template v-if="captions" #thumbnail="{ photo }">
          <div class="captioned-thumb">
            <PhotoImage :photo="photo" context="thumb" />
            <span>{{ photo.caption }}</span>
          </div>
        </template>
      </PhotoAlbum>
    </PhotoGroup>
    <template #controls>
      <fieldset class="docs-control">
        <legend>Transition</legend>
        <label v-for="value in ['auto', 'flip', 'fade', 'none'] as TransitionMode[]" :key="value">
          <input v-model="transition" type="radio" :value="value" /><span>{{ value }}</span>
        </label>
      </fieldset>
      <label class="docs-control"
        ><input v-model="captions" type="checkbox" /><span>Show thumbnail captions</span></label
      >
      <p class="docs-control-note">
        The lightbox follows the operating system reduced-motion preference.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState :value="{ transition, captions, photos: 6, modalOwner: 'PhotoGroup' }"
    /></template>
  </InteractiveExample>
</template>
