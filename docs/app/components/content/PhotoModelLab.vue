<script setup lang="ts">
import type { PhotoItem } from '@lupinum/nuxt-photo/app'
import { computed, ref, watch } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const source = demoPhotos[0]!
const id = ref(source.id)
const src = ref(source.src)
const width = ref(source.width)
const height = ref(source.height)
const duplicate = ref(false)
const error = ref<string | null>(null)
const revision = ref(0)
const photo = computed(
  () =>
    ({
      ...source,
      id: id.value,
      src: src.value,
      width: width.value,
      height: height.value,
    }) as PhotoItem,
)
const photos = computed(() => (duplicate.value ? [photo.value, { ...photo.value }] : [photo.value]))
const code = computed(() => `const photos: PhotoItem[] = ${JSON.stringify(photos.value, null, 2)}`)

watch([id, src, width, height, duplicate], () => {
  error.value = null
  revision.value += 1
})

function reset() {
  id.value = source.id
  src.value = source.src
  width.value = source.width
  height.value = source.height
  duplicate.value = false
  error.value = null
  revision.value += 1
}
</script>

<template>
  <InteractiveExample
    title="Test the PhotoItem contract"
    description="Invalid data fails before layout calculation."
    @reset="reset"
  >
    <div class="photo-model-preview">
      <PhotoValidationProbe :key="revision" :photos="photos" @error="error = $event.message" />
      <p v-if="error" role="alert"><strong>Validation failed</strong>{{ error }}</p>
      <p v-else class="validation-ok">
        <strong>Valid collection</strong>The album can calculate geometry before loading images.
      </p>
    </div>
    <template #controls>
      <label class="docs-control docs-control--stacked"
        ><span>ID</span><input v-model="id" type="text"
      /></label>
      <label class="docs-control docs-control--stacked"
        ><span>Source</span><input v-model="src" type="text"
      /></label>
      <label class="docs-control docs-control--stacked"
        ><span>Width</span><input v-model.number="width" type="number"
      /></label>
      <label class="docs-control docs-control--stacked"
        ><span>Height</span><input v-model.number="height" type="number"
      /></label>
      <label class="docs-control"
        ><input v-model="duplicate" type="checkbox" /><span>Duplicate the ID</span></label
      >
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state><DemoState :value="{ valid: !error, error, photos }" /></template>
  </InteractiveExample>
</template>
