import { getLoopedIndex } from '../geometry/rect'

export type CollectionItem = { id: string | number }

export interface Collection<T extends CollectionItem> {
  readonly items: readonly T[]
  readonly count: number
  getByIndex(index: number): T | undefined
  getById(id: string | number): T | undefined
  indexOfId(id: string | number): number
  next(currentIndex: number, wrap?: boolean): number
  prev(currentIndex: number, wrap?: boolean): number
  preloadCandidates(currentIndex: number, range?: number): T[]
}

export function createCollection<T extends CollectionItem>(
  items: readonly T[],
): Collection<T> {
  const idToIndex = new Map<string | number, number>()
  for (let i = 0; i < items.length; i++) {
    idToIndex.set(items[i]!.id, i)
  }

  return {
    items,
    count: items.length,

    getByIndex(index: number): T | undefined {
      return items[index]
    },

    getById(id: string | number): T | undefined {
      const index = idToIndex.get(id)
      return index !== undefined ? items[index] : undefined
    },

    indexOfId(id: string | number): number {
      return idToIndex.get(id) ?? -1
    },

    next(currentIndex: number, wrap = true): number {
      if (items.length === 0) return -1
      if (wrap) return getLoopedIndex(currentIndex + 1, items.length)
      return Math.min(currentIndex + 1, items.length - 1)
    },

    prev(currentIndex: number, wrap = true): number {
      if (items.length === 0) return -1
      if (wrap) return getLoopedIndex(currentIndex - 1, items.length)
      return Math.max(currentIndex - 1, 0)
    },

    preloadCandidates(currentIndex: number, range = 1): T[] {
      const candidates: T[] = []
      for (let offset = 1; offset <= range; offset++) {
        const nextIdx = getLoopedIndex(currentIndex + offset, items.length)
        const prevIdx = getLoopedIndex(currentIndex - offset, items.length)
        if (items[nextIdx]) candidates.push(items[nextIdx])
        if (prevIdx !== nextIdx && items[prevIdx])
          candidates.push(items[prevIdx])
      }
      return candidates
    },
  }
}
