<script setup lang="ts">
withDefaults(
  defineProps<{
    beforeLabel?: string
    afterLabel?: string
  }>(),
  { beforeLabel: 'Before', afterLabel: 'After' },
)
</script>

<template>
  <div class="before-after not-prose">
    <section>
      <p>{{ beforeLabel }}</p>
      <slot name="before" />
    </section>
    <section>
      <p>{{ afterLabel }}</p>
      <slot name="after" />
    </section>
  </div>
</template>
