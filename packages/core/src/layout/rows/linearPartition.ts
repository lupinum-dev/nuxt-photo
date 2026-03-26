import type { PhotoItem } from '../../types'
import { getCommonHeight, ratio } from './helpers'

/**
 * Linear Partition — estimates the ideal number of rows K,
 * then partitions N photos into K groups minimizing the maximum
 * deviation from the target row height. Produces very uniform rows.
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

  // Estimate ideal row count from total aspect ratio
  const totalAspectRatio = photos.reduce((acc, p) => acc + ratio(p), 0)
  const idealRows = Math.max(1, Math.round(totalAspectRatio * targetRowHeight / containerWidth))

  if (idealRows >= N) {
    // One photo per row
    return Array.from({ length: N + 1 }, (_, i) => i)
  }

  if (idealRows === 1) {
    return [0, N]
  }

  // Weights: each photo's contribution is its aspect ratio (wider = more row space)
  const weights = photos.map(p => ratio(p))

  // DP: partition weights[0..N-1] into exactly `idealRows` groups
  // minimizing the sum of squared deviations of each group's height from target
  const K = idealRows

  // dp[i][k] = min cost to partition photos[0..i-1] into k groups
  const dp: Float64Array[] = Array.from({ length: N + 1 }, () => new Float64Array(K + 1).fill(Infinity))
  const split: Int32Array[] = Array.from({ length: N + 1 }, () => new Int32Array(K + 1).fill(0))

  dp[0]![0] = 0

  for (let k = 1; k <= K; k++) {
    for (let i = k; i <= N; i++) {
      for (let j = k - 1; j < i; j++) {
        const height = getCommonHeight(photos.slice(j, i), containerWidth, spacing, padding)
        if (height <= 0) continue

        const groupCost = (height - targetRowHeight) ** 2 * (i - j)
        const total = dp[j]![k - 1]! + groupCost

        if (total < dp[i]![k]!) {
          dp[i]![k] = total
          split[i]![k] = j
        }
      }
    }
  }

  if (dp[N]![K] === Infinity) return undefined

  // Reconstruct path
  const path: number[] = [N]
  let curr = N
  for (let k = K; k > 0; k--) {
    curr = split[curr]![k]!
    path.push(curr)
  }
  path.reverse()

  return path
}
