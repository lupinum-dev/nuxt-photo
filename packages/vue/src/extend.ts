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

// Full engine composable (returns 50+ properties)
export { useLightboxContext, type LightboxTransitionOption } from './composables/useLightboxContext'

// Provider function (for manual context wiring)
export { provideLightboxContexts } from './provide/lightbox'

// Injection keys and context types
export {
  type LightboxContext,
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

// Deprecated individual keys — kept for backward compatibility
export {
  type LightboxCaptionContext,
  LightboxCaptionKey,
  type LightboxChromeContext,
  LightboxChromeKey,
  type LightboxControllerContext,
  LightboxControllerKey,
  type LightboxOverlayContext,
  LightboxOverlayKey,
  type LightboxPortalContext,
  LightboxPortalKey,
  type LightboxSlidesContext,
  LightboxSlidesKey,
  type LightboxStageContext,
  LightboxStageKey,
  type LightboxTriggerContext,
  LightboxTriggerKey,
} from './provide/keys'
