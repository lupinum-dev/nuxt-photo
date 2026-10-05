<script setup lang="ts">
import { PhotoImage } from '@lupinum/nuxt-photo/app'

// Browser regression fixture: a caller can supply an auto-prefixed layout hint.
const photos = await useLabPhotos()
const huge = computed(() => photos.value.find((item) => item.id === 'lab/huge')!)
</script>

<template>
  <main style="width: 233px; margin: 40px">
    <PhotoCarousel
      :photos="[huge, photos.find((item) => item.id === 'lab/normal-04')!]"
      slide-size="117px"
    >
      <template #thumb="{ photo }">
        <PhotoImage
          :photo="photo"
          priority
          sizes="auto, 117px"
          class="np-carousel__thumb-img"
          style="width: 117px; height: 88px"
        />
      </template>
    </PhotoCarousel>
  </main>
</template>
