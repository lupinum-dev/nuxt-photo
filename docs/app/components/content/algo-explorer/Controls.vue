<script setup lang="ts">
import { useAlgoExplorer } from '~/composables/useAlgoExplorer'

const { isPlaying, isComplete, playbackSpeed, currentStepIndex, totalSteps, play, pause, stepForward, reset } = useAlgoExplorer()

const speedLabel = computed(() => `${(playbackSpeed.value / 1000).toFixed(1)}s`)

const canAdvance = computed(() => !(isComplete.value && currentStepIndex.value >= totalSteps.value - 1))

function togglePlay() {
  if (isPlaying.value) pause()
  else play()
}
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-2.5 border-t border-default bg-muted/20 flex-wrap">
    <div class="flex items-center gap-1">
      <UButton
        :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        size="sm"
        variant="soft"
        :disabled="!canAdvance"
        @click="togglePlay"
      />
      <UButton
        icon="i-lucide-skip-forward"
        size="sm"
        variant="soft"
        :disabled="!canAdvance"
        @click="stepForward"
      />
      <UButton
        icon="i-lucide-rotate-ccw"
        size="sm"
        variant="ghost"
        @click="reset"
      />
    </div>

    <UBadge variant="subtle" color="neutral" size="sm" class="font-mono tabular-nums">
      Step {{ Math.max(0, currentStepIndex + 1) }}{{ totalSteps > 0 ? ` / ${totalSteps}` : '' }}
    </UBadge>

    <div class="flex items-center gap-2 ml-auto text-sm text-muted">
      <span class="font-medium hidden sm:inline">Speed</span>
      <USlider
        v-model="playbackSpeed"
        :min="100"
        :max="2000"
        :step="100"
        :inverted="true"
        class="w-20 sm:w-24"
        size="xs"
      />
      <span class="font-mono text-xs w-8 text-right">{{ speedLabel }}</span>
    </div>
  </div>
</template>
