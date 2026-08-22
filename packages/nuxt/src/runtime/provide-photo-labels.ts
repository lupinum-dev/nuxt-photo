import { useNuxtApp } from '#app'
import {
  PhotoLabelsKey,
  resolvePhotoLabels,
  type PhotoLabels,
  type PhotoLabelsInput,
} from '@lupinum/vue-photo'
import { computed, toValue, type ComputedRef } from 'vue'

/** Provide reactive labels from a Nuxt app plugin, outside component setup. */
export function providePhotoLabels(labels: PhotoLabelsInput): ComputedRef<PhotoLabels> {
  const resolved = computed(() => resolvePhotoLabels(toValue(labels)))
  useNuxtApp().vueApp.provide(PhotoLabelsKey, resolved)
  return resolved
}
