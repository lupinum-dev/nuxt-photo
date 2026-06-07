import type { EmblaCarouselType } from 'embla-carousel'

// Embla integration risk:
// This file is the only place in @nuxt-photo/vue that may read Embla private
// runtime state. The private shape is
// api.internalEngine().scrollSnapList.{slidesBySnap,snapBySlide}. The carousel
// recipe needs that grouping to keep dots, thumbnails, counters, and lightbox
// slide activation aligned when slidesToScroll groups multiple photos. If the
// private shape changes, fall back to deterministic slidesToScroll chunks.
// Upgrade rule: before bumping Embla, run this file's canary tests plus the
// PhotoCarousel DOM and SSR tests.

export type EmblaSnapState = {
  slidesBySnap: number[][]
  snapBySlide: Record<number, number>
  snapTotal: number
}

function fallbackSlidesBySnap(photoCount: number, slidesToScroll: unknown) {
  const chunkSize =
    typeof slidesToScroll === 'number' && slidesToScroll > 1
      ? slidesToScroll
      : 1
  const groups: number[][] = []

  for (let start = 0; start < photoCount; start += chunkSize) {
    groups.push(
      Array.from(
        { length: Math.min(chunkSize, photoCount - start) },
        (_, offset) => start + offset,
      ),
    )
  }

  return groups
}

function snapBySlideFromGroups(slidesBySnap: number[][]) {
  return Object.fromEntries(
    slidesBySnap.flatMap((slides, snapIndex) =>
      slides.map((slideIndex) => [slideIndex, snapIndex]),
    ),
  )
}

function isUsableSlidesBySnap(value: unknown): value is number[][] {
  return (
    Array.isArray(value) &&
    value.every(
      (group) =>
        Array.isArray(group) &&
        group.every((slideIndex) => typeof slideIndex === 'number'),
    )
  )
}

function isUsableSnapBySlide(value: unknown): value is Record<number, number> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.values(value).every((snapIndex) => typeof snapIndex === 'number')
  )
}

export function readEmblaSnapStateUnsafe(
  api: EmblaCarouselType,
  photoCount: number,
  slidesToScroll: unknown,
): EmblaSnapState {
  const fallback = fallbackSlidesBySnap(photoCount, slidesToScroll)
  const fallbackState = () => ({
    slidesBySnap: fallback,
    snapBySlide: snapBySlideFromGroups(fallback),
    snapTotal: fallback.length,
  })

  let scrollSnapList: unknown
  try {
    scrollSnapList = api.internalEngine().scrollSnapList
  } catch {
    return fallbackState()
  }

  const slidesBySnap = (scrollSnapList as { slidesBySnap?: unknown })
    .slidesBySnap
  const snapBySlide = (scrollSnapList as { snapBySlide?: unknown }).snapBySlide

  const hasUsableEmblaSnaps =
    isUsableSlidesBySnap(slidesBySnap) &&
    isUsableSnapBySlide(snapBySlide) &&
    (slidesBySnap.length > 1 || photoCount <= 1 || fallback.length <= 1)

  if (!hasUsableEmblaSnaps) {
    return fallbackState()
  }

  return {
    slidesBySnap,
    snapBySlide,
    snapTotal: api.snapList().length || slidesBySnap.length,
  }
}
