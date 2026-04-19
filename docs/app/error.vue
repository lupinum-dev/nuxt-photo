<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

const { data: navigation } = await useAsyncData('navigation', () => {
  return queryCollectionNavigation('docs')
})
provide('navigation', navigation)

const { data: files } = useLazyAsyncData('search', () => {
  return queryCollectionSearchSections('docs')
}, {
  server: false
})

const links = computed(() => [
  ...(navigation.value || []).map(item => ({
    label: item.title,
    icon: item.icon,
    to: item.path === '/docs' ? '/docs/getting-started/introduction' : item.path
  })),
  {
    label: 'lupinum-dev/nuxt-photo',
    to: 'https://github.com/lupinum-dev/nuxt-photo',
    target: '_blank',
    icon: 'i-simple-icons-github'
  }
])
</script>

<template>
  <UApp>
    <AppHeader />
    <UError :error="error" />
    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch :files="files || []" :navigation="navigation || []" :links="links" />
    </ClientOnly>
  </UApp>
</template>
