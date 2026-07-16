<script setup lang="ts">
import { computed, ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

type Layer = 'recipe' | 'slots' | 'provider' | 'primitives'
const layer = ref<Layer>('recipe')
const layers = [
  {
    id: 'recipe' as const,
    label: 'Recipe',
    owns: 'Layout, triggers, lightbox, gestures',
  },
  {
    id: 'slots' as const,
    label: 'Slots',
    owns: 'Runtime and structure; you own selected regions',
  },
  {
    id: 'provider' as const,
    label: 'Provider',
    owns: 'Lightbox runtime; you own thumbnail layout',
  },
  {
    id: 'primitives' as const,
    label: 'Primitives',
    owns: 'State and gestures; you own final structure',
  },
]
const selected = computed(() => layers.find((item) => item.id === layer.value)!)
const snippets: Record<Layer, string> = {
  recipe: '<PhotoAlbum :photos="photos" layout="rows" />',
  slots:
    '<PhotoAlbum :photos="photos">\n  <template #thumbnail="{ photo }">...</template>\n</PhotoAlbum>',
  provider:
    '<LightboxProvider :photos="photos">\n  <PhotoTrigger v-for="photo in photos" />\n  <Lightbox />\n</LightboxProvider>',
  primitives:
    '<LightboxProvider :photos="photos">\n  <LightboxRoot>\n    <LightboxViewport />\n    <LightboxControls />\n  </LightboxRoot>\n</LightboxProvider>',
}
function reset() {
  layer.value = 'recipe'
}
</script>

<template>
  <InteractiveExample
    title="Choose the shallowest customization layer"
    description="More control also means more markup and accessibility ownership."
    @reset="reset"
  >
    <PhotoAlbum
      v-if="layer === 'recipe'"
      :photos="demoPhotos.slice(0, 6)"
      layout="rows"
    />
    <PhotoAlbum
      v-else-if="layer === 'slots'"
      :photos="demoPhotos.slice(0, 6)"
      layout="rows"
    >
      <template #thumbnail="{ photo }"
        ><div class="custom-thumb">
          <PhotoImage :photo="photo" context="thumb" /><span>{{
            photo.caption
          }}</span>
        </div></template
      >
    </PhotoAlbum>
    <div v-else class="custom-layout-preview">
      <LightboxProvider :photos="demoPhotos.slice(0, 6)">
        <PhotoTrigger
          v-for="(photo, index) in demoPhotos.slice(0, 6)"
          :key="photo.id"
          :photo="photo"
          :index="index"
        >
          <PhotoImage :photo="photo" context="thumb" />
        </PhotoTrigger>
        <Lightbox />
      </LightboxProvider>
    </div>
    <p class="ownership-note">
      <strong>{{ selected.label }}</strong
      >{{ selected.owns }}
    </p>
    <template #controls>
      <fieldset class="docs-control">
        <legend>Layer</legend>
        <label v-for="item in layers" :key="item.id"
          ><input v-model="layer" type="radio" :value="item.id" /><span>{{
            item.label
          }}</span></label
        >
      </fieldset>
    </template>
    <template #code><DemoCode :code="snippets[layer]" /></template>
    <template #state
      ><DemoState :value="{ layer, libraryOwns: selected.owns }"
    /></template>
  </InteractiveExample>
</template>
