<script setup lang="ts">
import { ref } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const events = ref<string[]>([])
const pointers = new Set<number>()
const code = '<PhotoAlbum :photos="photos" transition="auto" />'

function record(message: string) {
  events.value = [...events.value.slice(-7), message]
}
function pointerDown(event: PointerEvent) {
  pointers.add(event.pointerId)
  record(
    `${pointers.size > 1 ? 'Pinch candidate' : 'Pointer down'} at ${Math.round(event.clientX)}, ${Math.round(event.clientY)}`,
  )
}
function pointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  record(`Pointer released; ${pointers.size} active`)
}
function reset() {
  events.value = []
  pointers.clear()
}
</script>

<template>
  <InteractiveExample
    title="Use touch and pointer gestures"
    description="The preview records pointer input. Open the lightbox for real pan, pinch, and swipe behavior."
    @reset="reset"
  >
    <div
      class="gesture-preview"
      @pointerdown="pointerDown"
      @pointerup="pointerUp"
      @pointercancel="pointerUp"
    >
      <PhotoAlbum :photos="demoPhotos.slice(0, 4)" layout="rows" :spacing="6" />
    </div>
    <template #controls>
      <p class="gesture-instructions">
        Open a photo. Drag to navigate, pinch to zoom, pan a zoomed image, or
        swipe down to close.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #events><DemoEvents :events="events" /></template>
  </InteractiveExample>
</template>
