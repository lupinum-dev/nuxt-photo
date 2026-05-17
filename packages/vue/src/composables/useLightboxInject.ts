import {
  LightboxContextKey,
  type InternalLightboxContext,
} from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

/**
 * Inject the lightbox context provided by a `LightboxProvider` ancestor or
 * `useLightboxProvider()` call.
 * Throws a descriptive error if no lightbox context is available.
 */
export function useLightboxInject(
  componentName: string,
): InternalLightboxContext {
  return requireInjection(
    LightboxContextKey,
    componentName,
    'an active lightbox context',
  )
}
