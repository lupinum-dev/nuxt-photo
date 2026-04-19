<template>
  <div class="code-example">
    <div v-if="title" class="code-example__header">
      <span class="code-example__title">{{ title }}</span>
    </div>
    <Shiki
      :code="code"
      :lang="lang || 'vue'"
      theme="vitesse-dark"
      class="code-example__block"
    />
  </div>
</template>

<script setup lang="ts">
import type { BundledLanguage } from 'shiki'

defineProps<{
  code: string
  lang?: BundledLanguage | 'text'
  title?: string
}>()
</script>

<style scoped>
.code-example {
  background: rgba(255, 248, 240, 0.025);
  border: 1px solid rgba(200, 149, 108, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.code-example__header {
  padding: 10px 20px;
  border-bottom: 1px solid rgba(200, 149, 108, 0.08);
}

.code-example__title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c8956c;
}

.code-example__block :deep(pre) {
  margin: 0;
  padding: 20px 24px;
  background: transparent !important;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'SF Mono', Monaco, Menlo, monospace;
  font-size: 13px;
  line-height: 1.7;
}

.code-example__block :deep(code) {
  font-family: inherit;
}
</style>
