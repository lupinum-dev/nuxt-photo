import type { EmblaCarouselType } from 'embla-carousel'

export interface EmblaSnapModel {
  readonly slidesBySnap: readonly (readonly number[])[]
  readonly snapBySlide: Readonly<Record<number, number>>
}

/**
 * Read the geometry-dependent slide grouping owned by Embla.
 *
 * Embla's public API exposes snap positions, but not the slide-to-snap mapping
 * needed by thumbnail navigation. Keep this exact-version integration in one
 * file so an Embla upgrade has one explicit canary boundary.
 */
export function readEmblaSnapModel(api: EmblaCarouselType): EmblaSnapModel {
  const { slidesBySnap, snapBySlide } = api.internalEngine().scrollSnapList

  if (slidesBySnap.length !== api.snapList().length) {
    throw new Error('[nuxt-photo] Embla snap registry does not match its public snap list')
  }

  return {
    slidesBySnap: slidesBySnap.map((slides) => [...slides]),
    snapBySlide: { ...snapBySlide },
  }
}
