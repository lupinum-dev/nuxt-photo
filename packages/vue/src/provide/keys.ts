import type { InjectionKey } from 'vue'
import type { ImageAdapter } from '@nuxt-photo/core'
import type { useLightbox } from '../composables/useLightbox'

export type LightboxContext = ReturnType<typeof useLightbox>

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('LightboxContext')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')
