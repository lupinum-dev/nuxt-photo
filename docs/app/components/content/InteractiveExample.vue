<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

defineProps<{
  title: string
  description?: string
}>()

const emit = defineEmits<{ reset: [] }>()
const slots = useSlots()
const activePanel = ref<'code' | 'state' | 'events'>('code')

const panels = computed(() =>
  [
    { id: 'code' as const, label: 'Code', icon: 'i-lucide-code-2' },
    { id: 'state' as const, label: 'State', icon: 'i-lucide-braces' },
    { id: 'events' as const, label: 'Events', icon: 'i-lucide-list-tree' },
  ].filter((panel) => slots[panel.id]),
)
</script>

<template>
  <section class="docs-lab not-prose" :aria-label="title">
    <header class="docs-lab__header">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <button
        type="button"
        class="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="emit('reset')"
      >
        <Icon name="lucide:rotate-ccw" class="size-4" />
        Reset
      </button>
    </header>

    <div class="docs-lab__workspace" :class="{ 'docs-lab__workspace--solo': !slots.controls }">
      <div class="docs-lab__preview">
        <slot />
      </div>
      <aside v-if="slots.controls" class="docs-lab__controls" aria-label="Example controls">
        <slot name="controls" />
      </aside>
    </div>

    <div v-if="panels.length" class="docs-lab__details">
      <div class="docs-lab__tabs" role="tablist" aria-label="Example details">
        <button
          v-for="panel in panels"
          :key="panel.id"
          :id="`tab-${panel.id}`"
          type="button"
          role="tab"
          :aria-selected="activePanel === panel.id"
          :aria-controls="`panel-${panel.id}`"
          @click="activePanel = panel.id"
        >
          <Icon :name="panel.icon.replace('i-lucide-', 'lucide:')" />
          {{ panel.label }}
        </button>
      </div>
      <div
        v-for="panel in panels"
        v-show="activePanel === panel.id"
        :id="`panel-${panel.id}`"
        :key="panel.id"
        role="tabpanel"
        :aria-labelledby="`tab-${panel.id}`"
      >
        <slot :name="panel.id" />
      </div>
    </div>
  </section>
</template>
