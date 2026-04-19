<script setup lang="ts">
const { seo } = useAppConfig()

const { data: navigation } = await useAsyncData('navigation', () => {
  return queryCollectionNavigation('docs')
})
const { data: files } = useLazyAsyncData('search', () => {
  return queryCollectionSearchSections('docs')
}, {
  server: false
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image',
  titleTemplate(title) {
    return title?.includes('Nuxt Photo') ? title : `${title} · Nuxt Photo`
  }
})

provide('navigation', navigation)

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
    <UMain class="relative">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch :files="files || []" :navigation="navigation || []" :links="links" />
    </ClientOnly>
  </UApp>
</template>
