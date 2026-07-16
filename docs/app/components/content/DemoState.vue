<script setup lang="ts">
defineProps<{ value: Record<string, unknown> }>()
</script>

<template>
  <pre
    class="demo-state"
  ><code>{{ JSON.stringify(value, null, 2) }}</code></pre>
</template>
