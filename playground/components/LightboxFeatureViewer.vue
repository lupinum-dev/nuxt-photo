<template>
  <Lightbox>
    <template #tools="{ photo, index }">
      <span data-testid="tools-slot" :data-photo="photo?.id" :data-index="index" />
    </template>
    <template v-if="replaceActions" #actions="{ activePhoto, close }">
      <button
        class="np-lightbox__btn"
        data-testid="actions-slot"
        :data-photo="activePhoto?.id"
        aria-label="Close custom actions"
        @click="close"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </template>
  </Lightbox>
</template>

<script setup lang="ts">
import { Lightbox } from '@lupinum/nuxt-photo/app'
const replaceActions = useRoute().query.actions === 'replace'
</script>
