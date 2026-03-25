<template>
  <div class="code-example">
    <div v-if="title" class="code-example__header">
      <span class="code-example__title">{{ title }}</span>
    </div>
    <Shiki :code="code" :lang="lang || 'vue'" theme="vitesse-dark" class="code-example__block" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  code: string
  lang?: string
  title?: string
}>()
</script>

<style scoped>
.code-example {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.code-example__header {
  padding: 10px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.code-example__title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.code-example__block :deep(pre) {
  margin: 0;
  padding: 20px 24px;
  background: transparent !important;
  overflow-x: auto;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 13px;
  line-height: 1.65;
}

.code-example__block :deep(code) {
  font-family: inherit;
}
</style>
