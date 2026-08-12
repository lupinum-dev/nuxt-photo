<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
  }>(),
  { min: 320, max: 1120 },
)

const emit = defineEmits<{
  resize: [value: number]
  'update:modelValue': [value: number]
}>()
const canvas = ref<HTMLElement | null>(null)
const measuredWidth = ref(props.modelValue)
let observer: ResizeObserver | undefined

const presets = computed(() =>
  [
    { label: 'Phone', width: 375 },
    { label: 'Tablet', width: 720 },
    { label: 'Desktop', width: 1040 },
  ].filter((preset) => preset.width >= props.min && preset.width <= props.max),
)

onMounted(() => {
  const element = canvas.value
  if (!element) return

  const update = (width: number) => {
    const rounded = Math.round(width)
    measuredWidth.value = rounded
    emit('resize', rounded)
  }

  update(element.getBoundingClientRect().width)
  observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width
    if (width && width > 0) update(width)
  })
  observer.observe(element)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="demo-viewport">
    <div class="demo-viewport__toolbar">
      <span>
        {{ measuredWidth }}px container<span v-if="measuredWidth !== modelValue">
          ({{ modelValue }}px selected)</span
        >
      </span>
      <div>
        <button
          v-for="preset in presets"
          :key="preset.label"
          type="button"
          :aria-pressed="modelValue === preset.width"
          @click="emit('update:modelValue', preset.width)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    <input
      :value="modelValue"
      type="range"
      :min="props.min"
      :max="props.max"
      step="1"
      aria-label="Preview container width"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
    <div class="demo-viewport__stage">
      <div ref="canvas" class="demo-viewport__canvas" :style="{ width: `${modelValue}px` }">
        <slot />
      </div>
    </div>
  </div>
</template>
