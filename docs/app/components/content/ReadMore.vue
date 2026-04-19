<script setup lang="ts">
defineProps<{
  to: string
  title?: string
  target?: string
}>()
</script>

<template>
  <ULink
    :to="to"
    :target="target"
    class="group inline-flex items-center gap-1 text-primary font-medium hover:underline"
  >
    <span>{{ title ?? 'Read more' }}</span>
    <UIcon
      name="i-lucide-arrow-right"
      class="size-4 transition-transform group-hover:translate-x-0.5"
    />
  </ULink>
</template>
