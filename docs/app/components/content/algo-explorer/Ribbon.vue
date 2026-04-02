<script setup lang="ts">
import { useAlgoExplorer, ratio } from '~/composables/useAlgoExplorer'

const { photos, currentStep } = useAlgoExplorer()

const HEIGHT = 52

const highlights = computed(() => {
  const step = currentStep.value
  if (!step) return {}

  const map: Record<number, 'evaluating' | 'best' | 'placed'> = {}

  if (step.type === 'done') {
    for (let k = 1; k < step.path.length; k++) {
      for (let idx = step.path[k - 1]!; idx < step.path[k]!; idx++) {
        map[idx] = k % 2 === 1 ? 'best' : 'placed'
      }
    }
  }
  else if (step.type === 'evaluate-row' || step.type === 'dijkstra-relax') {
    const s = 'start' in step ? step.start : step.from
    const e = 'end' in step ? step.end : step.to
    for (let idx = s; idx < e; idx++) {
      map[idx] = step.type === 'evaluate-row' && step.improved ? 'best' : 'evaluating'
    }
  }
  else if (step.type === 'greedy-eval') {
    for (const row of step.rows) {
      for (let idx = row.start; idx < row.end; idx++) {
        map[idx] = 'placed'
      }
    }
    for (let idx = step.start; idx < step.end; idx++) {
      map[idx] = step.isNewBest ? 'best' : 'evaluating'
    }
  }
  else if (step.type === 'greedy-cut') {
    for (const row of step.rows) {
      for (let idx = row.start; idx < row.end; idx++) {
        map[idx] = 'placed'
      }
    }
  }
  else if (step.type === 'dijkstra-visit') {
    map[step.node] = 'best'
  }

  return map
})

function photoWidth(p: typeof photos[0]) {
  return ratio(p) * HEIGHT
}

function itemClass(idx: number) {
  const h = highlights.value[idx]
  if (h === 'best') return 'border-green-500 bg-green-500/15 shadow-[0_0_8px_rgba(34,197,94,0.25)]'
  if (h === 'evaluating') return 'border-amber-500 bg-amber-500/15 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
  if (h === 'placed') return 'border-primary/50 bg-primary/8'
  return 'border-default bg-muted/20'
}

function badgeClass(idx: number) {
  const h = highlights.value[idx]
  if (h === 'best') return 'bg-green-500 text-white'
  if (h === 'evaluating') return 'bg-amber-500 text-white'
  if (h === 'placed') return 'bg-primary text-white'
  return 'bg-muted border border-default text-muted'
}
</script>

<template>
  <div>
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Photos (N={{ photos.length }})</div>
    <div class="flex gap-1.5 p-2.5 rounded-lg border border-default bg-muted/10 overflow-x-auto">
      <div
        v-for="(p, idx) in photos"
        :key="p.id"
        class="relative rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300"
        :class="itemClass(idx)"
        :style="{ width: `${photoWidth(p)}px`, height: `${HEIGHT}px` }"
      >
        <span
          class="absolute -top-2 -left-2 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center z-10"
          :class="badgeClass(idx)"
        >
          {{ idx }}
        </span>
        <div class="flex flex-col items-center leading-none gap-0.5">
          <span class="text-xs font-mono font-semibold">{{ p.label }}</span>
          <span class="text-[10px] font-mono text-muted">{{ ratio(p).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
