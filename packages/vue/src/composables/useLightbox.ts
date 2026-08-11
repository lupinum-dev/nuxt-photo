import { useLightboxInject } from '../lightbox/inject'
import { createLightboxController } from '../lightbox/controller'
import type { LightboxController } from '../provide/keys'

/** Consume the nearest lightbox context as a simple controller/read-model API. */
export function useLightbox<
  TMeta extends object = Readonly<Record<string, unknown>>,
>(): LightboxController<TMeta> {
  const context = useLightboxInject('useLightbox')
  return createLightboxController<TMeta>(context)
}
