import { LightboxContextKey, type InternalLightboxContext } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

/**
 * Inject the single internal lightbox context provided by a `LightboxProvider`
 * ancestor or `useLightboxProvider()` call.
 */
export function useLightboxInject(componentName: string): InternalLightboxContext {
  return requireInjection(
    LightboxContextKey,
    componentName,
    'an active lightbox context. Wrap the component in `<LightboxProvider>` (or call `useLightboxProvider()` in an ancestor), or open photos through `<PhotoGroup>` / a recipe component instead.',
  )
}
