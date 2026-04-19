/**
 * Extension API for building custom lightbox implementations.
 *
 * Import from '@nuxt-photo/vue/extend' when you need:
 * - Full engine access via `useLightboxContext`
 * - Injection keys for custom provide/inject wiring
 * - PhotoGroup context for custom collection components
 *
 * For most use cases, prefer the public API:
 * - `useLightbox` — consuming a lightbox (open/close/nav)
 * - `useLightboxProvider` — building a custom lightbox component
 */

// Full engine composable
export {
  useLightboxContext,
  type LightboxTransitionOption,
} from './composables/useLightboxContext'

// Typed inject helper — use inside primitive components instead of raw inject()
export { useLightboxInject } from './composables/useLightboxInject'

// Provider function (for manual context wiring)
export { provideLightboxContexts } from './provide/lightbox'

// Injection keys and context types
export {
  type LightboxContext,
  type LightboxConsumerAPI,
  type LightboxRenderState,
  type LightboxDOMBindings,
  LightboxContextKey,
  type LightboxSlideRenderer,
  LightboxSlideRendererKey,
  ImageAdapterKey,
  PhotoGroupContextKey,
  type PhotoGroupContext,
  LightboxComponentKey,
  LightboxDefaultsKey,
  type LightboxDefaults,
  LightboxSlotsKey,
  type LightboxSlotOverrides,
} from './provide/keys'

// Slot prop types
export * from './types'
