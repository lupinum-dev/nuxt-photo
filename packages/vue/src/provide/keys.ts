import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import type { useLightboxContext } from '../composables/useLightboxContext'

export type LightboxContext = ReturnType<typeof useLightboxContext>

export type LightboxSlideRenderer = (props: { photo: PhotoItem; index: number }) => unknown

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('nuxt-photo:lightbox')
export const LightboxSlideRendererKey: InjectionKey<(photo: PhotoItem) => LightboxSlideRenderer | null> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: 'auto' | 'explicit'
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null): void
  unregister(id: symbol): void
  open(photoOrIndex: PhotoItem | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol('nuxt-photo:photo-group')

/**
 * Provide a custom lightbox component globally so Photo/PhotoGroup/PhotoAlbum
 * use it by default without requiring per-instance :lightbox props.
 *
 * Usage in app.vue:
 *   import MyLightbox from '~/components/Lightbox.vue'
 *   provide(LightboxComponentKey, MyLightbox)
 */
export const LightboxComponentKey: InjectionKey<Component> = Symbol('nuxt-photo:lightbox-component')

/** Slot overrides injected by recipe components for customizing InternalLightbox. */
export interface LightboxSlotOverrides {
  toolbar?: (props: { activeIndex: number; count: number; prev: () => void; next: () => void; close: () => void; toggleZoom: () => void; isZoomedIn: boolean; zoomAllowed: boolean; controlsDisabled: boolean }) => unknown
  caption?: (props: { photo: PhotoItem | null; index: number }) => unknown
  slide?: (props: { photo: PhotoItem; index: number; width: number; height: number }) => unknown
}
export const LightboxSlotsKey: InjectionKey<Ref<LightboxSlotOverrides>> = Symbol('nuxt-photo:lightbox-slots')

/** Global defaults for lightbox behaviour, typically provided once at app level. */
export interface LightboxDefaults {
  minZoom?: number
}
export const LightboxDefaultsKey: InjectionKey<LightboxDefaults> = Symbol('nuxt-photo:lightbox-defaults')
