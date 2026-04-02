<script setup lang="ts">
import { useAlgoExplorer, ALGO_META } from '~/composables/useAlgoExplorer'

const { currentAlgorithm, currentStep } = useAlgoExplorer()

const meta = computed(() => ALGO_META[currentAlgorithm.value])

const activeLine = computed(() => {
  const step = currentStep.value
  if (!step || step.type === 'done') return -1
  if ('pseudoLine' in step) return step.pseudoLine
  return -1
})
</script>

<template>
  <div>
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Pseudocode</div>
    <div class="rounded-lg border border-default overflow-hidden">
      <div class="px-3 py-1.5 bg-muted/30 border-b border-default text-xs font-mono text-muted">
        {{ meta.name }}
      </div>
      <div class="p-3 font-mono text-sm leading-7 overflow-x-auto bg-muted/10">
        <div
          v-for="(line, i) in meta.pseudocode"
          :key="i"
          class="px-2 py-0.5 rounded transition-colors duration-300 whitespace-pre"
          :class="activeLine === i ? 'bg-primary/15 text-default font-semibold' : 'text-muted'"
        >
          <span class="inline-block w-4 mr-2 text-right opacity-40 text-xs">{{ i + 1 }}</span>{{ line }}
        </div>
      </div>
    </div>
  </div>
</template>
