<script setup lang="ts">
import { ref, useId } from 'vue'

defineProps<{
  title: string
  description?: string
}>()

const emit = defineEmits<{ reset: [] }>()
const showCode = ref(false)
const codeId = useId()
</script>

<template>
  <section class="docs-lab not-prose" :aria-label="title">
    <header class="docs-lab__header">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <button type="button" class="docs-lab__reset" @click="emit('reset')">
        <Icon name="lucide:rotate-ccw" class="size-4" aria-hidden="true" />
        Reset
      </button>
    </header>

    <div class="docs-lab__preview">
      <slot />
    </div>

    <div v-if="$slots.controls || $slots.code" class="docs-lab__footer">
      <div v-if="$slots.controls" class="docs-lab__controls" aria-label="Example controls">
        <slot name="controls" />
      </div>
      <button
        v-if="$slots.code"
        type="button"
        class="docs-lab__toggle"
        :aria-expanded="showCode"
        :aria-controls="codeId"
        @click="showCode = !showCode"
      >
        <Icon
          :name="showCode ? 'lucide:chevron-up' : 'lucide:code'"
          class="size-4"
          aria-hidden="true"
        />
        {{ showCode ? 'Hide code' : 'Show code' }}
      </button>
    </div>

    <div v-if="$slots.code" v-show="showCode" :id="codeId">
      <slot name="code" />
    </div>
  </section>
</template>
