<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { Ref } from 'vue'
import { computed, inject } from 'vue'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const asideNavigation = computed(
  () => navigation.value.find((item) => item.path === '/docs')?.children || [],
)
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation :navigation="asideNavigation" highlight />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
