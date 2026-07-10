export interface CarouselGroups {
  readonly slidesBySnap: readonly (readonly number[])[]
  readonly snapBySlide: Readonly<Record<number, number>>
}

/** Build the canonical grouping shared by carousel controls and Embla options. */
export function createCarouselGroups(
  photoCount: number,
  slidesToScroll = 1,
): CarouselGroups {
  const groupSize = Number.isFinite(slidesToScroll)
    ? Math.max(1, Math.floor(slidesToScroll))
    : 1
  const slidesBySnap: number[][] = []

  for (let start = 0; start < photoCount; start += groupSize) {
    slidesBySnap.push(
      Array.from(
        { length: Math.min(groupSize, photoCount - start) },
        (_, offset) => start + offset,
      ),
    )
  }

  return {
    slidesBySnap,
    snapBySlide: Object.fromEntries(
      slidesBySnap.flatMap((slides, snapIndex) =>
        slides.map((slideIndex) => [slideIndex, snapIndex]),
      ),
    ),
  }
}
