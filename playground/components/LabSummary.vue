<script setup lang="ts">
import type { LabSummary } from '../lab/measurement'
defineProps<{ summary: LabSummary; overlay: boolean }>()
defineEmits<{ toggle: [] }>()
</script>
<template>
  <div>
    Images: {{ summary.images }} · In range (0.9–2×): {{ summary.inRangePercent.toFixed(1) }}% ·
    Floor: {{ summary.floor }} · Median: {{ summary.median.toFixed(2) }}× · Transferred:
    {{ summary.transferredKB.toFixed(1) }} KB · Formats: {{ summary.formats.join(', ') }} · LCP:
    {{ summary.lcpMs.toFixed(0) }} ms ({{ summary.lcpLoading }})
  </div>
  <div>
    Provider: {{ summary.provider }} · Ladder: {{ summary.ladder.join(', ') }} · DPR:
    {{ summary.dpr }}
  </div>
  <button type="button" @click="$emit('toggle')">
    {{ overlay ? 'Hide overlay' : 'Show overlay' }}
  </button>
</template>
