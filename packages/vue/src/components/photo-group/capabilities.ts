import type { LightboxSlideRenderer } from '../../provide/keys'
import type { PhotoGroupCapability } from './context'

export type IndexedPhotoGroupCapability = {
  readonly renderSlide: LightboxSlideRenderer | null
  readonly thumbnailCandidates: readonly (() => HTMLElement | null)[]
}

/** Build a read-only lookup from descendant registrations. */
export function buildPhotoGroupCapabilityIndex(
  photoIds: ReadonlySet<string>,
  batches: ReadonlyMap<symbol, readonly PhotoGroupCapability[]>,
): ReadonlyMap<string, IndexedPhotoGroupCapability> {
  const indexed = new Map<
    string,
    {
      renderSlide: LightboxSlideRenderer | null
      rendererOwner: symbol | null
      thumbnailCandidates: Array<() => HTMLElement | null>
    }
  >()

  for (const [owner, batch] of batches) {
    for (const capability of batch) {
      if (!photoIds.has(capability.id)) {
        continue
      }

      const entry = indexed.get(capability.id) ?? {
        renderSlide: null,
        rendererOwner: null,
        thumbnailCandidates: [],
      }
      entry.thumbnailCandidates.push(capability.getThumbnailElement)

      if (capability.renderSlide) {
        if (entry.rendererOwner && entry.rendererOwner !== owner) {
          throw new Error(
            `[nuxt-photo] Multiple custom slide renderers registered for photo "${capability.id}"`,
          )
        }
        if (!entry.renderSlide) entry.renderSlide = capability.renderSlide
        entry.rendererOwner = owner
      }

      indexed.set(capability.id, entry)
    }
  }

  return new Map(
    [...indexed].map(([id, entry]) => [
      id,
      {
        renderSlide: entry.renderSlide,
        thumbnailCandidates: entry.thumbnailCandidates,
      },
    ]),
  )
}
