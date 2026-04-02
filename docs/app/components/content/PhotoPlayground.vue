<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { responsive, type AlbumLayout } from '@nuxt-photo/vue'
import { docsDemoPhotos, docsHeroPhotos } from '~/composables/useDocsDemoData'

type LayoutType = 'rows' | 'columns' | 'masonry' | 'bento'
type BentoSizing = 'auto' | 'pattern'
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
  bento: { columns: compact.value ? 3 : 4, rowHeight: compact.value ? 220 : 260, sizing: 'auto' as BentoSizing },
  spacing: compact.value ? 8 : 12,
  padding: compact.value ? 0 : 4,
})

const layoutTabItems = [
  { label: 'Rows', value: 'rows' },
  { label: 'Columns', value: 'columns' },
  { label: 'Masonry', value: 'masonry' },
  { label: 'Bento', value: 'bento' },
]

const thumbnailTabItems = [
  { label: 'Default', value: 'default' },
  { label: 'Badge', value: 'badge' },
  { label: 'Editorial', value: 'editorial' },
  { label: 'Hidden', value: 'hidden-state' },
]

const columnsOptions = [2, 3, 4, 5]
const bentoSizingItems = [
  { label: 'Auto', value: 'auto' },
  { label: 'Pattern', value: 'pattern' },
]

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

  return {
    type: 'bento',
    columns: useResponsiveValues.value
      ? responsive({
        0: Math.max(1, config.bento.columns - 2),
        720: Math.max(2, config.bento.columns - 1),
        1120: config.bento.columns,
      })
      : config.bento.columns,
    rowHeight: useResponsiveValues.value
      ? responsive({
        0: Math.max(160, config.bento.rowHeight - 60),
        720: config.bento.rowHeight,
        1120: config.bento.rowHeight + 30,
      })
      : config.bento.rowHeight,
    sizing: config.bento.sizing,
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
  } else {
    lines.push(`  :layout="{ type: 'bento', columns: ${useResponsiveValues.value
      ? responsiveExpression(Math.max(1, config.bento.columns - 2), Math.max(2, config.bento.columns - 1), config.bento.columns)
      : config.bento.columns}, rowHeight: ${useResponsiveValues.value
      ? responsiveExpression(Math.max(160, config.bento.rowHeight - 60), config.bento.rowHeight, config.bento.rowHeight + 30)
      : config.bento.rowHeight}, sizing: '${config.bento.sizing}' }"`)
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
  <div class="docs-demo not-prose my-8">
    <div class="docs-demo__header">
      <div class="docs-demo__headline">
        <h3 class="docs-demo__title">{{ hero ? 'Try the gallery live' : 'Live gallery playground' }}</h3>
        <p class="docs-demo__subtitle">{{ summary }}</p>
      </div>

      <div v-if="!hero" class="flex flex-wrap items-center gap-3">
        <UTabs
          :model-value="layoutType"
          :items="layoutTabItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="layoutType = $event as LayoutType"
        />

        <USwitch v-model="useResponsiveValues" label="Responsive values" />

        <USwitch v-if="props.allowLightboxToggle" v-model="lightboxEnabled" label="Lightbox" />
      </div>
    </div>

    <div class="docs-demo__body">
      <div v-if="!hero" class="flex flex-wrap items-center gap-3">
        <label class="docs-range">
          <span class="text-muted text-sm">Container width</span>
          <input v-model.number="width" type="range" min="320" max="1120" step="10" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ Math.round(width) }}px</strong>
        </label>

        <label v-if="layoutType === 'rows'" class="docs-range">
          <span class="text-muted text-sm">Row height</span>
          <input v-model.number="config.rows.targetRowHeight" type="range" min="160" max="420" step="10" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ config.rows.targetRowHeight }}px</strong>
        </label>

        <template v-if="layoutType === 'columns'">
          <div class="flex items-center gap-2">
            <span class="text-muted text-sm">Columns</span>
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
        </template>

        <template v-if="layoutType === 'masonry'">
          <div class="flex items-center gap-2">
            <span class="text-muted text-sm">Columns</span>
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
        </template>

        <template v-if="layoutType === 'bento'">
          <div class="flex items-center gap-2">
            <span class="text-muted text-sm">Columns</span>
            <UTabs
              :model-value="config.bento.columns"
              :items="columnsOptions.map(c => ({ label: String(c), value: c }))"
              variant="pill"
              size="xs"
              :content="false"
              value-key="value"
              label-key="label"
              @update:model-value="config.bento.columns = Number($event)"
            />
          </div>

          <label class="docs-range">
            <span class="text-muted text-sm">Row height</span>
            <input v-model.number="config.bento.rowHeight" type="range" min="160" max="360" step="10" class="accent-primary">
            <strong class="text-highlighted text-sm">{{ config.bento.rowHeight }}px</strong>
          </label>

          <div class="flex items-center gap-2">
            <span class="text-muted text-sm">Sizing</span>
            <UTabs
              :model-value="config.bento.sizing"
              :items="bentoSizingItems"
              variant="pill"
              size="xs"
              :content="false"
              value-key="value"
              label-key="label"
              @update:model-value="config.bento.sizing = $event as BentoSizing"
            />
          </div>
        </template>

        <label class="docs-range">
          <span class="text-muted text-sm">Spacing</span>
          <input v-model.number="config.spacing" type="range" min="2" max="24" step="2" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ config.spacing }}px</strong>
        </label>

        <label class="docs-range">
          <span class="text-muted text-sm">Padding</span>
          <input v-model.number="config.padding" type="range" min="0" max="12" step="2" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ config.padding }}px</strong>
        </label>

        <div v-if="props.allowThumbnailPicker" class="flex items-center gap-2">
          <span class="text-muted text-sm">Thumbnails</span>
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

      <div class="docs-demo__preview">
        <div class="docs-preview-frame" :style="{ width: `${width}px`, maxWidth: '100%' }">
          <PhotoAlbum
            :photos="previewPhotos"
            :layout="albumLayout"
            :spacing="spacingValue"
            :padding="paddingValue"
            :lightbox="props.allowLightboxToggle ? lightboxEnabled : true"
            :class="{ 'docs-demo--hero-album': hero }"
          >
            <template
              v-if="thumbnailPreset !== 'default'"
              #thumbnail="{ photo, index, hidden }"
            >
              <figure
                class="docs-thumbnail"
                :class="[
                  `docs-thumbnail--${thumbnailPreset}`,
                  { 'docs-thumbnail--is-hidden': hidden },
                ]"
                :style="{ opacity: thumbOpacity(hidden) }"
              >
                <PhotoImage
                  :photo="photo"
                  context="thumb"
                  loading="lazy"
                  class="docs-thumbnail__image"
                />
                <figcaption v-if="thumbnailPreset !== 'hidden-state'" class="docs-thumbnail__caption">
                  <span>{{ photo.caption }}</span>
                  <small>#{{ index + 1 }}</small>
                </figcaption>
                <div v-if="thumbnailPreset === 'badge'" class="docs-thumbnail__badge">
                  {{ index + 1 }}
                </div>
                <div v-if="thumbnailPreset === 'hidden-state'" class="docs-thumbnail__hint">
                  {{ hidden ? 'FLIP source hidden' : 'Visible thumbnail' }}
                </div>
              </figure>
            </template>
          </PhotoAlbum>
        </div>
      </div>

      <div v-if="props.showCode ?? !hero" class="docs-demo__code">
        <div class="docs-demo__code-header">
          <span>Generated usage</span>
          <UBadge variant="subtle" size="sm">
            {{ useResponsiveValues ? 'responsive()' : 'static values' }}
          </UBadge>
        </div>
        <pre><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
