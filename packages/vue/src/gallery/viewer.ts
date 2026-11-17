import { onBeforeUnmount, watch, type Component, type ComputedRef } from 'vue'
import type { ResolvedPhotoItem } from '../core/types'
import type { LightboxSlideRenderer } from '../provide/keys'
import type { ProvidedLightbox } from '../composables/provideLightbox'
import type { GalleryRuntime } from './runtime'

/** What a photo group hands to its viewer once the viewer code has loaded. */
export type ViewerBridge = {
  readonly photos: ComputedRef<readonly ResolvedPhotoItem[]>
  readonly gallery: GalleryRuntime
  /** The replacement lightbox component, or null for the built-in one. */
  readonly component: Component | null
  readonly resolveSlide: (photo: ResolvedPhotoItem) => LightboxSlideRenderer | null
  readonly thumbnailFor: (id: string) => HTMLElement | null
  /** The viewer is mounted and can open photos; null when it unmounts. */
  readonly attach: (viewer: ProvidedLightbox<object> | null) => void
}

/**
 * Load the viewer code when a visitor is likely to open a photo: on the first pointer,
 * touch or focus on a trigger inside `root`, or once the browser is idle after a trigger
 * became visible, unless the visitor asked to save data.
 */
export function useViewerIntent(root: () => HTMLElement | null, load: () => void) {
  let cleanup = () => {}
  const stop = watch(
    root,
    (element) => {
      cleanup()
      if (!element) return
      const onIntent = (event: Event) => {
        if (event.target instanceof Element && event.target.closest('[data-np-photo-id]')) done()
      }
      const events = ['pointerover', 'touchstart', 'focusin'] as const
      for (const name of events) element.addEventListener(name, onIntent, { passive: true })

      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData
      let cancelIdle = () => {}
      const observer =
        !saveData && typeof IntersectionObserver === 'function'
          ? new IntersectionObserver((entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return
              observer?.disconnect()
              if (typeof requestIdleCallback === 'function') {
                const id = requestIdleCallback(done, { timeout: 2000 })
                cancelIdle = () => cancelIdleCallback(id)
              } else {
                const id = setTimeout(done, 200)
                cancelIdle = () => clearTimeout(id)
              }
            })
          : null
      const triggers = element.matches('[data-np-photo-id]')
        ? [element]
        : element.querySelectorAll('[data-np-photo-id]')
      for (const trigger of triggers) observer?.observe(trigger)

      cleanup = () => {
        for (const name of events) element.removeEventListener(name, onIntent)
        observer?.disconnect()
        cancelIdle()
        cleanup = () => {}
      }
    },
    { immediate: true, flush: 'post' },
  )
  function done() {
    cleanup()
    stop()
    load()
  }
  onBeforeUnmount(() => {
    cleanup()
    stop()
  })
}
