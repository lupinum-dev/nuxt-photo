<script setup lang="ts">
import { computed, ref } from 'vue'
import { responsive, resolveResponsiveParameter } from '@nuxt-photo/nuxt/app'
import { demoPhotos } from '~/composables/demoPhotos'

const defaults = { width: 720, snap: true }
const width = ref(defaults.width)
const snap = ref(defaults.snap)
const columnsResolver = responsive({ 0: 2, 560: 3, 900: 4 })
const spacingResolver = responsive({ 0: 4, 560: 8, 900: 12 })
const columns = computed(() => resolveResponsiveParameter(columnsResolver, width.value, 3))
const spacing = computed(() => resolveResponsiveParameter(spacingResolver, width.value, 8))
const activeBreakpoint = computed(() => (width.value >= 900 ? 900 : width.value >= 560 ? 560 : 0))
const code = `<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, 560: 3, 900: 4 }),
  }"
  :spacing="responsive({ 0: 4, 560: 8, 900: 12 })"
  :breakpoints="[560, 900]"
/>
`

function reset() {
  width.value = defaults.width
  snap.value = defaults.snap
}
</script>

<template>
  <InteractiveExample
    title="See container-based responsiveness"
    description="The album responds to its own width, not the browser viewport."
    @reset="reset"
  >
    <DemoViewport v-model="width">
      <div class="breakpoint-ruler" aria-hidden="true">
        <span :style="{ left: `${(560 / 1120) * 100}%` }">560</span>
        <span :style="{ left: `${(900 / 1120) * 100}%` }">900</span>
      </div>
      <PhotoAlbum
        :photos="demoPhotos.slice(0, 8)"
        :layout="{ type: 'columns', columns: columnsResolver }"
        :spacing="spacingResolver"
        :breakpoints="snap ? [560, 900] : undefined"
        :default-container-width="width"
      />
    </DemoViewport>
    <template #controls>
      <div class="resolved-values">
        <span
          >Active breakpoint<strong>{{ activeBreakpoint }}px</strong></span
        >
        <span
          >Columns<strong>{{ columns }}</strong></span
        >
        <span
          >Spacing<strong>{{ spacing }}px</strong></span
        >
      </div>
      <label class="docs-control">
        <input v-model="snap" type="checkbox" />
        <span>Snap measurement to breakpoints</span>
      </label>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState
        :value="{
          containerWidth: width,
          activeBreakpoint,
          columns,
          spacing,
          snap,
        }"
    /></template>
  </InteractiveExample>
</template>
