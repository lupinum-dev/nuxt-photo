import { LightboxControllerKey, type LightboxController } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

/** The controller of the nearest lightbox: a photo group's, or a `LightboxProvider`'s. */
export function useLightbox<
  TMeta extends object = Readonly<Record<string, unknown>>,
>(): LightboxController<TMeta> {
  // The key carries no photo metadata type; the caller names it, as with `inject<T>()`.
  return requireInjection(
    LightboxControllerKey,
    'useLightbox',
    'an active lightbox context',
  ) as LightboxController<TMeta>
}
