<script setup lang="ts">
import { computed, ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const reverseVisualOrder = ref(false)
const reverseCollection = ref(false)
const group = ref<{ openById(id: string): Promise<void> } | null>(null)
const first = computed(() => demoPhotos.slice(0, 4))
const second = computed(() => demoPhotos.slice(4, 8))
const visibleFirst = computed(() =>
  reverseVisualOrder.value ? [...first.value].reverse() : first.value,
)
const collection = computed(() => {
  const photos = [...first.value, ...second.value]
  return reverseCollection.value ? photos.reverse() : photos
})
const code = computed(
  () => `<PhotoGroup :photos="${reverseCollection.value ? 'photos.toReversed()' : 'photos'}">
  <PhotoAlbum :photos="${reverseVisualOrder.value ? 'firstAlbum.toReversed()' : 'firstAlbum'}" />
  <PhotoAlbum :photos="secondAlbum" />
</PhotoGroup>`,
)

function reset() {
  reverseVisualOrder.value = false
  reverseCollection.value = false
}
</script>

<template>
  <InteractiveExample
    title="Separate visual order from navigation order"
    description="PhotoGroup owns one explicit collection. Descendants only provide triggers."
    @reset="reset"
  >
    <PhotoGroup ref="group" :photos="collection">
      <div class="group-lab">
        <PhotoAlbum :photos="visibleFirst" layout="rows" :spacing="6" />
        <PhotoAlbum :photos="second" layout="rows" :spacing="6" />
      </div>
    </PhotoGroup>
    <ol class="collection-order" aria-label="Lightbox navigation order">
      <li v-for="photo in collection" :key="photo.id">
        <button type="button" @click="group?.openById(photo.id)">
          {{ photo.caption }}
        </button>
      </li>
    </ol>
    <template #controls>
      <label class="docs-control">
        <input v-model="reverseVisualOrder" type="checkbox" />
        <span>Reverse the first album visually</span>
      </label>
      <label class="docs-control">
        <input v-model="reverseCollection" type="checkbox" />
        <span>Reverse the canonical collection</span>
      </label>
      <p class="docs-control-note">Only the second control changes lightbox navigation.</p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState
        :value="{
          visualOrder: visibleFirst.map((photo) => photo.id),
          navigationOrder: collection.map((photo) => photo.id),
        }"
    /></template>
  </InteractiveExample>
</template>
