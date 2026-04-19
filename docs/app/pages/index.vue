<script setup lang="ts">
import { responsive } from '@nuxt-photo/vue'
import { docsDemoPhotos, docsHeroPhotos } from '~/composables/useDocsDemoData'

useSeoMeta({
  titleTemplate: '',
  title: 'nuxt-photo',
  ogTitle: 'nuxt-photo',
  description: 'A layered photo gallery and lightbox system for Vue and Nuxt. Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom.',
  ogDescription: 'A layered photo gallery and lightbox system for Vue and Nuxt. Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom.',
})

const showcaseSpacing = responsive({ 0: 4, 600: 8, 1120: 12 })

const layoutSections = [
  {
    key: 'rows',
    title: 'Rows (Justified)',
    icon: 'i-lucide-align-justify',
    description: 'Knuth-Plass dynamic programming fills every row to the container edge while keeping row heights close to your target. No cropping, no gaps.',
    layout: {
      type: 'rows' as const,
      targetRowHeight: responsive({ 0: 180, 640: 240, 1120: 280 }),
    },
  },
  {
    key: 'columns',
    title: 'Columns',
    icon: 'i-lucide-columns-3',
    description: 'Equal-width columns with a shortest-path algorithm that balances column heights. Photos stay in order, columns stay even.',
    layout: {
      type: 'columns' as const,
      columns: responsive({ 0: 2, 640: 3, 1120: 4 }),
    },
  },
  {
    key: 'masonry',
    title: 'Masonry',
    icon: 'i-lucide-layout-grid',
    description: 'Classic Pinterest-style layout. Each photo goes into the shortest column, greedy-placing items to minimize wasted space.',
    layout: {
      type: 'masonry' as const,
      columns: responsive({ 0: 2, 640: 3, 1120: 4 }),
    },
  },
]

const features = [
  { icon: 'i-lucide-zap', title: 'Lightbox included', description: 'FLIP transitions from thumbnail to full-screen, swipe gestures, pinch-to-zoom, keyboard navigation, and spring physics — all built in.' },
  { icon: 'i-lucide-monitor-smartphone', title: 'Responsive by design', description: 'Every numeric option accepts a container-width function. Change columns, spacing, and row height at any breakpoint — no media queries needed.' },
  { icon: 'i-lucide-server', title: 'Zero CLS on SSR', description: 'Server-renders a flex-grow fallback that matches the JS layout. When JS hydrates, there\'s no layout shift — the page looks identical before and after.' },
  { icon: 'i-lucide-image', title: 'Nuxt Image ready', description: 'Automatic @nuxt/image integration. Thumbnails get optimized srcsets for the grid, slides get full-viewport srcsets for the lightbox.' },
  { icon: 'i-lucide-layers', title: 'Layered architecture', description: 'Use the high-level recipe components or drop down to composables and primitives for full control. No black boxes — every layer is replaceable.' },
  { icon: 'i-lucide-puzzle', title: 'Headless mode', description: 'Skip the recipe components entirely. Build your own grid and lightbox using the composables and primitive components with your own markup and styles.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <UPageHero class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950">
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        Photo galleries for <span class="text-primary">Vue & Nuxt</span>.
      </template>

      <template #description>
        Beautiful layouts, smooth FLIP transitions, touch gestures, and zoom — all from a single component. Zero configuration to get started, full control when you need it.
      </template>

      <template #links>
        <UButton to="/getting-started" size="xl" trailing-icon="i-lucide-arrow-right">
          Get started
        </UButton>
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="outline"
          size="xl"
          to="https://github.com/mat4m0/nuxt-photo"
          target="_blank"
        >
          View on GitHub
        </UButton>
      </template>

      <div class="mx-auto w-full max-w-[940px] rounded-2xl overflow-hidden landing-hero-shadow">
        <PhotoAlbum
          :photos="docsHeroPhotos"
          :layout="{ type: 'rows', targetRowHeight: responsive({ 0: 180, 640: 240, 1120: 280 }) }"
          :spacing="8"
          :padding="0"
          :lightbox="true"
        />
      </div>
    </UPageHero>

    <!-- Layout Showcase -->
    <UPageSection
      v-for="(section, index) in layoutSections"
      :key="section.key"
      :icon="section.icon"
      :class="index % 2 === 0 ? 'dark:bg-neutral-950' : 'dark:bg-neutral-950/80'"
      :headline="index === 0 ? 'Layouts' : undefined"
    >
      <template #title>
        {{ section.title }}
      </template>

      <template #description>
        {{ section.description }}
      </template>

      <template v-if="index === 0" #links>
        <UButton
          color="neutral"
          size="lg"
          to="/guides/layouts"
          trailing-icon="i-lucide-arrow-right"
          variant="subtle"
        >
          Explore all layouts
        </UButton>
      </template>

      <div class="mx-auto w-full max-w-[940px] rounded-2xl overflow-hidden p-4 border border-default shadow-sm transition-shadow duration-300 hover:shadow-md landing-layout-bg">
        <PhotoAlbum
          :photos="docsDemoPhotos"
          :layout="section.layout"
          :spacing="showcaseSpacing"
          :padding="0"
          :lightbox="true"
        />
      </div>
    </UPageSection>

    <!-- Features -->
    <UPageSection headline="Features" class="dark:bg-neutral-950">
      <template #title>
        Built for production
      </template>

      <template #description>
        Everything you need to ship a polished gallery experience.
      </template>

      <template #links>
        <UButton
          color="neutral"
          size="lg"
          to="/getting-started/installation"
          trailing-icon="i-lucide-arrow-right"
          variant="subtle"
        >
          Installation
        </UButton>
      </template>

      <template #features>
        <UPageFeature
          v-for="feature in features"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
      </template>
    </UPageSection>

    <!-- CTA -->
    <UPageSection class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900">
      <UPageCTA
        title="From zero to gallery in minutes."
        description="Install the module, add your photos, render a PhotoAlbum. Everything else — lightbox, gestures, zoom, SSR — works out of the box."
        :links="[
          { label: 'Get started', to: '/getting-started', trailingIcon: 'i-lucide-arrow-right' },
          { label: 'View on GitHub', to: 'https://github.com/mat4m0/nuxt-photo', target: '_blank', variant: 'subtle' as const, icon: 'i-simple-icons-github' },
        ]"
        class="dark:bg-neutral-950"
      >
        <StarsBg />
      </UPageCTA>
    </UPageSection>
  </div>
</template>
