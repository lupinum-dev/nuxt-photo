<script setup lang="ts">
import { useAlgoExplorer } from '~/composables/useAlgoExplorer'

const { photos, currentStep, currentAlgorithm } = useAlgoExplorer()

const N = photos.length

const tableData = computed(() => {
  const step = currentStep.value
  const algo = currentAlgorithm.value

  if (algo === 'greedy') {
    const rows: Array<{ start: number; end: number }> = []
    if (step?.type === 'greedy-eval' || step?.type === 'greedy-cut') {
      rows.push(...step.rows)
    }
    else if (step?.type === 'done') {
      return { type: 'greedy-done' as const, rows: step.rows }
    }
    return { type: 'greedy' as const, rows }
  }

  let costs: number[] | null = null
  let ptrs: number[] | null = null
  let highlightI = -1
  let highlightJ = -1
  let updatedIdx = -1

  if (step?.type === 'scan-start') {
    costs = step.minCost
    ptrs = step.pointers
    highlightI = step.i
  }
  else if (step?.type === 'evaluate-row') {
    costs = step.minCost
    ptrs = step.pointers
    highlightI = step.i
    highlightJ = step.j
    if (step.improved) updatedIdx = step.i
  }
  else if (step?.type === 'best-found') {
    costs = step.minCost
    ptrs = step.pointers
    highlightI = step.i
  }
  else if (step?.type === 'dijkstra-visit') {
    costs = step.dist
    ptrs = step.prev
    highlightI = step.node
  }
  else if (step?.type === 'dijkstra-relax') {
    costs = step.dist
    ptrs = step.prev
    highlightI = step.from
    highlightJ = step.to
    if (step.updated) updatedIdx = step.to
  }
  else if (step?.type === 'done' && (step.algo === 'knuth-plass' || step.algo === 'dijkstra')) {
    return { type: 'done-dp' as const, path: step.path, totalCost: step.totalCost }
  }

  return { type: 'dp' as const, costs, ptrs, highlightI, highlightJ, updatedIdx }
})

function fmt(val: number | undefined) {
  if (val === undefined || val === Infinity) return '\u221E'
  return val.toFixed(0)
}

function fmtPtr(val: number | undefined) {
  if (val === undefined || val === -1) return '\u2014'
  return String(val)
}
</script>

<template>
  <div>
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">
      {{ currentAlgorithm === 'greedy' ? 'Rows Built' : 'State Table' }}
    </div>
    <div class="rounded-lg border border-default overflow-hidden bg-muted/10">
      <!-- Greedy rows -->
      <template v-if="tableData.type === 'greedy' || tableData.type === 'greedy-done'">
        <div v-if="tableData.rows.length === 0" class="p-4 text-sm text-muted text-center font-mono">
          Greedy has no DP table \u2014 rows appear as they're cut.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm font-mono">
            <thead>
              <tr class="border-b border-default">
                <th class="px-3 py-1.5 text-left text-muted font-medium">Row</th>
                <th class="px-3 py-1.5 text-left text-muted font-medium">Photos</th>
                <th class="px-3 py-1.5 text-right text-muted font-medium">Height</th>
                <th v-if="tableData.type === 'greedy-done'" class="px-3 py-1.5 text-right text-muted font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in tableData.rows"
                :key="i"
                class="border-b border-default last:border-b-0"
              >
                <td class="px-3 py-1.5 font-semibold">{{ i + 1 }}</td>
                <td class="px-3 py-1.5">{{ row.start }}\u2192{{ row.end - 1 }}</td>
                <td class="px-3 py-1.5 text-right">{{ 'height' in row ? (row as any).height.toFixed(0) : '' }}px</td>
                <td v-if="tableData.type === 'greedy-done'" class="px-3 py-1.5 text-right">{{ 'cost' in row ? (row as any).cost.toFixed(0) : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- DP / Dijkstra: horizontal table (nodes as columns) -->
      <template v-else-if="tableData.type === 'dp' && tableData.costs">
        <div class="overflow-x-auto">
          <table class="w-full text-sm font-mono">
            <thead>
              <tr class="border-b border-default">
                <th class="px-3 py-1.5 text-left text-muted font-medium sticky left-0 bg-muted/30 z-10 min-w-[52px]">Node</th>
                <th
                  v-for="k in N + 1"
                  :key="k - 1"
                  class="px-2.5 py-1.5 text-center font-semibold min-w-[48px] transition-colors duration-200"
                  :class="{
                    'bg-amber-500/10': k - 1 === tableData.highlightI,
                    'bg-sky-500/10': k - 1 === tableData.highlightJ,
                    'bg-green-500/15': k - 1 === tableData.updatedIdx,
                  }"
                >
                  {{ k - 1 }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-default">
                <td class="px-3 py-1.5 text-muted font-medium sticky left-0 bg-muted/30 z-10">
                  {{ currentAlgorithm === 'dijkstra' ? 'dist' : 'cost' }}
                </td>
                <td
                  v-for="k in N + 1"
                  :key="k - 1"
                  class="px-2.5 py-1.5 text-center transition-colors duration-200"
                  :class="{
                    'bg-amber-500/10': k - 1 === tableData.highlightI,
                    'bg-sky-500/10': k - 1 === tableData.highlightJ,
                    'bg-green-500/15 text-green-500 font-bold': k - 1 === tableData.updatedIdx,
                    'text-muted/40': tableData.costs![k - 1] === Infinity,
                  }"
                >
                  {{ fmt(tableData.costs![k - 1]) }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-1.5 text-muted font-medium sticky left-0 bg-muted/30 z-10">
                  {{ currentAlgorithm === 'dijkstra' ? 'prev' : 'ptr' }}
                </td>
                <td
                  v-for="k in N + 1"
                  :key="k - 1"
                  class="px-2.5 py-1.5 text-center transition-colors duration-200"
                  :class="{
                    'bg-amber-500/10': k - 1 === tableData.highlightI,
                    'bg-sky-500/10': k - 1 === tableData.highlightJ,
                    'bg-green-500/15': k - 1 === tableData.updatedIdx,
                    'text-muted/40': tableData.costs![k - 1] === Infinity,
                  }"
                >
                  {{ fmtPtr(tableData.ptrs![k - 1]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Done DP -->
      <template v-else-if="tableData.type === 'done-dp'">
        <div class="p-3 text-sm font-mono">
          <span class="text-green-500 font-semibold">Path: [{{ (tableData as any).path.join(', ') }}]</span>
          <span class="text-muted ml-2">Cost: {{ (tableData as any).totalCost.toFixed(0) }}</span>
        </div>
      </template>

      <!-- Initial -->
      <template v-else>
        <div class="p-4 text-sm text-muted text-center font-mono">
          Step through to see state updates.
        </div>
      </template>
    </div>
  </div>
</template>
