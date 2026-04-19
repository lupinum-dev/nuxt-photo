<script setup lang="ts">
const links = [
  {
    label: 'Report a bug',
    to: 'https://github.com/lupinum-dev/nuxt-photo/issues/new/choose',
    target: '_blank'
  },
  {
    label: 'Star on GitHub',
    to: 'https://github.com/lupinum-dev/nuxt-photo',
    target: '_blank'
  }
]
</script>

<template>
  <UFooter>
    <template #left>
      <span class="inline text-sm">
        Published under
        <a
          href="https://github.com/lupinum-dev/nuxt-photo/tree/main/LICENSE"
          target="_blank"
          class="text-highlighted hover:underline underline-offset-4"
        >MIT license</a>
      </span>
    </template>

    <UNavigationMenu :items="links" variant="link" />

    <template #right>
      <ColorScheme><UColorModeSelect size="sm" variant="ghost" /></ColorScheme>
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/lupinum-dev/nuxt-photo"
        target="_blank"
        aria-label="GitHub repository"
        size="sm"
      />
    </template>
  </UFooter>
</template>
