import { useLightboxInject } from './useLightboxInject'
import { createLightboxController } from './lightboxController'

/** Consume the nearest lightbox context as a simple controller/read-model API. */
export function useLightbox() {
  const context = useLightboxInject('useLightbox')
  return createLightboxController(context)
}
