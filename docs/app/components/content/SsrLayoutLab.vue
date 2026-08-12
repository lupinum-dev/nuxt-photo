<script setup lang="ts">
import { computed, ref } from 'vue'
import { responsive } from '@nuxt-photo/nuxt/app'
import { demoPhotos } from '~/composables/demoPhotos'

const defaults = Object.freeze({ serverWidth: 460, clientWidth: 470 })
const serverWidth = ref<number>(defaults.serverWidth)
const clientWidth = ref<number>(defaults.clientWidth)
const measuredClientWidth = ref<number>(defaults.clientWidth)
const columns = responsive({ 0: 2, 400: 3, 480: 4 })
const breakpoint = (width: number) => (width >= 480 ? 480 : width >= 400 ? 400 : 0)
const serverBreakpoint = computed(() => breakpoint(serverWidth.value))
const clientBreakpoint = computed(() => breakpoint(measuredClientWidth.value))
const stable = computed(() => serverBreakpoint.value === clientBreakpoint.value)
const previewKey = computed(() => `server-${serverWidth.value}`)
const code = computed(
  () => `<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, 400: 3, 480: 4 }),
  }"
  :default-container-width="${serverWidth.value}"
  :spacing="6"
/>
`,
)

function reset() {
  serverWidth.value = defaults.serverWidth
  clientWidth.value = defaults.clientWidth
  measuredClientWidth.value = defaults.clientWidth
}
</script>

<template>
  <InteractiveExample
    title="Predict hydration stability"
    description="Keep the server assumption and measured client width in the same responsive range."
    @reset="reset"
  >
    <DemoViewport v-model="clientWidth" :max="840" @resize="measuredClientWidth = $event">
      <PhotoAlbum
        :key="previewKey"
        :photos="demoPhotos.slice(0, 6)"
        :layout="{ type: 'columns', columns }"
        :default-container-width="serverWidth"
        :spacing="6"
      />
    </DemoViewport>
    <p class="stability-result" :data-stable="stable" role="status">
      <strong>{{ stable ? 'Stable breakpoint' : 'Breakpoint mismatch' }}</strong>
      Server resolves to {{ serverBreakpoint }}px; client resolves to {{ clientBreakpoint }}px.
    </p>
    <template #controls>
      <label class="docs-control docs-control--stacked">
        <span
          >Assumed server width <output>{{ serverWidth }}px</output></span
        >
        <input
          v-model.number="serverWidth"
          type="range"
          min="320"
          max="840"
          aria-label="Assumed server width"
        />
      </label>
      <label class="docs-control docs-control--stacked">
        <span
          >Requested client width <output>{{ clientWidth }}px</output></span
        >
        <input
          v-model.number="clientWidth"
          type="range"
          min="320"
          max="840"
          aria-label="Requested client width"
        />
      </label>
      <p class="docs-control-note">
        <code>defaultContainerWidth</code> is captured when the album is created. The lab remounts
        the preview when that assumption changes.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state>
      <DemoState
        :value="{
          serverWidth,
          measuredClientWidth,
          serverBreakpoint,
          clientBreakpoint,
          stable,
        }"
      />
    </template>
  </InteractiveExample>
</template>
