import type { InjectionKey } from 'vue'
import type { useLightbox } from '../composables/useLightbox'

export type LightboxContext = ReturnType<typeof useLightbox>

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('LightboxContext')
