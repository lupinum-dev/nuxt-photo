<script setup lang="ts">
defineProps<{ events: readonly string[] }>()
</script>

<template>
  <ol v-if="events.length" class="demo-events">
    <li v-for="(event, index) in events" :key="`${index}-${event}`">
      <span>{{ String(index + 1).padStart(2, '0') }}</span
      >{{ event }}
    </li>
  </ol>
  <p v-else class="demo-events__empty">Interact with the preview to record events.</p>
</template>
