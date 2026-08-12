<script setup lang="ts">
import { computed, ref } from 'vue'
import { responsive, resolveResponsiveParameter } from '@nuxt-photo/nuxt/app'
import { demoPhotos } from '~/composables/demoPhotos'

const defaults = { width: 640 }
const width = ref(defaults.width)
const measuredWidth = ref(defaults.width)
const columnsResolver = responsive({ 0: 2, 400: 3, 480: 4 })
const spacingResolver = responsive({ 0: 4, 400: 8, 480: 12 })
const columns = computed(() => resolveResponsiveParameter(columnsResolver, measuredWidth.value, 3))
const spacing = computed(() => resolveResponsiveParameter(spacingResolver, measuredWidth.value, 8))
const activeBreakpoint = computed(() =>
  measuredWidth.value >= 480 ? 480 : measuredWidth.value >= 400 ? 400 : 0,
)
const code = `<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 2, 400: 3, 480: 4 }),
  }"
  :spacing="responsive({ 0: 4, 400: 8, 480: 12 })"
  :default-container-width="640"
/>
`

function reset() {
  width.value = defaults.width
  measuredWidth.value = defaults.width
}
</script>

<template>
  <InteractiveExample
    title="See container-based responsiveness"
    description="Resize the album container and watch each responsive value resolve independently."
    :heading-level="3"
    @reset="reset"
  >
    <DemoViewport v-model="width" :max="840" @resize="measuredWidth = $event">
      <PhotoAlbum
        :photos="demoPhotos.slice(0, 8)"
        :layout="{ type: 'columns', columns: columnsResolver }"
        :spacing="spacingResolver"
        :default-container-width="defaults.width"
      />
    </DemoViewport>
    <template #controls>
      <div class="resolved-values" aria-live="polite">
        <span
          >Breakpoint<strong>{{ activeBreakpoint }}px</strong></span
        >
        <span
          >Columns<strong>{{ columns }}</strong></span
        >
        <span
          >Spacing<strong>{{ spacing }}px</strong></span
        >
      </div>
      <p class="docs-control-note">
        Breakpoints come from <code>responsive()</code>; no separate array is required.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state>
      <DemoState
        :value="{
          containerWidth: measuredWidth,
          activeBreakpoint,
          columns,
          spacing,
        }"
      />
    </template>
  </InteractiveExample>
</template>
