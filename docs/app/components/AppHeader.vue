<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()
const links = computed(() => [
  {
    label: 'Docs',
    to: '/docs/getting-started/introduction',
    active: route.path.startsWith('/docs'),
    icon: 'i-lucide-book'
  }
])

const navLinks = computed(() => links.value.map((link) => {
  if (link.label === 'Docs') {
    return {
      icon: link.icon,
      title: link.label,
      path: link.to,
      children: navigation.value?.find(item => item.path === '/docs')?.children || []
    }
  }
  return {
    title: link.label,
    path: link.to,
    icon: link.icon
  }
}))
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/" class="inline-flex items-end gap-2" aria-label="Back to home">
        <PhotoLogo />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="links.map(({ icon, ...link }) => link)"
      variant="link"
      :ui="{ link: 'text-highlighted hover:text-primary data-active:text-primary' }"
    />

    <template #right>
      <div class="flex items-center gap-2">
        <UTooltip text="Search" :kbds="['meta', 'K']" :popper="{ strategy: 'absolute' }">
          <UContentSearchButton :label="null" />
        </UTooltip>
        <UColorModeButton />
        <UButton
          to="https://github.com/lupinum-dev/nuxt-photo"
          target="_blank"
          icon="i-simple-icons-github"
          variant="ghost"
          color="neutral"
          aria-label="GitHub repository"
        />
      </div>
    </template>

    <template #body>
      <UContentNavigation
        :navigation="navLinks"
        highlight
        type="single"
        :default-open="$route.path.startsWith('/docs')"
      />

      <div class="flex flex-col gap-y-2 mt-4">
        <USeparator class="mb-4" />
        <UButton
          label="Get started"
          color="neutral"
          to="/docs/getting-started/installation"
          class="flex justify-center text-gray-900 bg-primary sm:hidden"
          external
        />
      </div>
    </template>
  </UHeader>
</template>
