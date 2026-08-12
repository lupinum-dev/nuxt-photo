<script setup lang="ts">
import type { LightboxTransitionOption, TransitionMode } from '@nuxt-photo/nuxt/app'
import { computed, ref, useId } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const defaults = Object.freeze({ transition: 'auto' as TransitionMode, autoThreshold: 0.55 })
const transitionGroup = `${useId()}-transition`
const transition = ref<TransitionMode>(defaults.transition)
const autoThreshold = ref<number>(defaults.autoThreshold)
const transitionOption = computed<LightboxTransitionOption>(() =>
  transition.value === 'auto'
    ? { mode: 'auto', autoThreshold: autoThreshold.value }
    : transition.value,
)
const transitionKey = computed(() => JSON.stringify(transitionOption.value))
const code = computed(() => {
  const value =
    transition.value === 'auto'
      ? `:transition="{ mode: 'auto', autoThreshold: ${autoThreshold.value.toFixed(2)} }"`
      : `transition="${transition.value}"`

  return `<PhotoAlbum
  :photos="photos"
  layout="rows"
  :spacing="6"
  ${value}
/>`
})

function reset() {
  transition.value = defaults.transition
  autoThreshold.value = defaults.autoThreshold
}
</script>

<template>
  <InteractiveExample
    title="Try the real lightbox runtime"
    description="Open a photo to compare transitions, keyboard navigation, zoom, and gestures."
    @reset="reset"
  >
    <PhotoAlbum
      :key="transitionKey"
      :photos="demoPhotos.slice(0, 6)"
      layout="rows"
      :spacing="6"
      :transition="transitionOption"
    />
    <template #controls>
      <fieldset class="docs-control">
        <legend>Transition</legend>
        <label v-for="value in ['auto', 'flip', 'fade', 'none'] as TransitionMode[]" :key="value">
          <input v-model="transition" type="radio" :name="transitionGroup" :value="value" /><span>{{
            value
          }}</span>
        </label>
      </fieldset>
      <label v-if="transition === 'auto'" class="docs-control docs-control--stacked">
        <span
          >Visible thumbnail threshold <output>{{ Math.round(autoThreshold * 100) }}%</output></span
        >
        <input
          v-model.number="autoThreshold"
          type="range"
          min="0"
          max="1"
          step="0.05"
          aria-label="Visible thumbnail threshold"
        />
      </label>
      <p class="docs-control-note">
        Use
        <kbd class="rounded border border-border bg-muted px-1 py-0.5 font-mono text-foreground"
          >Enter</kbd
        >
        to open, arrow keys to navigate, and
        <kbd class="rounded border border-border bg-muted px-1 py-0.5 font-mono text-foreground"
          >Esc</kbd
        >
        to close. The viewer follows the operating system reduced-motion preference.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state>
      <DemoState
        :value="{
          transition: transitionOption,
          photos: 6,
          lightbox: true,
        }"
      />
    </template>
  </InteractiveExample>
</template>
