<script setup lang="ts">
import { computed, ref } from 'vue'
import { docsDemoPhotos } from '~/composables/useDocsDemoData'

type CssMode = 'none' | 'structure' | 'all'
type ThemePreset = 'default' | 'sharp-dark' | 'daylight' | 'editorial'

const cssMode = ref<CssMode>('all')
const preset = ref<ThemePreset>('default')

const cssModeItems = [
  { label: 'None', value: 'none' },
  { label: 'Structure', value: 'structure' },
  { label: 'All', value: 'all' },
]

const themePresetItems = [
  { label: 'Default', value: 'default' },
  { label: 'Sharp Dark', value: 'sharp-dark' },
  { label: 'Daylight', value: 'daylight' },
  { label: 'Editorial', value: 'editorial' },
]

const presetVars = computed(() => {
  if (preset.value === 'sharp-dark') {
    return {
      '--np-backdrop-bg': 'rgba(2, 6, 23, 0.96)',
      '--np-backdrop-blur': '0px',
      '--np-btn-bg': 'rgba(255, 255, 255, 0.05)',
      '--np-btn-hover-bg': 'rgba(255, 255, 255, 0.12)',
      '--np-btn-color': '#f8fafc',
      '--np-img-radius': '0px',
      '--np-caption-color': '#f8fafc',
      '--np-caption-secondary': 'rgba(248, 250, 252, 0.7)',
    }
  }

  if (preset.value === 'daylight') {
    return {
      '--np-backdrop-bg': 'rgba(255, 255, 255, 0.92)',
      '--np-backdrop-blur': '20px',
      '--np-btn-bg': 'rgba(15, 23, 42, 0.08)',
      '--np-btn-hover-bg': 'rgba(15, 23, 42, 0.14)',
      '--np-btn-color': '#0f172a',
      '--np-counter-color': 'rgba(15, 23, 42, 0.62)',
      '--np-caption-color': '#0f172a',
      '--np-caption-secondary': 'rgba(15, 23, 42, 0.62)',
    }
  }

  if (preset.value === 'editorial') {
    return {
      '--np-backdrop-bg': 'rgba(34, 17, 9, 0.92)',
      '--np-backdrop-blur': '14px',
      '--np-btn-bg': 'rgba(252, 211, 77, 0.16)',
      '--np-btn-hover-bg': 'rgba(252, 211, 77, 0.26)',
      '--np-btn-color': '#fff7ed',
      '--np-btn-radius': '14px',
      '--np-img-radius': '20px',
      '--np-caption-color': '#fff7ed',
      '--np-caption-secondary': 'rgba(255, 247, 237, 0.72)',
    }
  }

  return {}
})

const codeSnippet = computed(() => {
  const lines = [
    'export default defineNuxtConfig({',
    '  nuxtPhoto: {',
    `    css: '${cssMode.value}',`,
    '  },',
    '})',
  ]

  if (preset.value !== 'default') {
    lines.push('')
    lines.push('.np-lightbox {')
    Object.entries(presetVars.value).slice(0, 5).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value};`)
    })
    lines.push('}')
  }

  return lines.join('\n')
})
</script>

<template>
  <div class="docs-demo not-prose my-8">
    <div class="docs-demo__header">
      <div class="docs-demo__headline">
        <h3 class="docs-demo__title">Theme playground</h3>
        <p class="docs-demo__subtitle">Switch between CSS injection modes, then layer a few variable presets on top of the real recipe components.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UTabs
          :model-value="cssMode"
          :items="cssModeItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="cssMode = $event as CssMode"
        />

        <UTabs
          :model-value="preset"
          :items="themePresetItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="preset = $event as ThemePreset"
        />
      </div>
    </div>

    <div class="docs-demo__body">
      <div class="docs-theme-preview" :class="`docs-theme-preview--${cssMode}`" :style="presetVars">
        <div class="docs-theme-preview__copy">
          <h4>{{ cssMode === 'none' ? 'No built-in preview' : 'Open the lightbox to inspect the theme' }}</h4>
          <p v-if="cssMode === 'none'">
            The docs app already loads recipe CSS globally, so `css: 'none'` is represented as a contract: you own every class and variable, not just the colors.
          </p>
          <p v-else-if="cssMode === 'structure'">
            Structure mode keeps the geometry, transitions, and layout rules. The visual identity comes from your own CSS or utility classes.
          </p>
          <p v-else>
            All mode ships the default theme. The preset buttons here only override CSS custom properties, not the structural rules.
          </p>
        </div>

        <div v-if="cssMode !== 'none'" class="docs-theme-preview__surface">
          <PhotoAlbum :photos="docsDemoPhotos.slice(0, 5)" layout="rows" :spacing="8" />
        </div>
      </div>

      <div class="docs-demo__code">
        <div class="docs-demo__code-header">
          <span>Nuxt config + theme variables</span>
          <UBadge variant="subtle" size="sm">{{ cssMode }}</UBadge>
        </div>
        <pre><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
