<script setup lang="ts">
import { useAlgoExplorer, ALGO_META } from '~/composables/useAlgoExplorer'

const { currentStep, currentAlgorithm, targetRowHeight } = useAlgoExplorer()

const explanation = computed(() => {
  const step = currentStep.value
  if (!step) {
    return {
      badge: 'Ready',
      badgeColor: 'neutral' as const,
      title: 'Ready to start',
      lines: [`Press Play or Step to watch ${ALGO_META[currentAlgorithm.value].name} work through 8 photos.`],
    }
  }

  switch (step.type) {
    case 'init':
      return {
        badge: 'Setup',
        badgeColor: 'info' as const,
        title: 'Initialization',
        lines: step.algo === 'knuth-plass'
          ? ['Create minCost[0..N] = \u221E, minCost[0] = 0', 'Create pointers[0..N] for reconstruction']
          : step.algo === 'greedy'
            ? ['Start at photo 0, scan left-to-right', 'Greedily pick best row break at each point']
            : ['Create dist[0..N] = \u221E, dist[0] = 0', 'Init min-heap with node 0 (cost 0)'],
      }

    case 'scan-start':
      return {
        badge: `i = ${step.i}`,
        badgeColor: 'warning' as const,
        title: `Outer loop: position ${step.i}`,
        lines: [
          `Finding best cost for photos 0..${step.i - 1}`,
          `Trying row starts j in [${step.searchRange[0]}, ${step.searchRange[1]}]`,
        ],
      }

    case 'evaluate-row':
      return {
        badge: step.improved ? 'New best' : 'Skip',
        badgeColor: step.improved ? ('success' as const) : ('error' as const),
        title: `Row [${step.j}\u2192${step.i - 1}]: ${step.rowPhotos.map(p => p.label).join(', ')}`,
        lines: [
          `Height = ${step.commonHeight.toFixed(1)}px (target: ${targetRowHeight}px)`,
          step.cost !== undefined
            ? `Cost = (${step.commonHeight.toFixed(1)} \u2212 ${targetRowHeight})\u00B2 \u00D7 ${step.rowPhotos.length} = ${step.cost.toFixed(0)}`
            : 'Invalid row (height \u2264 0)',
          step.cost !== undefined ? `Total = ${step.totalCost.toFixed(0)}` : '',
          step.improved
            ? `\u2714 minCost[${step.i}] = ${step.totalCost.toFixed(0)}`
            : `\u2718 Current ${step.minCost[step.i]! === Infinity ? '\u221E' : step.minCost[step.i]!.toFixed(0)} is cheaper`,
        ].filter(Boolean),
      }

    case 'best-found':
      return {
        badge: `Done i=${step.i}`,
        badgeColor: 'success' as const,
        title: `Best for position ${step.i}`,
        lines: [
          `minCost[${step.i}] = ${step.bestCost === Infinity ? '\u221E' : step.bestCost.toFixed(0)}`,
          step.bestCost !== Infinity ? `Last row starts at j = ${step.bestJ}` : '',
        ].filter(Boolean),
      }

    case 'greedy-eval':
      return {
        badge: step.isNewBest ? 'Closer' : 'Farther',
        badgeColor: step.isNewBest ? ('success' as const) : ('warning' as const),
        title: `Row from ${step.start}: end = ${step.end}`,
        lines: [
          `Photos: ${step.rowPhotos.map(p => p.label).join(', ')}`,
          `Height = ${step.commonHeight.toFixed(1)}px | diff = ${step.diff.toFixed(1)}px`,
          step.isNewBest ? `\u2714 Best end = ${step.bestEnd}` : `\u2718 Keeping end = ${step.bestEnd}`,
        ],
      }

    case 'greedy-cut':
      return {
        badge: `Row ${step.rows.length}`,
        badgeColor: 'success' as const,
        title: `Cut: photos ${step.start}..${step.end - 1}`,
        lines: [
          `${step.rowPhotos.map(p => p.label).join(', ')} | h = ${step.commonHeight.toFixed(1)}px`,
        ],
      }

    case 'dijkstra-visit':
      return {
        badge: `Node ${step.node}`,
        badgeColor: 'info' as const,
        title: `Pop node ${step.node} (cost ${step.cost.toFixed(0)})`,
        lines: [
          `Distance finalized | Heap: ${step.heapSize}`,
          step.node === 8 ? 'Reached destination!' : `Exploring edges from ${step.node}...`,
        ],
      }

    case 'dijkstra-relax':
      return {
        badge: step.updated ? 'Relaxed' : 'No change',
        badgeColor: step.updated ? ('success' as const) : ('error' as const),
        title: `Edge ${step.from}\u2192${step.to}: ${step.rowPhotos.map(p => p.label).join(', ')}`,
        lines: [
          `Height = ${step.commonHeight.toFixed(1)}px | Edge = ${step.edgeCost.toFixed(0)}`,
          `dist[${step.to}] = ${step.newDist.toFixed(0)}`,
          step.updated ? '\u2714 Shorter path found' : '\u2718 Current path cheaper',
        ],
      }

    case 'done':
      return {
        badge: 'Done',
        badgeColor: 'success' as const,
        title: `${ALGO_META[step.algo].name} complete`,
        lines: [
          `Total cost: ${step.totalCost.toFixed(0)}`,
          `${step.rows.map((r, i) => `R${i + 1}: ${r.start}..${r.end - 1}`).join(' | ')}`,
          step.algo === 'knuth-plass' ? 'Provably optimal \u2014 no better arrangement exists.' : '',
          step.algo === 'greedy' ? 'Fast but possibly suboptimal. Compare with DP!' : '',
          step.algo === 'dijkstra' ? 'Same optimal result as DP, with heap overhead.' : '',
        ].filter(Boolean),
      }

    default:
      return { badge: '...', badgeColor: 'neutral' as const, title: '', lines: [] }
  }
})
</script>

<template>
  <div>
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Explanation</div>
    <div class="rounded-lg border border-default bg-muted/10 p-4 min-h-[120px] relative overflow-hidden">
      <div class="absolute top-0 left-0 w-0.5 h-full bg-primary rounded-r" />
      <div class="flex items-center gap-2 mb-2 pl-2.5">
        <span class="font-mono text-sm font-semibold truncate">{{ explanation.title }}</span>
        <UBadge :color="explanation.badgeColor" variant="subtle" size="sm" class="flex-shrink-0">
          {{ explanation.badge }}
        </UBadge>
      </div>
      <div class="space-y-1 pl-2.5">
        <p
          v-for="(line, i) in explanation.lines"
          :key="i"
          class="text-sm leading-relaxed"
          :class="line.startsWith('\u2714') ? 'text-green-500 font-medium font-mono' : line.startsWith('\u2718') ? 'text-red-400 font-mono' : 'text-muted'"
        >
          {{ line }}
        </p>
      </div>
    </div>
  </div>
</template>
