<script setup lang="ts">
import { computed, ref } from 'vue'

type ArchitectureMode = 'layers' | 'extend'
type LayerId = 'core' | 'vue' | 'recipes' | 'nuxt'

const props = withDefaults(defineProps<{
  mode?: ArchitectureMode
}>(), {
  mode: 'layers',
})

const layers = [
  {
    id: 'core' as LayerId,
    packageName: '@nuxt-photo/core',
    label: 'Layer 0',
    title: 'Framework-free engine',
    bullets: ['layout algorithms', 'viewer state machine', 'physics + geometry', 'image adapter types'],
  },
  {
    id: 'vue' as LayerId,
    packageName: '@nuxt-photo/vue',
    label: 'Layer 1',
    title: 'Vue bindings',
    bullets: ['useLightbox / useLightboxProvider', 'primitive lightbox components', 'provide/inject keys'],
  },
  {
    id: 'recipes' as LayerId,
    packageName: '@nuxt-photo/recipes',
    label: 'Layer 2',
    title: 'Ready-to-use recipes',
    bullets: ['PhotoAlbum', 'PhotoGroup', 'Photo', 'default lightbox UI + CSS'],
  },
  {
    id: 'nuxt' as LayerId,
    packageName: '@nuxt-photo/nuxt',
    label: 'Layer 3',
    title: 'Nuxt integration',
    bullets: ['auto-imports', 'component registration', '@nuxt/image bridge', 'global defaults'],
  },
]

const extendAreas = [
  {
    title: 'Global overrides',
    bullets: ['LightboxComponentKey', 'ImageAdapterKey', 'LightboxDefaultsKey'],
  },
  {
    title: 'Custom render surfaces',
    bullets: ['LightboxSlotsKey', 'LightboxSlideRendererKey', 'PhotoGroupContextKey'],
  },
  {
    title: 'Engine access',
    bullets: ['useLightboxContext()', 'LightboxConsumerAPI', 'LightboxRenderState', 'LightboxDOMBindings'],
  },
]

const activeLayer = ref<LayerId>('recipes')

const currentLayer = computed(() => layers.find(layer => layer.id === activeLayer.value) ?? layers[2]!)
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0">
        <h3 class="m-0 text-base font-bold text-highlighted">{{ props.mode === 'extend' ? 'Extend surfaces' : 'Layer map' }}</h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">
          <template v-if="props.mode === 'extend'">The extension API sits beside the public recipes, not underneath them. Pick the lowest layer that still solves the job.</template>
          <template v-else>Every package builds on the layer below it. Click a layer to see what it owns and what it should not do.</template>
        </p>
      </div>
    </div>

    <div class="grid gap-4 p-4">
      <div v-if="props.mode === 'layers'" class="grid gap-4">
        <div class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          <button
            v-for="layer in layers"
            :key="layer.id"
            type="button"
            class="p-4 border border-default rounded-2xl bg-elevated text-left cursor-pointer appearance-none card-hover"
            :class="{ 'arch-layer--active': activeLayer === layer.id }"
            @click="activeLayer = layer.id"
          >
            <span class="block text-muted text-xs uppercase tracking-widest">{{ layer.label }}</span>
            <strong class="block mt-1.5 text-highlighted">{{ layer.packageName }}</strong>
            <small class="block mt-0.5 text-muted">{{ layer.title }}</small>
          </button>
        </div>

        <div class="p-4 border border-default rounded-2xl bg-elevated text-left">
          <UBadge variant="subtle" size="sm">{{ currentLayer.label }}</UBadge>
          <h4 class="m-0 text-highlighted">{{ currentLayer.packageName }}</h4>
          <p class="m-0 text-muted">{{ currentLayer.title }}</p>
          <ul class="mt-3 pl-4 text-toned">
            <li v-for="bullet in currentLayer.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </div>

      <div v-else class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <div
          v-for="area in extendAreas"
          :key="area.title"
          class="p-4 border border-default rounded-2xl bg-elevated text-left"
        >
          <h4 class="m-0 text-highlighted">{{ area.title }}</h4>
          <ul class="mt-3 pl-4 text-toned">
            <li v-for="bullet in area.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
