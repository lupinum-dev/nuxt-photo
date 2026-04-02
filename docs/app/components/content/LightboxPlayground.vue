<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LightboxTransitionOption } from '@nuxt-photo/vue/extend'
import LightboxSurface from './lightbox-playground/LightboxSurface.vue'

const props = withDefaults(defineProps<{
  mode?: 'lightbox' | 'transitions' | 'gestures' | 'anatomy' | 'provider'
}>(), {
  mode: 'lightbox',
})

const transitionMode = ref<'auto' | 'flip' | 'fade' | 'none'>('auto')

const transitionModeItems = [
  { label: 'Auto', value: 'auto' },
  { label: 'Flip', value: 'flip' },
  { label: 'Fade', value: 'fade' },
  { label: 'None', value: 'none' },
]

const autoThreshold = ref(0.35)
const minZoom = ref(props.mode === 'gestures' ? 0.75 : 1)

const transitionOption = computed<LightboxTransitionOption>(() => (
  transitionMode.value === 'auto'
    ? { mode: 'auto', autoThreshold: Number(autoThreshold.value.toFixed(2)) }
    : transitionMode.value
))

const surfaceKey = computed(() => [
  props.mode,
  transitionMode.value,
  autoThreshold.value.toFixed(2),
  minZoom.value.toFixed(2),
].join(':'))

const codeSnippet = computed(() => {
  if (props.mode === 'provider') {
    return [
      'const ctx = useLightboxProvider(photos, {',
      "  transition: 'auto',",
      '})',
      '',
      '<LightboxRoot>',
      '  <LightboxOverlay />',
      '  <LightboxViewport>',
      '    <LightboxSlide />',
      '  </LightboxViewport>',
      '  <LightboxControls />',
      '  <LightboxCaption />',
      '  <LightboxPortal />',
      '</LightboxRoot>',
    ].join('\n')
  }

  return [
    '<PhotoAlbum',
    '  :photos="photos"',
    `  :transition="${transitionMode.value === 'auto'
      ? `{ mode: 'auto', autoThreshold: ${Number(autoThreshold.value.toFixed(2))} }`
      : `'${transitionMode.value}'`}"`,
    '/>',
  ].join('\n')
})
</script>

<template>
  <div class="docs-demo not-prose my-8">
    <div class="docs-demo__header">
      <div class="docs-demo__headline">
        <h3 class="docs-demo__title">
          {{ props.mode === 'provider' ? 'Primitive lightbox playground' : 'Lightbox playground' }}
        </h3>
        <p class="docs-demo__subtitle">
          <template v-if="props.mode === 'gestures'">Inspect gesture classification, zoom levels, and pan state while interacting.</template>
          <template v-else-if="props.mode === 'transitions'">Switch transition modes and compare how the same gallery opens and closes.</template>
          <template v-else-if="props.mode === 'anatomy'">See the primitive pieces that make up the default lightbox shell.</template>
          <template v-else-if="props.mode === 'provider'">The same viewer built from `useLightboxProvider`/`useLightboxContext` and the low-level primitives.</template>
          <template v-else>Open a frame and watch the viewer state, active gesture mode, and zoom level update live.</template>
        </p>
      </div>

      <div v-if="props.mode === 'transitions' || props.mode === 'gestures'" class="flex flex-wrap items-center gap-3">
        <UTabs
          v-if="props.mode === 'transitions'"
          :model-value="transitionMode"
          :items="transitionModeItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="transitionMode = $event as typeof transitionMode"
        />

        <label v-if="props.mode === 'gestures'" class="docs-range">
          <span class="text-muted text-sm">Minimum zoom</span>
          <input v-model.number="minZoom" type="range" min="0.5" max="1.25" step="0.05" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ minZoom.toFixed(2) }}</strong>
        </label>
      </div>
    </div>

    <div class="docs-demo__body">
      <div v-if="props.mode === 'transitions'" class="flex flex-wrap items-center gap-3">
        <label class="docs-range">
          <span class="text-muted text-sm">Auto threshold</span>
          <input v-model.number="autoThreshold" type="range" min="0.1" max="0.9" step="0.05" :disabled="transitionMode !== 'auto'" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ autoThreshold.toFixed(2) }}</strong>
        </label>
        <p class="docs-demo__note">
          <strong>`auto`</strong> flips only when the thumbnail is visible enough. The slider changes that visibility threshold.
        </p>
      </div>

      <LightboxSurface
        :key="surfaceKey"
        :mode="props.mode"
        :transition="transitionOption"
        :min-zoom="minZoom"
      />

      <div v-if="props.mode === 'transitions' || props.mode === 'provider'" class="docs-demo__code">
        <div class="docs-demo__code-header">
          <span>{{ props.mode === 'provider' ? 'Provider skeleton' : 'Transition config' }}</span>
          <UBadge variant="subtle" size="sm">{{ props.mode === 'provider' ? 'primitives' : transitionMode }}</UBadge>
        </div>
        <pre><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
