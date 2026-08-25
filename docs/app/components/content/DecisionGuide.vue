<script setup lang="ts">
import { computed, ref } from 'vue'

const need = ref<'album' | 'group' | 'carousel' | 'custom'>('album')
const choices = [
  {
    id: 'album' as const,
    label: 'Responsive album',
    description: 'Rows, columns, or masonry with an included lightbox.',
    icon: 'lucide:layout-grid',
    component: 'PhotoAlbum',
    to: '/docs/guides/use-cms-photos',
  },
  {
    id: 'group' as const,
    label: 'Shared lightbox',
    description: 'One navigation order across several rendered sections.',
    icon: 'lucide:gallery-horizontal-end',
    component: 'PhotoGroup',
    to: '/docs/guides/share-one-lightbox',
  },
  {
    id: 'carousel' as const,
    label: 'Swipeable carousel',
    description: 'Horizontal browsing with arrows, thumbnails, and autoplay.',
    icon: 'lucide:gallery-horizontal',
    component: 'PhotoCarousel',
    to: '/docs/guides/build-a-carousel',
  },
  {
    id: 'custom' as const,
    label: 'Custom composition',
    description: 'Your thumbnail layout with Nuxt Photo state and behavior.',
    icon: 'lucide:blocks',
    component: 'LightboxProvider',
    to: '/docs/guides/create-a-custom-thumbnail-layout',
  },
]
const selected = computed(() => choices.find((choice) => choice.id === need.value)!)
</script>

<template>
  <div class="decision-guide not-prose">
    <div class="decision-guide__choices" role="radiogroup" aria-label="Gallery goal">
      <label v-for="choice in choices" :key="choice.id" :data-selected="need === choice.id">
        <input v-model="need" type="radio" name="gallery-goal" :value="choice.id" />
        <Icon :name="choice.icon" class="size-5" />
        <span>
          <strong>{{ choice.label }}</strong>
          <small>{{ choice.description }}</small>
        </span>
      </label>
    </div>
    <div class="decision-guide__answer">
      <span>Recommended starting point</span>
      <code>&lt;{{ selected.component }}&gt;</code>
      <p>{{ selected.description }}</p>
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
