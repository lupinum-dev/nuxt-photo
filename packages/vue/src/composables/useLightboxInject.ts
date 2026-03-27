import { LightboxContextKey, type LightboxContext } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

/**
 * Inject the lightbox context provided by a `LightboxRoot` ancestor.
 * Throws a descriptive error if no lightbox context is available.
 */
export function useLightboxInject(componentName: string): LightboxContext {
  return requireInjection(LightboxContextKey, componentName, 'an active lightbox context')
}
