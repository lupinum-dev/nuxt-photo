<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { responsive, type AlbumLayout } from '@nuxt-photo/vue'
import { docsDemoPhotos, docsHeroPhotos } from '~/composables/useDocsDemoData'

type LayoutType = 'rows' | 'columns' | 'masonry'
type ThumbnailPreset = 'default' | 'badge' | 'editorial' | 'hidden-state'

const props = withDefaults(defineProps<{
  mode?: 'full' | 'compact' | 'hero'
  initialLayout?: LayoutType
  initialThumbnail?: ThumbnailPreset
  allowLightboxToggle?: boolean
  allowThumbnailPicker?: boolean
  showCode?: boolean
}>(), {
  mode: 'full',
  initialLayout: 'rows',
  initialThumbnail: 'default',
  allowLightboxToggle: true,
  allowThumbnailPicker: true,
})

const compact = computed(() => props.mode !== 'full')
const hero = computed(() => props.mode === 'hero')

const previewPhotos = computed(() => hero.value ? docsHeroPhotos : docsDemoPhotos)

const layoutType = ref<LayoutType>(props.initialLayout)
const thumbnailPreset = ref<ThumbnailPreset>(props.initialThumbnail)
const lightboxEnabled = ref(true)
const width = ref(hero.value ? 940 : compact.value ? 760 : 980)
const useResponsiveValues = ref(props.mode === 'full')

const config = reactive({
  rows: { targetRowHeight: compact.value ? 240 : 280 },
  columns: { columns: compact.value ? 3 : 4 },
  masonry: { columns: compact.value ? 3 : 4 },
  spacing: compact.value ? 8 : 12,
  padding: compact.value ? 0 : 4,
})

const layoutTabItems = [
  { label: 'Rows', value: 'rows' },
  { label: 'Columns', value: 'columns' },
  { label: 'Masonry', value: 'masonry' },
]

const thumbnailTabItems = [
  { label: 'Default', value: 'default' },
  { label: 'Badge', value: 'badge' },
  { label: 'Editorial', value: 'editorial' },
  { label: 'Hidden', value: 'hidden-state' },
]

const columnsOptions = [2, 3, 4, 5]

function responsiveExpression(staticValue: number, mediumValue: number, wideValue: number) {
  return `responsive({ 0: ${staticValue}, 600: ${mediumValue}, 1120: ${wideValue} })`
}

const albumLayout = computed<AlbumLayout>(() => {
  if (layoutType.value === 'rows') {
    return {
      type: 'rows',
      targetRowHeight: useResponsiveValues.value
        ? responsive({
          0: Math.max(160, config.rows.targetRowHeight - 60),
          640: config.rows.targetRowHeight,
          1120: config.rows.targetRowHeight + 40,
        })
        : config.rows.targetRowHeight,
    }
  }

  if (layoutType.value === 'columns') {
    return {
      type: 'columns',
      columns: useResponsiveValues.value
        ? responsive({
          0: Math.max(1, config.columns.columns - 2),
          640: Math.max(2, config.columns.columns - 1),
          1120: config.columns.columns,
        })
        : config.columns.columns,
    }
  }

  if (layoutType.value === 'masonry') {
    return {
      type: 'masonry',
      columns: useResponsiveValues.value
        ? responsive({
          0: Math.max(1, config.masonry.columns - 2),
          640: Math.max(2, config.masonry.columns - 1),
          1120: config.masonry.columns,
        })
        : config.masonry.columns,
    }
  }
})

const spacingValue = computed(() => useResponsiveValues.value
  ? responsive({
    0: Math.max(2, config.spacing - 4),
    720: config.spacing,
    1120: config.spacing + 4,
  })
  : config.spacing)

const paddingValue = computed(() => useResponsiveValues.value
  ? responsive({
    0: Math.max(0, config.padding - 2),
    720: config.padding,
    1120: config.padding + 2,
  })
  : config.padding)

