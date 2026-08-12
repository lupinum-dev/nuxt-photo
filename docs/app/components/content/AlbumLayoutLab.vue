<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

type Layout = 'rows' | 'columns' | 'masonry'

const defaults = {
  layout: 'rows' as Layout,
  width: 860,
  spacing: 8,
  rowHeight: 220,
  columns: 3,
}
const layout = ref<Layout>(defaults.layout)
const layoutGroup = `${useId()}-layout`
const width = ref(defaults.width)
const measuredWidth = ref(defaults.width)
const spacing = ref(defaults.spacing)
const rowHeight = ref(defaults.rowHeight)
const columns = ref(defaults.columns)

const layoutValue = computed(() =>
  layout.value === 'rows'
    ? { type: 'rows' as const, targetRowHeight: rowHeight.value }
    : { type: layout.value, columns: columns.value },
)

const code = computed(
  () => `<PhotoAlbum
  :photos="photos"
  :layout="${layout.value === 'rows' ? `{ type: 'rows', targetRowHeight: ${rowHeight.value} }` : `{ type: '${layout.value}', columns: ${columns.value} }`}"
  :spacing="${spacing.value}"
/>`,
)

function reset() {
  layout.value = defaults.layout
  width.value = defaults.width
  measuredWidth.value = defaults.width
  spacing.value = defaults.spacing
  rowHeight.value = defaults.rowHeight
  columns.value = defaults.columns
}
</script>

<template>
  <InteractiveExample
    title="Find the right album layout"
    description="Resize the container and compare the three layout strategies."
    @reset="reset"
  >
    <DemoViewport v-model="width" @resize="measuredWidth = $event">
      <PhotoAlbum :photos="demoPhotos.slice(0, 9)" :layout="layoutValue" :spacing="spacing" />
    </DemoViewport>

    <template #controls>
      <fieldset class="docs-control">
        <legend>Layout</legend>
        <label v-for="value in ['rows', 'columns', 'masonry'] as Layout[]" :key="value">
          <input v-model="layout" type="radio" :name="layoutGroup" :value="value" />
          <span>{{ value }}</span>
        </label>
      </fieldset>
      <label class="docs-control docs-control--stacked">
        <span
          >Spacing <output>{{ spacing }}px</output></span
        >
        <input v-model.number="spacing" type="range" min="0" max="24" aria-label="Spacing" />
      </label>
      <label v-if="layout === 'rows'" class="docs-control docs-control--stacked">
        <span
          >Target row height <output>{{ rowHeight }}px</output></span
        >
        <input
          v-model.number="rowHeight"
          type="range"
          min="120"
          max="360"
          step="10"
          aria-label="Target row height"
        />
      </label>
      <label v-else class="docs-control docs-control--stacked">
        <span
          >Columns <output>{{ columns }}</output></span
        >
        <input v-model.number="columns" type="range" min="1" max="6" aria-label="Columns" />
      </label>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state>
      <DemoState
        :value="{
          layout,
          containerWidth: measuredWidth,
          spacing,
          rowHeight: layout === 'rows' ? rowHeight : undefined,
          columns: layout !== 'rows' ? columns : undefined,
        }"
      />
    </template>
  </InteractiveExample>
</template>
