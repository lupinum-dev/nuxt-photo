<script setup lang="ts">
import { useAlgoExplorer, ALGO_META } from '~/composables/useAlgoExplorer'
import type { AlgorithmId } from '~/composables/useAlgoExplorer'

const { results } = useAlgoExplorer()

const algos: AlgorithmId[] = ['knuth-plass', 'greedy', 'dijkstra']

const completedCount = computed(() => algos.filter(a => results.value[a] !== undefined).length)

const maxCost = computed(() => {
  return Math.max(
    ...algos.filter(a => results.value[a]).map(a => results.value[a]!.totalCost),
    1,
  )
})

const bestCost = computed(() => {
  const costs = algos.filter(a => results.value[a]).map(a => results.value[a]!.totalCost)
  return costs.length > 0 ? Math.min(...costs) : 0
})
</script>

<template>
  <div>
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Comparison</div>
    <div class="rounded-lg border border-default bg-muted/10 p-3">
      <template v-if="completedCount < 2">
        <p class="text-sm text-muted text-center font-mono py-2">
          Run {{ completedCount === 0 ? 'algorithms' : 'another algorithm' }} to compare.
        </p>
      </template>
      <template v-else>
        <div class="space-y-2">
          <div
            v-for="algo in algos"
            :key="algo"
            class="flex items-center gap-2"
          >
            <span class="text-xs font-mono w-16 text-right text-muted truncate">
              {{ ALGO_META[algo].name.split(' ')[0] }}
            </span>
            <div class="flex-1 h-5 bg-muted/20 rounded overflow-hidden">
              <div
                v-if="results[algo]"
                class="h-full rounded transition-all duration-500 flex items-center px-2"
                :class="results[algo]!.totalCost === bestCost ? 'bg-green-500/60' : 'bg-amber-500/40'"
                :style="{ width: `${Math.max(15, (results[algo]!.totalCost / maxCost) * 100)}%` }"
              >
                <span class="text-xs font-mono font-bold text-white whitespace-nowrap">
                  {{ results[algo]!.totalCost.toFixed(0) }}{{ results[algo]!.totalCost === bestCost ? ' \u2605' : '' }}
                </span>
              </div>
              <span v-else class="px-2 text-xs text-muted font-mono leading-5">\u2014</span>
            </div>
          </div>
        </div>
        <p v-if="results['knuth-plass'] && results['dijkstra']" class="text-xs text-muted mt-2 font-mono leading-relaxed">
          DP and Dijkstra produce identical optimal results.{{ results.greedy ? (results.greedy.totalCost > bestCost ? ' Greedy has higher cost.' : ' Greedy matched optimal!') : '' }}
        </p>
      </template>
    </div>
  </div>
</template>
