<script setup lang="ts">
import { computed, ref } from 'vue'
import ResponsiveSurface from './responsive-playground/ResponsiveSurface.vue'

type LayoutType = 'rows' | 'columns' | 'masonry'

const props = withDefaults(defineProps<{
  mode?: 'basic' | 'ssr'
}>(), {
  mode: 'basic',
})

const width = ref(props.mode === 'ssr' ? 900 : 780)
const defaultContainerWidth = ref(840)
const layout = ref<LayoutType>('columns')
const snapping = ref(true)

const layoutItems = [
  { label: 'Rows', value: 'rows' },
  { label: 'Columns', value: 'columns' },
  { label: 'Masonry', value: 'masonry' },
]

const surfaceKey = computed(() => [
  props.mode,
  layout.value,
  snapping.value ? 'snap' : 'raw',
  defaultContainerWidth.value,
].join(':'))
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0">
        <h3 class="m-0 text-base font-bold text-highlighted">{{ props.mode === 'ssr' ? 'SSR width playground' : 'Responsive playground' }}</h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">
          <template v-if="props.mode === 'ssr'">
            Compare the measured container width with the width your server assumed before hydration.
          </template>
          <template v-else>
            Resize the container and watch the responsive layout inputs resolve from container width, not viewport width.
          </template>
        </p>
      </div>
    </div>

    <div class="grid gap-4 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <label class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated">
          <span class="text-muted text-sm">Container width</span>
          <input v-model.number="width" type="range" min="320" max="1120" step="10" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ Math.round(width) }}px</strong>
        </label>

        <div class="flex items-center gap-2">
          <span class="text-muted text-sm">Layout</span>
          <UTabs
            :model-value="layout"
            :items="layoutItems"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="layout = $event as LayoutType"
          />
        </div>

        <USwitch v-model="snapping" label="Breakpoint snapping" />

        <label v-if="props.mode === 'ssr'" class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated">
          <span class="text-muted text-sm">defaultContainerWidth</span>
          <input v-model.number="defaultContainerWidth" type="range" min="360" max="1120" step="20" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ defaultContainerWidth }}px</strong>
        </label>
      </div>

      <ResponsiveSurface
        :key="surfaceKey"
        :mode="props.mode"
        :width="width"
        :layout="layout"
        :snapping="snapping"
        :default-container-width="defaultContainerWidth"
      />
    </div>
  </div>
</template>
