<script setup lang="ts">
import { useAlgoExplorer, ALGO_META } from '~/composables/useAlgoExplorer'

const { currentAlgorithm } = useAlgoExplorer()

const meta = computed(() => ALGO_META[currentAlgorithm.value])
</script>

<template>
  <div class="rounded-lg border border-default bg-muted/10 p-3.5">
    <p class="text-sm leading-relaxed text-muted mb-3">{{ meta.description }}</p>
    <div class="flex flex-wrap gap-2">
      <UBadge variant="subtle" color="primary" size="sm" class="font-mono">
        Time: {{ meta.time }}
      </UBadge>
      <UBadge variant="subtle" color="info" size="sm" class="font-mono">
        Space: {{ meta.space }}
      </UBadge>
      <UBadge
        variant="subtle"
        :color="meta.optimality === 'Globally optimal' ? 'success' : 'warning'"
        size="sm"
        class="font-mono"
      >
        {{ meta.optimality }}
      </UBadge>
      <UBadge variant="subtle" color="neutral" size="sm" class="font-mono">
        {{ meta.approach }}
      </UBadge>
    </div>
  </div>
</template>