const codeSnippet = computed(() => {
  const lines: string[] = [
    '<PhotoAlbum',
    '  :photos="photos"',
  ]

  if (layoutType.value === 'rows') {
    lines.push(`  :layout="{ type: 'rows', targetRowHeight: ${useResponsiveValues.value
      ? responsiveExpression(Math.max(160, config.rows.targetRowHeight - 60), config.rows.targetRowHeight, config.rows.targetRowHeight + 40)
      : config.rows.targetRowHeight} }"`)
  } else if (layoutType.value === 'columns') {
    lines.push(`  :layout="{ type: 'columns', columns: ${useResponsiveValues.value
      ? responsiveExpression(Math.max(1, config.columns.columns - 2), Math.max(2, config.columns.columns - 1), config.columns.columns)
      : config.columns.columns} }"`)
  } else if (layoutType.value === 'masonry') {
    lines.push(`  :layout="{ type: 'masonry', columns: ${useResponsiveValues.value
      ? responsiveExpression(Math.max(1, config.masonry.columns - 2), Math.max(2, config.masonry.columns - 1), config.masonry.columns)
      : config.masonry.columns} }"`)
  }

  lines.push(`  :spacing="${useResponsiveValues.value
    ? responsiveExpression(Math.max(2, config.spacing - 4), config.spacing, config.spacing + 4)
    : config.spacing}"`)
  lines.push(`  :padding="${useResponsiveValues.value
    ? responsiveExpression(Math.max(0, config.padding - 2), config.padding, config.padding + 2)
    : config.padding}"`)

  if (props.allowLightboxToggle) {
    lines.push(`  :lightbox="${lightboxEnabled.value}"`)
  }

  lines.push('/>')

  if (thumbnailPreset.value !== 'default') {
    lines.push('')
    lines.push('<!-- #thumbnail slot enabled in the live demo -->')
  }

  return lines.join('\n')
})

const summary = computed(() => {
  const fragments = [
    layoutType.value,
    useResponsiveValues.value ? 'responsive values' : 'static values',
    `${Math.round(width.value)}px container`,
  ]

  if (thumbnailPreset.value !== 'default') {
    fragments.push(`${thumbnailPreset.value} thumbnails`)
  }

  if (props.allowLightboxToggle) {
    fragments.push(lightboxEnabled.value ? 'lightbox on' : 'lightbox off')
  }

  return fragments.join(' · ')
})

