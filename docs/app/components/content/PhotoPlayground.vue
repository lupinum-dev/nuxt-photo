<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type LayoutType = 'rows' | 'columns' | 'masonry' | 'bento'
type BentoSizing = 'auto' | 'pattern' | 'manual'

// Demo photos with known dimensions (landscape, portrait, square mix)
const demoPhotos = [
  { id: 1, src: 'https://picsum.photos/seed/np1/1600/900', width: 1600, height: 900, alt: 'Photo 1', caption: 'Landscape #1' },
  { id: 2, src: 'https://picsum.photos/seed/np2/900/1200', width: 900, height: 1200, alt: 'Photo 2', caption: 'Portrait #1' },
  { id: 3, src: 'https://picsum.photos/seed/np3/1000/1000', width: 1000, height: 1000, alt: 'Photo 3', caption: 'Square #1' },
  { id: 4, src: 'https://picsum.photos/seed/np4/1400/900', width: 1400, height: 900, alt: 'Photo 4', caption: 'Landscape #2' },
  { id: 5, src: 'https://picsum.photos/seed/np5/800/1100', width: 800, height: 1100, alt: 'Photo 5', caption: 'Portrait #2' },
  { id: 6, src: 'https://picsum.photos/seed/np6/1600/1000', width: 1600, height: 1000, alt: 'Photo 6', caption: 'Landscape #3' },
  { id: 7, src: 'https://picsum.photos/seed/np7/900/900', width: 900, height: 900, alt: 'Photo 7', caption: 'Square #2' },
  { id: 8, src: 'https://picsum.photos/seed/np8/700/1200', width: 700, height: 1200, alt: 'Photo 8', caption: 'Portrait #3' },
  { id: 9, src: 'https://picsum.photos/seed/np9/1800/1000', width: 1800, height: 1000, alt: 'Photo 9', caption: 'Wide #1' },
  { id: 10, src: 'https://picsum.photos/seed/np10/1200/900', width: 1200, height: 900, alt: 'Photo 10', caption: 'Landscape #4' },
  { id: 11, src: 'https://picsum.photos/seed/np11/900/1300', width: 900, height: 1300, alt: 'Photo 11', caption: 'Portrait #4' },
  { id: 12, src: 'https://picsum.photos/seed/np12/1100/1100', width: 1100, height: 1100, alt: 'Photo 12', caption: 'Square #3' },
]

const layoutType = ref<LayoutType>('rows')
const config = reactive({
  rows: { targetRowHeight: 280 },
  columns: { columns: 3 },
  masonry: { columns: 3 },
  bento: { columns: 3, rowHeight: 280, sizing: 'auto' as BentoSizing },
  spacing: 8,
  padding: 0,
})

const layoutTabs = [
  { label: 'Rows', value: 'rows' as LayoutType },
  { label: 'Columns', value: 'columns' as LayoutType },
  { label: 'Masonry', value: 'masonry' as LayoutType },
  { label: 'Bento', value: 'bento' as LayoutType },
]

const bentoSizingOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Pattern', value: 'pattern' },
]

const columnsOptions = [
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
]

const albumLayout = computed(() => {
  const t = layoutType.value
  if (t === 'rows') return { type: 'rows' as const, targetRowHeight: config.rows.targetRowHeight }
  if (t === 'columns') return { type: 'columns' as const, columns: config.columns.columns }
  if (t === 'masonry') return { type: 'masonry' as const, columns: config.masonry.columns }
  return {
    type: 'bento' as const,
    columns: config.bento.columns,
    rowHeight: config.bento.rowHeight,
    sizing: config.bento.sizing,
  }
})

const codeSnippet = computed(() => {
  const t = layoutType.value
  const lines: string[] = ['<PhotoAlbum']
  lines.push('  :photos="photos"')

  if (t === 'rows' && config.rows.targetRowHeight !== 280) {
    lines.push(`  :layout="{ type: 'rows', targetRowHeight: ${config.rows.targetRowHeight} }"`)
  }
  else if (t === 'columns') {
    lines.push(`  :layout="{ type: 'columns', columns: ${config.columns.columns} }"`)
  }
  else if (t === 'masonry') {
    lines.push(`  :layout="{ type: 'masonry', columns: ${config.masonry.columns} }"`)
  }
  else if (t === 'bento') {
    const opts = [`type: 'bento'`, `columns: ${config.bento.columns}`, `rowHeight: ${config.bento.rowHeight}`, `sizing: '${config.bento.sizing}'`]
    lines.push(`  :layout="{ ${opts.join(', ')} }"`)
  }
  else {
    lines.push(`  layout="${t}"`)
  }

  if (config.spacing !== 8) lines.push(`  :spacing="${config.spacing}"`)
  if (config.padding !== 0) lines.push(`  :padding="${config.padding}"`)

  lines.push('/>')
  return lines.join('\n')
})
</script>

