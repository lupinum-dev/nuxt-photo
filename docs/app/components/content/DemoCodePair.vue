<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  padded?: boolean
}>()

const active = ref<'preview' | 'code'>('preview')
</script>

<template>
  <div class="not-prose my-6 rounded-lg border border-default overflow-hidden bg-default">
    <div class="flex items-center gap-1 px-2 py-2 border-b border-default bg-elevated/40">
      <UButton
        label="Preview"
        icon="i-lucide-eye"
        size="xs"
        :color="active === 'preview' ? 'primary' : 'neutral'"
        :variant="active === 'preview' ? 'soft' : 'ghost'"
        @click="active = 'preview'"
      />
      <UButton
        label="Code"
        icon="i-lucide-code"
        size="xs"
        :color="active === 'code' ? 'primary' : 'neutral'"
        :variant="active === 'code' ? 'soft' : 'ghost'"
        @click="active = 'code'"
      />
    </div>
    <div v-show="active === 'preview'" :class="padded ? 'p-4 md:p-6' : ''">
      <slot />
    </div>
    <div v-show="active === 'code'" class="[&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0">
      <slot name="code" />
    </div>
  </div>
</template>
