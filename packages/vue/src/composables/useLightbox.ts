import { useLightboxInject } from '../lightbox/inject'
import { createLightboxController } from '../lightbox/controller'

/** Consume the nearest lightbox context as a simple controller/read-model API. */
export function useLightbox() {
  const context = useLightboxInject('useLightbox')
  return createLightboxController(context)
}