<template>
  <div class="not-prose my-8 rounded-xl border border-default overflow-hidden bg-background">
    <!-- Controls -->
    <div class="p-4 border-b border-default bg-muted/40">
      <!-- Layout type tabs -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <span class="text-sm font-medium text-muted">Layout:</span>
        <div class="flex gap-1 rounded-lg border border-default bg-background p-1">
          <button
            v-for="tab in layoutTabs"
            :key="tab.value"
            class="px-3 py-1 text-sm rounded-md font-medium transition-colors"
            :class="layoutType === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-default hover:bg-muted'"
            @click="layoutType = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Per-layout controls -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <!-- Rows: targetRowHeight -->
        <template v-if="layoutType === 'rows'">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-28">Row height:</span>
            <input
              v-model.number="config.rows.targetRowHeight"
              type="range" min="100" max="500" step="10"
              class="w-32 accent-primary"
            />
            <span class="text-xs text-muted w-12">{{ config.rows.targetRowHeight }}px</span>
          </label>
        </template>

        <!-- Columns: columns -->
        <template v-if="layoutType === 'columns'">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-16">Columns:</span>
            <div class="flex gap-1">
              <button
                v-for="opt in columnsOptions"
                :key="opt.value"
                class="w-8 h-8 text-sm rounded border transition-colors"
                :class="config.columns.columns === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-default text-muted hover:border-primary hover:text-default'"
                @click="config.columns.columns = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </label>
        </template>

        <!-- Masonry: columns -->
        <template v-if="layoutType === 'masonry'">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-16">Columns:</span>
            <div class="flex gap-1">
              <button
                v-for="opt in columnsOptions"
                :key="opt.value"
                class="w-8 h-8 text-sm rounded border transition-colors"
                :class="config.masonry.columns === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-default text-muted hover:border-primary hover:text-default'"
                @click="config.masonry.columns = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </label>
        </template>

        <!-- Bento: columns, rowHeight, sizing -->
        <template v-if="layoutType === 'bento'">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-16">Columns:</span>
            <div class="flex gap-1">
              <button
                v-for="opt in columnsOptions"
                :key="opt.value"
                class="w-8 h-8 text-sm rounded border transition-colors"
                :class="config.bento.columns === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-default text-muted hover:border-primary hover:text-default'"
                @click="config.bento.columns = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-20">Row height:</span>
            <input
              v-model.number="config.bento.rowHeight"
              type="range" min="150" max="400" step="10"
              class="w-28 accent-primary"
            />
            <span class="text-xs text-muted w-12">{{ config.bento.rowHeight }}px</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted font-medium w-14">Sizing:</span>
            <div class="flex gap-1">
              <button
                v-for="opt in bentoSizingOptions"
                :key="opt.value"
                class="px-2 h-7 text-xs rounded border transition-colors"
                :class="config.bento.sizing === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-default text-muted hover:border-primary hover:text-default'"
                @click="config.bento.sizing = opt.value as BentoSizing"
              >
                {{ opt.label }}
              </button>
            </div>
          </label>
        </template>

        <!-- Shared: spacing -->
        <label class="flex items-center gap-2 text-sm">
          <span class="text-muted font-medium w-16">Spacing:</span>
          <input
            v-model.number="config.spacing"
            type="range" min="0" max="32" step="2"
            class="w-28 accent-primary"
          />
          <span class="text-xs text-muted w-8">{{ config.spacing }}px</span>
        </label>

        <!-- Shared: padding -->
        <label class="flex items-center gap-2 text-sm">
          <span class="text-muted font-medium w-14">Padding:</span>
          <input
            v-model.number="config.padding"
            type="range" min="0" max="16" step="2"
            class="w-28 accent-primary"
          />
          <span class="text-xs text-muted w-8">{{ config.padding }}px</span>
        </label>
      </div>
    </div>

    <!-- Live preview -->
    <div class="p-4">
      <PhotoAlbum
        :photos="demoPhotos"
        :layout="albumLayout"
        :spacing="config.spacing"
        :padding="config.padding"
      />
    </div>

    <!-- Generated code -->
    <div class="border-t border-default">
      <div class="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-default">
        <span class="text-xs font-medium text-muted">Generated code</span>
      </div>
      <pre class="p-4 text-sm font-mono text-default overflow-x-auto bg-muted/20"><code>{{ codeSnippet }}</code></pre>
    </div>
  </div>
</template>
