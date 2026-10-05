<script setup lang="ts">
import { computed, ref } from 'vue'
import { demoPhotos } from 'nuxt-photo-demo'

const layouts = ['rows', 'columns', 'masonry', 'grid', 'bento', 'mosaic', 'accordion'] as const
type Layout = (typeof layouts)[number]

const defaults = {
  layout: 'rows' as Layout,
  width: 560,
  spacing: 8,
  rowHeight: 220,
  columns: 3,
  max: 5,
  lightbox: true,
}
const layout = ref<Layout>(defaults.layout)
const width = ref(defaults.width)
const spacing = ref(defaults.spacing)
const rowHeight = ref(defaults.rowHeight)
const columns = ref(defaults.columns)
const max = ref(defaults.max)
const lightbox = ref(defaults.lightbox)

const usesColumns = computed(() => ['columns', 'masonry', 'grid', 'bento'].includes(layout.value))

const layoutValue = computed(() => {
  switch (layout.value) {
    case 'rows':
      return { type: 'rows' as const, targetRowHeight: rowHeight.value }
    case 'mosaic':
      return { type: 'mosaic' as const, max: max.value }
    case 'accordion':
      return { type: 'accordion' as const }
    default:
      return { type: layout.value, columns: columns.value }
  }
})

const layoutCode = computed(() => {
  switch (layout.value) {
    case 'rows':
      return `{ type: 'rows', targetRowHeight: ${rowHeight.value} }`
    case 'mosaic':
      return `{ type: 'mosaic', max: ${max.value} }`
    case 'accordion':
      return `{ type: 'accordion' }`
    default:
      return `{ type: '${layout.value}', columns: ${columns.value} }`
  }
})

const code = computed(
  () => `<PhotoAlbum
  :photos="photos"
  :layout="${layoutCode.value}"
  :spacing="${spacing.value}"
  :lightbox="${lightbox.value}"
/>`,
)

function reset() {
  layout.value = defaults.layout
  width.value = defaults.width
  spacing.value = defaults.spacing
  rowHeight.value = defaults.rowHeight
  columns.value = defaults.columns
  max.value = defaults.max
  lightbox.value = defaults.lightbox
}
</script>

<template>
  <InteractiveExample
    title="Find the right album layout"
    description="Resize the container and compare the seven layouts."
    @reset="reset"
  >
    <DemoViewport v-model="width">
      <PhotoAlbum
        :photos="demoPhotos.slice(0, 9)"
        :layout="layoutValue"
        :spacing="spacing"
        :default-container-width="width"
        :lightbox="lightbox"
      />
    </DemoViewport>

    <template #controls>
      <fieldset class="docs-control">
        <legend>Layout</legend>
        <label v-for="value in layouts" :key="value">
          <input v-model="layout" type="radio" :value="value" />
          <span>{{ value }}</span>
        </label>
      </fieldset>
      <label class="docs-control docs-control--stacked">
        <span
          >Spacing <output>{{ spacing }}px</output></span
        >
        <input v-model.number="spacing" type="range" min="0" max="24" />
      </label>
      <label v-if="layout === 'rows'" class="docs-control docs-control--stacked">
        <span
          >Target row height <output>{{ rowHeight }}px</output></span
        >
        <input v-model.number="rowHeight" type="range" min="120" max="360" step="10" />
      </label>
      <label v-else-if="usesColumns" class="docs-control docs-control--stacked">
        <span
          >Columns <output>{{ columns }}</output></span
        >
        <input v-model.number="columns" type="range" min="1" max="6" />
      </label>
      <label v-else-if="layout === 'mosaic'" class="docs-control docs-control--stacked">
        <span
          >Photos in the frame <output>{{ max }}</output></span
        >
        <input v-model.number="max" type="range" min="1" max="9" />
      </label>
      <label class="docs-control">
        <input v-model="lightbox" type="checkbox" />
        <span>Open photos in the lightbox</span>
      </label>
    </template>
    <template #code><DemoCode :code="code" /></template>
  </InteractiveExample>
</template>
