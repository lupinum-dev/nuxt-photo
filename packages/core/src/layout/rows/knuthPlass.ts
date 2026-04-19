import type { PhotoItem } from '../../types'
import { cost, findIdealNodeSearch } from './helpers'

/**
 * Knuth-Plass DP — O(N·K) with typed arrays.
 * Globally optimal like Dijkstra but with no heap or graph overhead.
 * dp[i] = minimum total cost for laying out photos[0..i-1].
 */
export function findRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const N = photos.length
  if (N === 0) return undefined

  const limitNodeSearch = findIdealNodeSearch(
    photos,
    targetRowHeight,
    containerWidth,
  )

  const minCost = new Float64Array(N + 1).fill(Infinity)
  const pointers = new Int32Array(N + 1).fill(0)
  minCost[0] = 0

  for (let i = 1; i <= N; i++) {
    const start = Math.max(0, i - limitNodeSearch)
    for (let j = i - 1; j >= start; j--) {
      const currentCost = cost(
        photos,
        j,
        i,
        containerWidth,
        targetRowHeight,
        spacing,
        padding,
      )
      if (currentCost === undefined) continue

      const totalCost = minCost[j]! + currentCost
      if (totalCost < minCost[i]!) {
        minCost[i] = totalCost
        pointers[i] = j
      }
    }
  }

  if (minCost[N] === Infinity) return undefined

  // Reconstruct path by walking backwards
  const path: number[] = []
  let curr = N
  while (curr > 0) {
    path.push(curr)
    curr = pointers[curr]!
  }
  path.push(0)
  path.reverse()

  return path
}
