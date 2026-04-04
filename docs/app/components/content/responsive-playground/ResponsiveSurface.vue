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
  <div class="grid gap-4">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
      <div class="px-3.5 py-3 border border-default rounded-2xl bg-elevated card-hover-subtle">
        <span class="text-muted">Actual width</span>
        <strong class="text-highlighted">{{ Math.round(props.width) }}px</strong>
      </div>
      <div class="px-3.5 py-3 border border-default rounded-2xl bg-elevated card-hover-subtle">
        <span class="text-muted">Observed width</span>
        <strong class="text-highlighted">{{ Math.round(containerWidth) }}px</strong>
      </div>
      <div class="px-3.5 py-3 border border-default rounded-2xl bg-elevated card-hover-subtle">
        <span class="text-muted">{{ props.layout === 'rows' ? 'Row height' : 'Columns' }}</span>
        <strong class="text-highlighted">{{ props.layout === 'rows' ? `${resolvedRowHeight}px` : resolvedColumns }}</strong>
      </div>
      <div class="px-3.5 py-3 border border-default rounded-2xl bg-elevated card-hover-subtle">
        <span class="text-muted">Spacing / Padding</span>
        <strong class="text-highlighted">{{ resolvedSpacing }} / {{ resolvedPadding }}</strong>
      </div>
      <div v-if="props.mode === 'ssr'" class="px-3.5 py-3 border border-default rounded-2xl bg-elevated card-hover-subtle">
        <span class="text-muted">SSR match</span>
        <strong class="text-highlighted">{{ serverMatch ? 'matched' : 'reflow expected' }}</strong>
      </div>
    </div>

    <div ref="containerRef" class="mx-auto rounded-2xl p-4 preview-frame-bg" :style="{ width: `${props.width}px`, maxWidth: '100%' }">
      <PhotoAlbum
        :photos="docsDemoPhotos"
        :layout="layoutConfig"
        :spacing="docsResponsiveSpacing"
        :padding="docsResponsivePadding"
        :default-container-width="props.mode === 'ssr' ? props.defaultContainerWidth : undefined"
        :breakpoints="props.snapping ? docsBreakpoints : undefined"
      />
    </div>

    <div class="border border-default rounded-xl overflow-hidden bg-muted/40">
      <div class="flex justify-between items-center gap-4 px-3.5 py-2.5 border-b border-default text-muted text-xs font-medium uppercase tracking-wide">
        <span>Responsive config</span>
        <span>{{ props.snapping ? 'snapped' : 'raw' }}</span>
      </div>
      <pre class="m-0 px-4 py-3.5 overflow-x-auto text-toned text-sm leading-relaxed font-mono"><code>{{ codeSnippet }}</code></pre>
    </div>
  </div>
</template>
