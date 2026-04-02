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
  <div class="docs-demo not-prose my-8">
    <div class="docs-demo__header">
      <div class="docs-demo__headline">
        <h3 class="docs-demo__title">Image adapter playground</h3>
        <p class="docs-demo__subtitle">Inspect the exact <code>src</code>, <code>srcset</code>, and <code>sizes</code> returned for each delivery strategy.</p>
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

    <div class="docs-demo__body">
      <div class="flex flex-wrap items-center gap-3">
        <label class="docs-range">
          <span class="text-muted text-sm">Sample photo</span>
          <input v-model.number="photoIndex" type="range" min="0" :max="docsDemoPhotos.length - 1" step="1" class="accent-primary">
          <strong class="text-highlighted text-sm">{{ currentPhoto.caption }}</strong>
        </label>
      </div>

      <div class="docs-adapter-grid">
        <div class="docs-adapter-preview">
          <header>
            <h4>Thumb context</h4>
            <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
          </header>
          <div class="docs-adapter-preview__frame docs-adapter-preview__frame--thumb">
            <PhotoImage :photo="currentPhoto" context="thumb" :adapter="currentAdapter" class="docs-adapter-preview__image" />
          </div>
          <dl class="docs-adapter-preview__meta">
            <dt>src</dt>
            <dd>{{ thumbSource.src }}</dd>
            <dt>sizes</dt>
            <dd>{{ thumbSource.sizes }}</dd>
          </dl>
        </div>

        <div class="docs-adapter-preview">
          <header>
            <h4>Slide context</h4>
            <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
          </header>
          <div class="docs-adapter-preview__frame docs-adapter-preview__frame--slide">
            <PhotoImage :photo="currentPhoto" context="slide" :adapter="currentAdapter" class="docs-adapter-preview__image docs-adapter-preview__image--slide" />
          </div>
          <dl class="docs-adapter-preview__meta">
            <dt>src</dt>
            <dd>{{ slideSource.src }}</dd>
            <dt>sizes</dt>
            <dd>{{ slideSource.sizes }}</dd>
          </dl>
        </div>
      </div>

      <div class="docs-demo__code">
        <div class="docs-demo__code-header">
          <span>Resolved {{ context }} source</span>
          <UBadge variant="subtle" size="sm">{{ resolveAdapterName(mode) }}</UBadge>
        </div>
        <pre><code>{{ codeSnippet }}</code></pre>
      </div>

      <div class="docs-adapter-details">
        <div>
          <strong>Active src</strong>
          <p>{{ activeSource.src }}</p>
        </div>
        <div>
          <strong>Active srcset</strong>
          <p>{{ activeSource.srcset }}</p>
        </div>
        <div>
          <strong>Active sizes</strong>
          <p>{{ activeSource.sizes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
