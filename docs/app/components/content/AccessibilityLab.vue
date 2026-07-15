<script setup lang="ts">
import { ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const events = ref<string[]>([])
const root = ref<HTMLElement | null>(null)
const code = '<PhotoAlbum :photos="photos" layout="rows" />'
function describe(element: Element | null) {
  if (!element) return 'Unknown element'
  return (
    element.getAttribute('aria-label') ||
    element.textContent?.trim().slice(0, 36) ||
    element.tagName.toLowerCase()
  )
}
function onFocus(event: FocusEvent) {
  events.value = [
    ...events.value.slice(-7),
    `Focus: ${describe(event.target as Element)}`,
  ]
}
function focusFirst() {
  root.value?.querySelector<HTMLElement>('[role="button"]')?.focus()
}
function reset() {
  events.value = []
}
</script>

<template>
  <InteractiveExample
    title="Follow keyboard and focus behavior"
    description="Open with Enter, navigate with arrow keys, and close with Escape."
    @reset="reset"
  >
    <div ref="root" class="accessibility-preview" @focusin="onFocus">
      <PhotoAlbum :photos="demoPhotos.slice(0, 5)" layout="rows" :spacing="6" />
    </div>
    <template #controls>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="focusFirst"
      >
        Focus first photo
      </button>
      <ul class="keyboard-list">
        <li><kbd>Enter</kbd> Open</li>
        <li><kbd>←</kbd><kbd>→</kbd> Navigate</li>
        <li><kbd>Esc</kbd> Close</li>
      </ul>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #events><DemoEvents :events="events" /></template>
  </InteractiveExample>
</template>
