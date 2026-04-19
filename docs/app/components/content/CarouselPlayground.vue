<script setup lang="ts">
import { computed, ref } from 'vue'
import { docsDemoPhotos } from '~/composables/useDocsDemoData'

const showArrows = ref(true)
const showThumbnails = ref(true)
const showCounter = ref(true)
const showDots = ref(false)
const autoplay = ref(false)
const loop = ref(false)
const lightbox = ref(false)
const slideSize = ref('100%')
const slideAspect = ref('16 / 10')

const slideSizeOptions = [
  { label: '100%', value: '100%' },
  { label: '66%', value: '66%' },
  { label: '50%', value: '50%' },
  { label: '40%', value: '40%' }
]

const slideAspectOptions = [
  { label: '16 / 10', value: '16 / 10' },
  { label: '16 / 9', value: '16 / 9' },
  { label: '4 / 3', value: '4 / 3' },
  { label: '1 / 1', value: '1 / 1' }
]

const emblaOptions = computed(() => ({ loop: loop.value }))
const autoplayValue = computed(() => autoplay.value ? { delay: 3500 } : false)

const summary = computed(() => {
  const parts = [
    `${docsDemoPhotos.length} photos`,
    `slide ${slideSize.value}`,
    `aspect ${slideAspect.value}`
  ]
  if (autoplay.value) parts.push('autoplay')
  if (loop.value) parts.push('loop')
  if (lightbox.value) parts.push('lightbox')
  return parts.join(' · ')
})

const codeSnippet = computed(() => {
  const lines: string[] = ['<PhotoCarousel', '  :photos="photos"']
  if (!showArrows.value) lines.push('  :show-arrows="false"')
  if (!showThumbnails.value) lines.push('  :show-thumbnails="false"')
  if (!showCounter.value) lines.push('  :show-counter="false"')
  if (showDots.value) lines.push('  :show-dots="true"')
  if (autoplay.value) lines.push('  :autoplay="{ delay: 3500 }"')
  if (lightbox.value) lines.push('  :lightbox="true"')
  if (loop.value) lines.push('  :options="{ loop: true }"')
  if (slideSize.value !== '100%') lines.push(`  slide-size="${slideSize.value}"`)
  if (slideAspect.value !== '16 / 10') lines.push(`  slide-aspect="${slideAspect.value}"`)
  lines.push('/>')
  return lines.join('\n')
})
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0">
        <h3 class="m-0 text-base font-bold text-highlighted">
          Live carousel playground
        </h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">
          {{ summary }}
        </p>
      </div>
    </div>

    <div class="grid gap-4 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <USwitch
          v-model="showArrows"
          label="Arrows"
        />
        <USwitch
          v-model="showThumbnails"
          label="Thumbnails"
        />
        <USwitch
          v-model="showCounter"
          label="Counter"
        />
        <USwitch
          v-model="showDots"
          label="Dots"
        />
        <USwitch
          v-model="autoplay"
          label="Autoplay"
        />
        <USwitch
          v-model="loop"
          label="Loop"
        />
        <USwitch
          v-model="lightbox"
          label="Lightbox"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-muted text-sm">Slide size</span>
          <UTabs
            :model-value="slideSize"
            :items="slideSizeOptions"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="slideSize = $event as string"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-muted text-sm">Aspect</span>
          <UTabs
            :model-value="slideAspect"
            :items="slideAspectOptions"
            variant="pill"
            size="xs"
            :content="false"
            value-key="value"
            label-key="label"
            @update:model-value="slideAspect = $event as string"
          />
        </div>
      </div>

      <div class="mx-auto w-full rounded-2xl p-4 preview-frame-bg">
        <PhotoCarousel
          :photos="docsDemoPhotos"
          :show-arrows="showArrows"
          :show-thumbnails="showThumbnails"
          :show-counter="showCounter"
          :show-dots="showDots"
          :autoplay="autoplayValue"
          :lightbox="lightbox"
          :options="emblaOptions"
          :slide-size="slideSize"
          :slide-aspect="slideAspect"
        />
      </div>

      <div class="border border-default rounded-xl overflow-hidden bg-muted/40">
        <div class="flex justify-between items-center gap-4 px-3.5 py-2.5 border-b border-default text-muted text-xs font-medium uppercase tracking-wide">
          <span>Generated usage</span>
          <UBadge
            variant="subtle"
            size="sm"
          >
            PhotoCarousel
          </UBadge>
        </div>
        <pre class="m-0 px-4 py-3.5 overflow-x-auto text-toned text-sm leading-relaxed font-mono"><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
