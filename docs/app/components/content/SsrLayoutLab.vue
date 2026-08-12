<script setup lang="ts">
import { computed, ref } from 'vue'
import { responsive } from '@lupinum/nuxt-photo/app'
import { demoPhotos } from '~/composables/demoPhotos'

const serverWidth = ref(720)
const clientWidth = ref(760)
const columns = responsive({ 0: 2, 640: 3, 960: 4 })
const breakpoint = (width: number) => (width >= 960 ? 960 : width >= 640 ? 640 : 0)
const stable = computed(() => breakpoint(serverWidth.value) === breakpoint(clientWidth.value))
const code = computed(
  () => `<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: responsive({ 0: 2, 640: 3, 960: 4 }) }"
  :default-container-width="${serverWidth.value}"
  :breakpoints="[640, 960]"
/>
`,
)

function reset() {
  serverWidth.value = 720
  clientWidth.value = 760
}
</script>

<template>
  <InteractiveExample
    title="Predict hydration stability"
    description="Match server assumptions to the same breakpoint the client will use."
    @reset="reset"
  >
    <div class="ssr-preview" :style="{ maxWidth: `${clientWidth}px` }">
      <PhotoAlbum
        :photos="demoPhotos.slice(0, 6)"
        :layout="{ type: 'columns', columns }"
        :default-container-width="serverWidth"
        :breakpoints="[640, 960]"
        :spacing="6"
      />
    </div>
    <p class="stability-result" :data-stable="stable">
      <strong>{{ stable ? 'Stable breakpoint' : 'Breakpoint mismatch' }}</strong>
      Server resolves to {{ breakpoint(serverWidth) }}px; client resolves to
      {{ breakpoint(clientWidth) }}px.
    </p>
    <template #controls>
      <label class="docs-control docs-control--stacked">
        <span
          >Assumed server width <output>{{ serverWidth }}px</output></span
        >
        <input v-model.number="serverWidth" type="range" min="320" max="1120" />
      </label>
      <label class="docs-control docs-control--stacked">
        <span
          >Actual client width <output>{{ clientWidth }}px</output></span
        >
        <input v-model.number="clientWidth" type="range" min="320" max="1120" />
      </label>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState
        :value="{
          serverWidth,
          clientWidth,
          serverBreakpoint: breakpoint(serverWidth),
          clientBreakpoint: breakpoint(clientWidth),
          stable,
        }"
    /></template>
  </InteractiveExample>
</template>
