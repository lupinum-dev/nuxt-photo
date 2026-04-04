<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageContext } from '@nuxt-photo/core'
import { docsDemoPhotos, formatImageSource, resolveAdapterName, useDocsDemoAdapters } from '~/composables/useDocsDemoData'

type AdapterMode = 'native' | 'nuxt-image' | 'custom'

const mode = ref<AdapterMode>('nuxt-image')
const context = ref<ImageContext>('thumb')
const photoIndex = ref(0)

const adapterModeItems = [
  { label: 'Native', value: 'native' },
  { label: 'Nuxt Image', value: 'nuxt-image' },
  { label: 'Custom', value: 'custom' },
]

const contextItems = [
  { label: 'Thumb', value: 'thumb' },
  { label: 'Slide', value: 'slide' },
]

const adapters = useDocsDemoAdapters()

const currentPhoto = computed(() => docsDemoPhotos[photoIndex.value] ?? docsDemoPhotos[0]!)

const currentAdapter = computed(() => {
  if (mode.value === 'custom') return adapters.customAdapter
  if (mode.value === 'nuxt-image') return adapters.nuxtImageAdapter
  return adapters.nativeAdapter
})

const thumbSource = computed(() => formatImageSource(currentAdapter.value, currentPhoto.value, 'thumb'))
const slideSource = computed(() => formatImageSource(currentAdapter.value, currentPhoto.value, 'slide'))
const activeSource = computed(() => context.value === 'slide' ? slideSource.value : thumbSource.value)

const codeSnippet = computed(() => {
  const prop = mode.value === 'custom' ? ':adapter="myAdapter"' : mode.value === 'native' ? ':adapter="nativeAdapter"' : '/* injected automatically */'
  return [
    `<PhotoImage :photo="photo" context="${context.value}" ${prop !== '/* injected automatically */' ? prop : ''} />`.trim(),
    '',
    `// ${resolveAdapterName(mode.value)} adapter in ${context.value} context`,
  ].join('\n')
})
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0">
        <h3 class="m-0 text-base font-bold text-highlighted">Image adapter playground</h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">Inspect the exact <code>src</code>, <code>srcset</code>, and <code>sizes</code> returned for each delivery strategy.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UTabs
          :model-value="mode"
          :items="adapterModeItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="mode = $event as AdapterMode"
        />

        <UTabs
          :model-value="context"
          :items="contextItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="context = $event as ImageContext"
        />
      </div>
    </div>

    <div class="grid gap-4 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <label class="docs-range inline-flex items-center gap-2.5 px-3 py-2 border border-default rounded-xl bg-elevated">
          <span class="text-muted text-sm">Sample photo</span>
          <input v-model.number="photoIndex" type="range" min="0" :max="docsDemoPhotos.length - 1" step="1" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ currentPhoto.caption }}</strong>
        </label>
      </div>

      <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <div class="grid gap-3.5 p-4 border border-default rounded-2xl bg-elevated card-hover-subtle">
          <header class="flex justify-between items-center gap-3">
            <h4>Thumb context</h4>
            <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
          </header>
          <div class="overflow-hidden rounded-2xl border border-default bg-muted max-w-xs">
            <PhotoImage :photo="currentPhoto" context="thumb" :adapter="currentAdapter" class="w-full block" />
          </div>
          <dl class="grid gap-1">
            <dt class="text-muted">src</dt>
            <dd class="m-0 text-toned text-sm break-all">{{ thumbSource.src }}</dd>
            <dt class="text-muted">sizes</dt>
            <dd class="m-0 text-toned text-sm break-all">{{ thumbSource.sizes }}</dd>
          </dl>
        </div>

        <div class="grid gap-3.5 p-4 border border-default rounded-2xl bg-elevated card-hover-subtle">
          <header class="flex justify-between items-center gap-3">
            <h4>Slide context</h4>
            <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
          </header>
          <div class="overflow-hidden rounded-2xl border border-default bg-muted min-h-60 grid place-items-center p-3">
            <PhotoImage :photo="currentPhoto" context="slide" :adapter="currentAdapter" class="w-full block max-h-70 w-auto max-w-full" />
          </div>
          <dl class="grid gap-1">
            <dt class="text-muted">src</dt>
            <dd class="m-0 text-toned text-sm break-all">{{ slideSource.src }}</dd>
            <dt class="text-muted">sizes</dt>
            <dd class="m-0 text-toned text-sm break-all">{{ slideSource.sizes }}</dd>
          </dl>
        </div>
      </div>

      <div class="border border-default rounded-xl overflow-hidden bg-muted/40">
        <div class="flex justify-between items-center gap-4 px-3.5 py-2.5 border-b border-default text-muted text-xs font-medium uppercase tracking-wide">
          <span>Resolved {{ context }} source</span>
          <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
        </div>
        <pre class="m-0 px-4 py-3.5 overflow-x-auto text-toned text-sm leading-relaxed font-mono"><code>{{ codeSnippet }}</code></pre>
      </div>

      <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        <div>
          <strong>Active src</strong>
          <p class="m-0 text-toned text-sm break-all">{{ activeSource.src }}</p>
        </div>
        <div>
          <strong>Active srcset</strong>
          <p class="m-0 text-toned text-sm break-all">{{ activeSource.srcset }}</p>
        </div>
        <div>
          <strong>Active sizes</strong>
          <p class="m-0 text-toned text-sm break-all">{{ activeSource.sizes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
