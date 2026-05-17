import { computeColumnsLayout } from './columns'
import { computeBreakpointSnapshots } from './breakpointSnapshots'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../types'

export interface ColumnsBreakpointSnapshot {
  /** Stable key used as `data-bp` attribute, e.g. "320-639", "1120-inf" */
  spanKey: string
  /** `@container` condition text without the "@container <name>" prefix, e.g. "(min-width: 600px) and (max-width: 1119px)" */
  condition: string
  /** Sample breakpoint width used when computing this snapshot */
  containerWidth: number
  /** Resolved spacing at this breakpoint */
  spacing: number
  /** Resolved padding at this breakpoint */
  padding: number
  /** Layout groups produced by `computeColumnsLayout` at `containerWidth` */
  groups: LayoutGroup[]
}

export interface ColumnsBreakpointSnapshotsOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}

/**
 * Computes per-breakpoint `columns` layout snapshots for SSR.
 * Adjacent breakpoints are merged only when group assignment, spacing, and padding all match.
 */
export function computeColumnsBreakpointSnapshots(
  opts: ColumnsBreakpointSnapshotsOptions,
): ColumnsBreakpointSnapshot[] {
  return computeBreakpointSnapshots({
    ...opts,
    computeLayout: computeColumnsLayout,
  })
}
