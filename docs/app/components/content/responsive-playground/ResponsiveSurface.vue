<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContainerWidth } from '@nuxt-photo/vue'
import { docsBreakpoints, docsDemoPhotos, docsResponsiveColumns, docsResponsivePadding, docsResponsiveRowHeight, docsResponsiveSpacing } from '~/composables/useDocsDemoData'

type LayoutType = 'rows' | 'columns' | 'masonry'

const props = withDefaults(defineProps<{
  mode?: 'basic' | 'ssr'
  width: number
  layout: LayoutType
  snapping: boolean
  defaultContainerWidth: number
}>(), {
  mode: 'basic',
})

const containerRef = ref<HTMLElement | null>(null)

const { containerWidth } = useContainerWidth(containerRef, {
  defaultContainerWidth: props.mode === 'ssr' ? props.defaultContainerWidth : undefined,
  breakpoints: props.snapping ? docsBreakpoints : undefined,
})

const layoutConfig = computed(() => {
  if (props.layout === 'rows') {
    return {
      type: 'rows' as const,
      targetRowHeight: docsResponsiveRowHeight,
    }
  }

  if (props.layout === 'masonry') {
    return {
      type: 'masonry' as const,
      columns: docsResponsiveColumns,
    }
  }

  return {
    type: 'columns' as const,
    columns: docsResponsiveColumns,
  }
})

const resolvedColumns = computed(() => docsResponsiveColumns(containerWidth.value || props.width))
const resolvedSpacing = computed(() => docsResponsiveSpacing(containerWidth.value || props.width))
const resolvedPadding = computed(() => docsResponsivePadding(containerWidth.value || props.width))
const resolvedRowHeight = computed(() => docsResponsiveRowHeight(containerWidth.value || props.width))

const serverMatch = computed(() => props.mode !== 'ssr'
  ? null
  : containerWidth.value === props.defaultContainerWidth)

const codeSnippet = computed(() => {
  const layoutLine = props.layout === 'rows'
    ? "type: 'rows', targetRowHeight: responsive({ 0: 170, 600: 220, 840: 270, 1120: 310 })"
    : `type: '${props.layout}', columns: responsive({ 0: 1, 520: 2, 840: 3, 1120: 4 })`

  const lines = [
    '<PhotoAlbum',
    '  :photos="photos"',
    `  :layout="{ ${layoutLine} }"`,
    "  :spacing=\"responsive({ 0: 4, 600: 8, 840: 12, 1120: 16 })\"",
    "  :padding=\"responsive({ 0: 0, 600: 2, 840: 4 })\"",
  ]

  if (props.snapping) {
    lines.push(`  :breakpoints="[${docsBreakpoints.join(', ')}]"`)
  }

  if (props.mode === 'ssr') {
    lines.push(`  :default-container-width="${props.defaultContainerWidth}"`)
  }

  lines.push('/>')
  return lines.join('\n')
})
</script>

<template>
  <div class="docs-responsive-surface">
    <div class="docs-responsive-surface__stats">
      <div class="docs-responsive-surface__stat">
        <span>Actual width</span>
        <strong>{{ Math.round(props.width) }}px</strong>
      </div>
      <div class="docs-responsive-surface__stat">
        <span>Observed width</span>
        <strong>{{ Math.round(containerWidth) }}px</strong>
      </div>
      <div class="docs-responsive-surface__stat">
        <span>{{ props.layout === 'rows' ? 'Row height' : 'Columns' }}</span>
        <strong>{{ props.layout === 'rows' ? `${resolvedRowHeight}px` : resolvedColumns }}</strong>
      </div>
      <div class="docs-responsive-surface__stat">
        <span>Spacing / Padding</span>
        <strong>{{ resolvedSpacing }} / {{ resolvedPadding }}</strong>
      </div>
      <div v-if="props.mode === 'ssr'" class="docs-responsive-surface__stat">
        <span>SSR match</span>
        <strong>{{ serverMatch ? 'matched' : 'reflow expected' }}</strong>
      </div>
    </div>

    <div ref="containerRef" class="docs-preview-frame" :style="{ width: `${props.width}px`, maxWidth: '100%' }">
      <PhotoAlbum
        :photos="docsDemoPhotos"
        :layout="layoutConfig"
        :spacing="docsResponsiveSpacing"
        :padding="docsResponsivePadding"
        :default-container-width="props.mode === 'ssr' ? props.defaultContainerWidth : undefined"
        :breakpoints="props.snapping ? docsBreakpoints : undefined"
      />
    </div>

    <div class="docs-demo__code">
      <div class="docs-demo__code-header">
        <span>Responsive config</span>
        <span>{{ props.snapping ? 'snapped' : 'raw' }}</span>
      </div>
      <pre><code>{{ codeSnippet }}</code></pre>
    </div>
  </div>
</template>
