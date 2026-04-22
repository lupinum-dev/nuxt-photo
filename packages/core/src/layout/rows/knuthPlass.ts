import type { PhotoItem } from '../../types'
import { cost, findIdealNodeSearch } from './helpers'

/**
 * Find globally optimal row breaks using a Knuth-Plass style DP.
 *
 * Same idea as the TeX line-breaker: pick break points that minimise the total
 * "badness" of all rows, not just each row locally. A greedy packer can pick a
 * good-looking first row and leave an awkwardly short or tall final row;
 * global DP avoids that by considering the whole sequence together.
 *
 * Recurrence:
 *   minCost[0] = 0
 *   minCost[i] = min over j in [i − limitNodeSearch, i) of
 *                  minCost[j] + cost(photos[j..i), container, targetHeight, …)
 *
 * `cost()` returns the squared deviation of the row's scaled height from the
 * target height (see {@link ./helpers}) — rows that are too short or too tall
 * are penalised quadratically, so a mediocre row is preferred to one bad row.
 *
 * `limitNodeSearch` is a dynamic upper bound on how far back `j` ranges for
 * each `i`. A naive search would be O(N²); in practice the optimal break for
 * position i sits a bounded number of photos behind it (no row contains 100
 * photos), so we cap the window and get O(N·K).
 *
 * Path reconstruction: `pointers[i]` stores the `j` that produced `minCost[i]`.
 * We walk pointers from N back to 0 to recover the ordered break indices, then
 * reverse to get [0, …, N].
 *
 * Typed arrays (Float64Array / Int32Array) avoid V8 allocating boxed numbers
 * per cell — meaningful on large galleries (hundreds of photos).
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
