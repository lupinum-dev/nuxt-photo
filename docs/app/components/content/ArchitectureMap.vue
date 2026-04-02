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
  <div class="docs-demo not-prose my-8">
    <div class="docs-demo__header">
      <div class="docs-demo__headline">
        <h3 class="docs-demo__title">{{ props.mode === 'extend' ? 'Extend surfaces' : 'Layer map' }}</h3>
        <p class="docs-demo__subtitle">
          <template v-if="props.mode === 'extend'">The extension API sits beside the public recipes, not underneath them. Pick the lowest layer that still solves the job.</template>
          <template v-else>Every package builds on the layer below it. Click a layer to see what it owns and what it should not do.</template>
        </p>
      </div>
    </div>

    <div class="docs-demo__body">
      <div v-if="props.mode === 'layers'" class="docs-architecture-map">
        <div class="docs-architecture-map__layers">
          <button
            v-for="layer in layers"
            :key="layer.id"
            type="button"
            class="docs-architecture-map__layer"
            :class="{ 'docs-architecture-map__layer--active': activeLayer === layer.id }"
            @click="activeLayer = layer.id"
          >
            <span>{{ layer.label }}</span>
            <strong>{{ layer.packageName }}</strong>
            <small>{{ layer.title }}</small>
          </button>
        </div>

        <div class="docs-architecture-map__detail">
          <UBadge variant="subtle" size="sm">{{ currentLayer.label }}</UBadge>
          <h4>{{ currentLayer.packageName }}</h4>
          <p>{{ currentLayer.title }}</p>
          <ul>
            <li v-for="bullet in currentLayer.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </div>

      <div v-else class="docs-architecture-map docs-architecture-map--extend">
        <div
          v-for="area in extendAreas"
          :key="area.title"
          class="docs-architecture-map__detail"
        >
          <h4>{{ area.title }}</h4>
          <ul>
            <li v-for="bullet in area.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
