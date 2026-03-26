import type { LayoutGroup, RowsAlgorithm, RowsLayoutOptions } from '../../types'
import { findRowBreaks as dijkstra } from './dijkstra'
import { findRowBreaks as greedy } from './greedy'
import { findRowBreaks as knuthPlass } from './knuthPlass'
import { findRowBreaks as linearPartition } from './linearPartition'
import { pathToGroups } from './pathToGroups'

const algorithms: Record<RowsAlgorithm, typeof dijkstra> = {
  'dijkstra': dijkstra,
  'greedy': greedy,
  'knuth-plass': knuthPlass,
  'linear-partition': linearPartition,
}

export function computeRowsLayout(options: RowsLayoutOptions): LayoutGroup[] {
  const {
    photos,
    containerWidth,
    spacing = 8,
    padding = 0,
    targetRowHeight = 300,
    algorithm = 'dijkstra',
  } = options

  if (photos.length === 0) return []

  const findBreaks = algorithms[algorithm]
  const path = findBreaks(photos, containerWidth, targetRowHeight, spacing, padding)
  if (path === undefined) return []

  return pathToGroups(path, photos, containerWidth, spacing, padding)
}
