<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
  }>(),
  { min: 320, max: 1120 },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const presets = [
  { label: 'Phone', width: 375 },
  { label: 'Tablet', width: 720 },
  { label: 'Desktop', width: 1040 },
]
</script>

<template>
  <div class="demo-viewport">
    <div class="demo-viewport__toolbar">
      <span>{{ modelValue }}px container</span>
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
      @input="
        emit(
          'update:modelValue',
          Number(($event.target as HTMLInputElement).value),
        )
      "
    />
    <div class="demo-viewport__stage">
      <div class="demo-viewport__canvas" :style="{ width: `${modelValue}px` }">
        <slot />
      </div>
    </div>
  </div>
</template>
