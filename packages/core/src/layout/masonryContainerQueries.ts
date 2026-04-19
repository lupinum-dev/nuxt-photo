import { computeMasonryLayout } from './masonry'
import { resolveResponsiveParameter } from '../types'
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

function groupSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries.map(e => e.index).join('.')).join('|')
}

/**
 * Computes per-breakpoint `masonry` layout snapshots for SSR.
 * Adjacent breakpoints are merged only when group assignment, spacing, and padding all match.
 */
export function computeMasonryBreakpointSnapshots(
  opts: MasonryBreakpointSnapshotsOptions,
): MasonryBreakpointSnapshot[] {
  if (opts.photos.length === 0 || opts.breakpoints.length === 0) return []

  const sorted = [...opts.breakpoints].filter(bp => bp > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return []

  type Entry = { bp: number; sig: string; groups: LayoutGroup[]; spacing: number; padding: number }
  const entries: Entry[] = []
  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const columns = resolveResponsiveParameter(opts.columns, bp, 3)
    const groups = computeMasonryLayout({ photos: opts.photos, containerWidth: bp, spacing, padding, columns })
    if (groups.length === 0) continue
    entries.push({ bp, sig: groupSignature(groups), groups, spacing, padding })
  }
  if (entries.length === 0) return []

  type Span = { fromIdx: number; toIdx: number; sig: string; spacing: number; padding: number; groups: LayoutGroup[] }
  const spans: Span[] = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!
    const last = spans[spans.length - 1]
    if (last && last.sig === e.sig && last.spacing === e.spacing && last.padding === e.padding) {
      last.toIdx = i
    }
    else {
      spans.push({ fromIdx: i, toIdx: i, sig: e.sig, spacing: e.spacing, padding: e.padding, groups: e.groups })
    }
  }

  return spans.map((span, s) => {
    const isFirst = s === 0
    const isLast = s === spans.length - 1
    const fromBp = entries[span.fromIdx]!.bp
    const nextBp = !isLast ? entries[spans[s + 1]!.fromIdx]!.bp : null

    let spanKey: string
    let condition: string
    if (spans.length === 1) {
      spanKey = 'bp-all'
      condition = ''
    }
    else if (isFirst) {
      spanKey = `bp-0-${nextBp! - 1}`
      condition = `(max-width: ${nextBp! - 1}px)`
    }
    else if (isLast) {
      spanKey = `bp-${fromBp}-inf`
      condition = `(min-width: ${fromBp}px)`
    }
    else {
      spanKey = `bp-${fromBp}-${nextBp! - 1}`
      condition = `(min-width: ${fromBp}px) and (max-width: ${nextBp! - 1}px)`
    }

    return {
      spanKey,
      condition,
      containerWidth: fromBp,
      spacing: span.spacing,
      padding: span.padding,
      groups: span.groups,
    }
  })
}
