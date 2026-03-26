import type { PhotoItem } from '../../types'
import { findShortestPath, type GraphFunction } from '../dijkstra'
import { cost, findIdealNodeSearch } from './helpers'

function makeGetRowNeighbors(
  items: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
  limitNodeSearch: number,
): GraphFunction<number> {
  return (node: number) => {
    const results = new Map<number, number>()
    results.set(node, 0)

    for (let index = node + 1; index < items.length + 1; index += 1) {
      if (index - node > limitNodeSearch) break

      const currentCost = cost(
        items, node, index,
        containerWidth, targetRowHeight,
        spacing, padding,
      )
      if (currentCost === undefined) break
      results.set(index, currentCost)
    }

    return results
  }
}

export function findRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const limitNodeSearch = findIdealNodeSearch(photos, targetRowHeight, containerWidth)

  return findShortestPath(
    makeGetRowNeighbors(photos, containerWidth, targetRowHeight, spacing, padding, limitNodeSearch),
    0,
    photos.length,
  )
}
