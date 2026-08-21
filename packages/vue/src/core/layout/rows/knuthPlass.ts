import type { PhotoItem } from '../../types'
import { cost } from './helpers'

/**
 * Find row breaks using a bounded dynamic-programming search.
 *
 * Same idea as the TeX line-breaker: pick break points that minimise the total
 * "badness" of all rows, not just each row locally. A greedy packer can pick a
 * good-looking first row and leave an awkwardly short or tall final row;
 * this bounded DP avoids many of those cases by considering a window of
 * previous breaks for each position.
 *
 * Recurrence:
 *   minCost[0] = 0
 *   minCost[i] = min over j in [start_i, i) of
 *                  minCost[j] + cost(photos[j..i), container, targetHeight, …)
 *
 * `cost()` returns the squared deviation of the row's scaled height from the
 * target height — rows that are too short or too tall are penalised
 * quadratically, so a mediocre row is preferred to one bad row.
 *
 * Per-position window bound: a row of photos with total aspect ratio S renders
 * at height rowWidth/S, so rows shorter than roughly targetRowHeight / 4 would
 * need S > 4·containerWidth/targetRowHeight. Such rows are dominated by any
 * split into smaller rows under quadratic badness, so the search never looks
 * past them: for each end i the window starts at the smallest j whose ratio
 * sum prefix[i] − prefix[j] stays under that bound. The bound is local — one
 * extreme panorama or tall-skinnie elsewhere in the album cannot inflate the
 * window for every position (a global minimum-ratio bound would degrade the
 * whole solve toward O(N²)). A single-photo row is always admissible.
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

  // Prefix sums of aspect ratios: prefix[k] = Σ ratio(photos[t]) for t < k.
  const prefix = new Float64Array(N + 1)
  for (let k = 0; k < N; k++) {
    prefix[k + 1] = prefix[k]! + photos[k]!.width / photos[k]!.height
  }

  const maxRowRatioSum = (4 * containerWidth) / targetRowHeight

  const minCost = new Float64Array(N + 1).fill(Infinity)
  const pointers = new Int32Array(N + 1).fill(0)
  minCost[0] = 0

  let start = 0
  for (let i = 1; i <= N; i++) {
    // Advance the window start while the ratio sum of photos[start..i) still
    // exceeds the short-row bound; such rows are never worth considering.
    // The loop guard keeps at least the single-photo row admissible.
    while (start < i - 1 && prefix[i]! - prefix[start]! > maxRowRatioSum) {
      start++
    }

    for (let j = i - 1; j >= start; j--) {
      const currentCost = cost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
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
