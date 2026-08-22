import { computed, inject, provide, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { PhotoLabelsKey } from './keys'

export interface PhotoLabels {
  photoViewer: string
  previous: string
  next: string
  zoom: string
  fit: string
  close: string
  loadFailed: string
  previousSlide: string
  nextSlide: string
  counter: (index: number, count: number) => string
  goToSlide: (index: number) => string
  viewPhoto: (index: number) => string
}

export const DEFAULT_PHOTO_LABELS: PhotoLabels = {
  photoViewer: 'Photo viewer',
  previous: 'Previous',
  next: 'Next',
  zoom: 'Zoom',
  fit: 'Fit',
  close: 'Close',
  loadFailed: 'Image could not be loaded.',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  counter: (index, count) => `${index} / ${count}`,
  goToSlide: (index) => `Go to slide ${index}`,
  viewPhoto: (index) => `View photo ${index}`,
}

export type PhotoLabelsInput = MaybeRefOrGetter<Partial<PhotoLabels> | undefined>

export function resolvePhotoLabels(partial?: Partial<PhotoLabels>): PhotoLabels {
  return partial ? { ...DEFAULT_PHOTO_LABELS, ...partial } : DEFAULT_PHOTO_LABELS
}

export function providePhotoLabels(labels: PhotoLabelsInput): ComputedRef<PhotoLabels> {
  const resolved = computed(() => resolvePhotoLabels(toValue(labels)))
  provide(PhotoLabelsKey, resolved)
  return resolved
}

export function usePhotoLabels(): ComputedRef<PhotoLabels> {
  return inject(
    PhotoLabelsKey,
    computed(() => DEFAULT_PHOTO_LABELS),
  )
}
