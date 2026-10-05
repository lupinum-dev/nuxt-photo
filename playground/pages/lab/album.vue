<script setup lang="ts">
import type { AlbumLayout } from '@lupinum/nuxt-photo/app'
import { labCount, repeatLabPhotos } from '../../lab/collection'
const route = useRoute()
const router = useRouter()
const source = await useLabPhotos()
const layout = computed(() =>
  route.query.layout === 'columns' || route.query.layout === 'masonry'
    ? route.query.layout
    : 'rows',
)
const columns = computed(() => Math.min(12, labCount(route.query.columns, 3)))
const priority = computed(() => Math.max(0, Math.floor(Number(route.query.priority) || 0)))
const count = computed(() => labCount(route.query.n, 40))
const photos = computed(() => repeatLabPhotos(source.value, count.value))
const albumLayout = computed<AlbumLayout>(() =>
  layout.value === 'rows' ? { type: 'rows' } : { type: layout.value, columns: columns.value },
)
const draft = reactive({
  layout: String(layout.value),
  columns: String(columns.value),
  priority: String(priority.value),
  n: String(count.value),
})
let pending = 0
function syncDraft() {
  Object.assign(draft, {
    layout: layout.value,
    columns: String(columns.value),
    priority: String(priority.value),
    n: String(count.value),
  })
}
watch(
  () => route.query,
  () => {
    if (!pending) syncDraft()
  },
)
let navigation = Promise.resolve()
function change(key: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  pending++
  // Read the canonical query after the previous control update has completed.
  navigation = navigation.then(async () => {
    try {
      await router.replace({ query: { ...route.query, [key]: value } })
    } finally {
      pending--
      if (!pending) syncDraft()
    }
  })
}
</script>
<template>
  <LabFrame title="Album" :photos="photos">
    <div class="lab-controls">
      <div>
        <label for="lab-layout">Layout</label
        ><select id="lab-layout" v-model="draft.layout" @change="change('layout', $event)">
          <option value="rows">Rows</option>
          <option value="columns">Columns</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>
      <label
        >Columns<input
          type="number"
          min="1"
          max="12"
          v-model="draft.columns"
          @input="change('columns', $event)"
      /></label>
      <label
        >Priority<input
          type="number"
          min="0"
          v-model="draft.priority"
          @input="change('priority', $event)"
      /></label>
      <label
        >Photos<input
          type="number"
          min="1"
          max="5000"
          v-model="draft.n"
          @input="change('n', $event)"
      /></label>
    </div>
    <PhotoAlbum :photos="photos" :layout="albumLayout" :priority="priority" />
  </LabFrame>
</template>