function thumbOpacity(hidden: boolean) {
  if (thumbnailPreset.value !== 'hidden-state') return hidden ? 0 : 1
  return hidden ? 0.28 : 1
}
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0 w-full sm:w-auto">
        <h3 class="m-0 text-base font-bold text-highlighted">{{ hero ? 'Try the gallery live' : 'Live gallery playground' }}</h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">{{ summary }}</p>
      </div>
    </div>

    <div v-if="!hero" class="grid gap-3 p-4">
      <!-- Group 1: primary — layout type and container width -->
      <div class="flex flex-wrap items-center gap-3 min-w-0">
        <UTabs
          :model-value="layoutType"
          :items="layoutTabItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          class="min-w-0"
          @update:model-value="layoutType = $event as LayoutType"
        />

        <label class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated min-w-0 flex-1 sm:flex-initial">
          <span class="text-muted text-sm whitespace-nowrap">Container width</span>
          <input v-model.number="width" type="range" min="320" max="1120" step="10" class="accent-primary min-w-0 flex-1">
          <strong class="text-highlighted text-sm whitespace-nowrap">{{ Math.round(width) }}px</strong>
        </label>
      </div>

      <!-- Group 2: size / spacing — row-height or columns, spacing, padding -->
      <div class="flex flex-wrap items-center gap-3 min-w-0">
        <label v-if="layoutType === 'rows'" class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated min-w-0 flex-1 sm:flex-initial">
          <span class="text-muted text-sm whitespace-nowrap">Row height</span>
          <input v-model.number="config.rows.targetRowHeight" type="range" min="160" max="420" step="10" class="accent-primary min-w-0 flex-1">
          <strong class="text-highlighted text-sm whitespace-nowrap">{{ config.rows.targetRowHeight }}px</strong>
        </label>

        <div v-if="layoutType === 'columns'" class="flex items-center gap-2 min-w-0">
          <span class="text-muted text-sm whitespace-nowrap">Columns</span>
          <UTabs
            :model-value="config.columns.columns"
            :items="columnsOptions.map(c => ({ label: String(c), value: c }))"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="config.columns.columns = Number($event)"
          />
        </div>

        <div v-if="layoutType === 'masonry'" class="flex items-center gap-2 min-w-0">
          <span class="text-muted text-sm whitespace-nowrap">Columns</span>
          <UTabs
            :model-value="config.masonry.columns"
            :items="columnsOptions.map(c => ({ label: String(c), value: c }))"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="config.masonry.columns = Number($event)"
          />
        </div>

        <label class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated min-w-0 flex-1 sm:flex-initial">
          <span class="text-muted text-sm whitespace-nowrap">Spacing</span>
          <input v-model.number="config.spacing" type="range" min="2" max="24" step="2" class="accent-primary min-w-0 flex-1">
          <strong class="text-highlighted text-sm whitespace-nowrap">{{ config.spacing }}px</strong>
        </label>

        <label class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated min-w-0 flex-1 sm:flex-initial">
          <span class="text-muted text-sm whitespace-nowrap">Padding</span>
          <input v-model.number="config.padding" type="range" min="0" max="12" step="2" class="accent-primary min-w-0 flex-1">
          <strong class="text-highlighted text-sm whitespace-nowrap">{{ config.padding }}px</strong>
        </label>
      </div>

      <!-- Group 3: display — toggles and thumbnail preset -->
      <div class="flex flex-wrap items-center gap-3 min-w-0">
        <USwitch v-model="useResponsiveValues" label="Responsive values" />
        <USwitch v-if="props.allowLightboxToggle" v-model="lightboxEnabled" label="Lightbox" />

        <div v-if="props.allowThumbnailPicker" class="flex items-center gap-2 min-w-0">
          <span class="text-muted text-sm whitespace-nowrap">Thumbnails</span>
          <UTabs
            :model-value="thumbnailPreset"
            :items="thumbnailTabItems"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="thumbnailPreset = $event as ThumbnailPreset"
          />
        </div>
      </div>
    </div>

    <div class="grid gap-4 p-4"
      :class="{ 'pt-0': !hero }">

      <div class="grid gap-4">
        <div class="mx-auto rounded-2xl p-4 preview-frame-bg" :style="{ width: `${width}px`, maxWidth: '100%' }">
          <PhotoAlbum
            :photos="previewPhotos"
            :layout="albumLayout"
            :spacing="spacingValue"
            :padding="paddingValue"
            :lightbox="props.allowLightboxToggle ? lightboxEnabled : true"
          >
            <template
              v-if="thumbnailPreset !== 'default'"
              #thumbnail="{ photo, index, hidden }"
            >
              <figure
                class="relative overflow-hidden min-h-full rounded-2xl bg-muted"
                :class="[
                  thumbnailPreset,
                  { 'is-hidden': hidden, 'thumb-editorial': thumbnailPreset === 'editorial' },
                ]"
                :style="{ opacity: thumbOpacity(hidden) }"
              >
                <PhotoImage
                  :photo="photo"
                  context="thumb"
                  loading="lazy"
                  class="block w-full h-full object-cover"
                />
                <figcaption v-if="thumbnailPreset !== 'hidden-state'" class="absolute inset-x-0 bottom-0 z-1 flex justify-between items-center gap-2 p-3 text-white text-xs thumb-caption-gradient" :class="{ 'pr-13': thumbnailPreset === 'badge' }">
                  <span>{{ photo.caption }}</span>
                  <small>#{{ index + 1 }}</small>
                </figcaption>
                <div v-if="thumbnailPreset === 'badge'" class="absolute top-2.5 right-2.5 z-1 inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full font-bold text-xs thumb-badge-bg">
                  {{ index + 1 }}
                </div>
                <div v-if="thumbnailPreset === 'hidden-state'" class="absolute left-2.5 bottom-2.5 z-1 px-2 py-1.5 rounded-full text-xs thumb-hint-bg">
                  {{ hidden ? 'FLIP source hidden' : 'Visible thumbnail' }}
                </div>
              </figure>
            </template>
          </PhotoAlbum>
        </div>
      </div>

      <div v-if="props.showCode ?? !hero" class="border border-default rounded-xl overflow-hidden bg-muted/40">
        <div class="flex justify-between items-center gap-4 px-3.5 py-2.5 border-b border-default text-muted text-xs font-medium uppercase tracking-wide">
          <span>Generated usage</span>
          <UBadge variant="subtle" size="sm">
            {{ useResponsiveValues ? 'responsive()' : 'static values' }}
          </UBadge>
        </div>
        <pre class="m-0 px-4 py-3.5 overflow-x-auto text-toned text-sm leading-relaxed font-mono"><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
