<script setup lang="ts">
import { computed, nextTick, ref, useId, useSlots } from 'vue'

type PanelId = 'code' | 'state'

const {
  title,
  description,
  headingLevel = 2,
} = defineProps<{
  title: string
  description?: string
  headingLevel?: 2 | 3
}>()

const emit = defineEmits<{ reset: [] }>()
const slots = useSlots()
const instanceId = useId()
const activePanel = ref<PanelId>('code')

const panels = computed(() =>
  [
    { id: 'code' as const, label: 'Code', icon: 'i-lucide-code-2' },
    { id: 'state' as const, label: 'State', icon: 'i-lucide-braces' },
  ].filter((panel) => slots[panel.id]),
)

const selectedPanel = computed<PanelId>(() => {
  if (panels.value.some((panel) => panel.id === activePanel.value)) return activePanel.value
  return panels.value[0]?.id ?? 'code'
})

function tabId(panel: PanelId) {
  return `${instanceId}-tab-${panel}`
}

function panelId(panel: PanelId) {
  return `${instanceId}-panel-${panel}`
}

async function selectPanel(panel: PanelId, target?: HTMLElement) {
  activePanel.value = panel
  await nextTick()
  target?.focus()
}

function handleTabKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

  event.preventDefault()
  const available = panels.value
  if (!available.length) return

  let nextIndex = index
  if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = available.length - 1
  else if (event.key === 'ArrowRight') nextIndex = (index + 1) % available.length
  else nextIndex = (index - 1 + available.length) % available.length

  const tablist = (event.currentTarget as HTMLElement).parentElement
  const target = tablist?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]
  void selectPanel(available[nextIndex]!.id, target)
}
</script>

<template>
  <section class="docs-lab not-prose" :aria-label="title">
    <header class="docs-lab__header">
      <div>
        <component :is="`h${headingLevel}`" class="docs-lab__title">{{ title }}</component>
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
          v-for="(panel, index) in panels"
          :key="panel.id"
          :id="tabId(panel.id)"
          type="button"
          role="tab"
          :tabindex="selectedPanel === panel.id ? 0 : -1"
          :aria-selected="selectedPanel === panel.id"
          :aria-controls="panelId(panel.id)"
          @click="selectPanel(panel.id)"
          @keydown="handleTabKeydown($event, index)"
        >
          <Icon :name="panel.icon.replace('i-lucide-', 'lucide:')" aria-hidden="true" />
          {{ panel.label }}
        </button>
      </div>
      <div
        v-for="panel in panels"
        v-show="selectedPanel === panel.id"
        :id="panelId(panel.id)"
        :key="panel.id"
        role="tabpanel"
        tabindex="0"
        :aria-labelledby="tabId(panel.id)"
      >
        <slot :name="panel.id" />
      </div>
    </div>
  </section>
</template>
