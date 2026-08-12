<script setup lang="ts">
import { computed, ref } from 'vue'

const need = ref<'album' | 'group' | 'carousel' | 'custom'>('album')
const choices = [
  {
    id: 'album' as const,
    label: 'Responsive album',
    component: 'PhotoAlbum',
    to: '/docs/guides/build-a-cms-gallery',
  },
  {
    id: 'group' as const,
    label: 'Shared lightbox',
    component: 'PhotoGroup',
    to: '/docs/guides/share-a-lightbox',
  },
  {
    id: 'carousel' as const,
    label: 'Swipeable carousel',
    component: 'PhotoCarousel',
    to: '/docs/guides/build-a-carousel',
  },
  {
    id: 'custom' as const,
    label: 'Custom composition',
    component: 'LightboxProvider',
    to: '/docs/guides/create-a-custom-thumbnail-layout',
  },
]
const selected = computed(() => choices.find((choice) => choice.id === need.value)!)
</script>

<template>
  <div class="decision-guide not-prose">
    <div class="decision-guide__choices" role="radiogroup" aria-label="Gallery goal">
      <button
        v-for="choice in choices"
        :key="choice.id"
        type="button"
        role="radio"
        :aria-checked="need === choice.id"
        @click="need = choice.id"
      >
        {{ choice.label }}
      </button>
    </div>
    <div class="decision-guide__answer">
      <span>Start with</span>
      <code>&lt;{{ selected.component }}&gt;</code>
      <NuxtLink
        :to="selected.to"
        class="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open guide
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </div>
</template>
