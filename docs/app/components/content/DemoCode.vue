<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ code: string }>()
const copied = ref(false)

async function copy() {
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="demo-code">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="copy"
    >
      <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
