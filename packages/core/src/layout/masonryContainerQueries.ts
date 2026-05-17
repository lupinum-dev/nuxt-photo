import { computeMasonryLayout } from './masonry'
import { computeBreakpointSnapshots } from './breakpointSnapshots'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../types'

export interface MasonryBreakpointSnapshot {
  spanKey: string
  condition: string
  containerWidth: number
  spacing: number
  padding: number
  groups: LayoutGroup[]
}

export interface MasonryBreakpointSnapshotsOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}

/**
 * Computes per-breakpoint `masonry` layout snapshots for SSR.
 * Adjacent breakpoints are merged only when group assignment, spacing, and padding all match.
 */
export function computeMasonryBreakpointSnapshots(
  opts: MasonryBreakpointSnapshotsOptions,
): MasonryBreakpointSnapshot[] {
  return computeBreakpointSnapshots({
    ...opts,
    computeLayout: computeMasonryLayout,
  })
}
