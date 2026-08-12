<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ code: string }>()
const copied = ref(false)
const copyFailed = ref(false)
let resetTimer: number | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    copyFailed.value = false
  } catch {
    copied.value = false
    copyFailed.value = true
  }

  if (resetTimer) window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    copied.value = false
    copyFailed.value = false
  }, 1600)
}

onBeforeUnmount(() => {
  if (resetTimer) window.clearTimeout(resetTimer)
})
</script>

<template>
  <div class="demo-code">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="copy"
    >
      <Icon
        :name="copied ? 'lucide:check' : copyFailed ? 'lucide:triangle-alert' : 'lucide:copy'"
        class="size-3.5"
        aria-hidden="true"
      />
      Copy
    </button>
    <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{
        copied
          ? 'Code copied to clipboard.'
          : copyFailed
            ? 'Copy failed. Select and copy the code manually.'
            : ''
      }}
    </span>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
