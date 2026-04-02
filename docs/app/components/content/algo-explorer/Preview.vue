<script setup lang="ts">
import { useAlgoExplorer, ratio, ALGO_META } from '~/composables/useAlgoExplorer'

const { photos, steps } = useAlgoExplorer()

const finalStep = computed(() => {
  const last = steps.value[steps.value.length - 1]
  return last?.type === 'done' ? last : null
})

const rows = computed(() => {
  const step = finalStep.value
  if (!step) return []

  return step.rows.map((row) => {
    const h = row.height
    const scale = 0.35
    return {
      ...row,
      scaledHeight: h * scale,
      items: photos.slice(row.start, row.end).map(p => ({
        label: p.label,
        width: h * ratio(p) * scale,
      })),
    }
  })
})

const colors = [
  'from-green-500 to-emerald-400',
  'from-sky-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-amber-500 to-orange-400',
]
</script>

<template>
  <div v-if="finalStep">
    <div class="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Final Layout</div>
    <div class="rounded-lg border border-default bg-muted/10 p-3">
      <div class="space-y-1">
        <div
          v-for="(row, i) in rows"
          :key="i"
          class="flex gap-1"
          :style="{ height: `${row.scaledHeight}px` }"
        >
          <div
            v-for="(item, j) in row.items"
            :key="j"
            class="rounded-sm bg-gradient-to-br relative overflow-hidden"
            :class="colors[i % colors.length]"
            :style="{ width: `${item.width}px` }"
          >
            <span class="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-60">
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
      <div class="mt-2.5 flex items-center gap-2">
        <UBadge color="success" variant="subtle" size="sm">
          {{ ALGO_META[finalStep.algo].name }}
        </UBadge>
        <span class="text-sm font-mono text-muted">
          Cost: <span class="font-semibold text-green-500">{{ finalStep.totalCost.toFixed(0) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
