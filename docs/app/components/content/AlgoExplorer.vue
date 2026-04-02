<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { provideAlgoExplorer } from '~/composables/useAlgoExplorer'
import type { AlgorithmId } from '~/composables/useAlgoExplorer'
import Controls from './algo-explorer/Controls.vue'
import Ribbon from './algo-explorer/Ribbon.vue'
import Explanation from './algo-explorer/Explanation.vue'
import Pseudocode from './algo-explorer/Pseudocode.vue'
import StateTable from './algo-explorer/StateTable.vue'
import Profile from './algo-explorer/Profile.vue'
import Preview from './algo-explorer/Preview.vue'
import Comparison from './algo-explorer/Comparison.vue'

const ctx = provideAlgoExplorer()

const algoTabs: TabsItem[] = [
  { label: 'Knuth-Plass DP', value: 'knuth-plass', icon: 'i-lucide-grid-2x2' },
  { label: 'Greedy', value: 'greedy', icon: 'i-lucide-zap' },
  { label: 'Dijkstra + Heap', value: 'dijkstra', icon: 'i-lucide-route' },
]

const selectedTab = computed({
  get: () => ctx.currentAlgorithm.value,
  set: (v: string | number) => ctx.setAlgorithm(v as AlgorithmId),
})
</script>

<template>
  <div class="not-prose my-8 rounded-xl border border-default overflow-hidden bg-background">
    <!-- Header: Tabs + Controls -->
    <div class="border-b border-default bg-muted/30">
      <div class="px-4 pt-3 pb-0">
        <UTabs
          v-model="selectedTab"
          :items="algoTabs"
          variant="link"
          size="sm"
        />
      </div>
      <Controls />
    </div>

    <!-- Body -->
    <div class="p-4 space-y-4">
      <!-- Profile (compact inline) -->
      <Profile />

      <!-- Photo ribbon -->
      <Ribbon />

      <!-- Explanation + Pseudocode side by side on wider screens -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Explanation />
        <Pseudocode />
      </div>

      <!-- State table -->
      <StateTable />

      <!-- Results row: Preview + Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Preview />
        <Comparison />
      </div>
    </div>
  </div>
</template>
