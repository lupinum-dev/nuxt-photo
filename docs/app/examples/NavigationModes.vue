<script setup lang="ts">
import { ref } from 'vue'
import { PhotoAlbum, type LightboxNavigationMode, type PhotoItem } from '@lupinum/nuxt-photo/app'

defineProps<{ photos: PhotoItem[] }>()

const modes: LightboxNavigationMode[] = ['slide', 'fade', 'crossfade']
const navigation = ref<LightboxNavigationMode>('crossfade')
</script>

<template>
  <fieldset class="modes">
    <legend>Change photos with</legend>
    <label v-for="mode in modes" :key="mode">
      <input v-model="navigation" type="radio" name="navigation-mode" :value="mode" />
      <span>{{ mode }}</span>
    </label>
  </fieldset>
  <PhotoAlbum
    :photos="photos.slice(0, 6)"
    :navigation="navigation"
    :layout="{ type: 'rows', targetRowHeight: 140 }"
    :spacing="6"
  />
</template>

<style scoped>
.modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin: 0 0 16px;
  padding: 0;
  border: 0;
}

.modes legend {
  float: left;
  margin-right: 8px;
  font-size: 14px;
  opacity: 0.75;
}

.modes label {
  position: relative;
}

.modes input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.modes span {
  display: block;
  padding: 4px 12px;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 999px;
  font-size: 13px;
}

.modes input:checked + span {
  border-color: transparent;
  background: color-mix(in srgb, currentColor 14%, transparent);
  font-weight: 600;
}

.modes input:focus-visible + span {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
