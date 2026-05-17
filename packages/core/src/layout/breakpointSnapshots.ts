import { resolveResponsiveParameter } from '../types'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../types'

export interface BreakpointSnapshot {
  spanKey: string
  condition: string
  containerWidth: number
  spacing: number
  padding: number
  groups: LayoutGroup[]
}

export interface BreakpointSnapshotsOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
  computeLayout(options: {
    photos: PhotoItem[]
    containerWidth: number
    spacing: number
    padding: number
    columns: number
  }): LayoutGroup[]
}

function groupSignature(groups: LayoutGroup[]): string {
  return groups.map((g) => g.entries.map((e) => e.index).join('.')).join('|')
}

export function computeBreakpointSnapshots(
  opts: BreakpointSnapshotsOptions,
): BreakpointSnapshot[] {
  if (opts.photos.length === 0 || opts.breakpoints.length === 0) return []

  const sorted = [...opts.breakpoints]
    .filter((bp) => bp > 0)
    .sort((a, b) => a - b)
  if (sorted.length === 0) return []

  type Entry = {
    bp: number
    sig: string
    groups: LayoutGroup[]
    spacing: number
    padding: number
  }
  const entries: Entry[] = []

  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const columns = resolveResponsiveParameter(opts.columns, bp, 3)
    const groups = opts.computeLayout({
      photos: opts.photos,
      containerWidth: bp,
      spacing,
      padding,
      columns,
    })

    if (groups.length === 0) continue
    entries.push({ bp, sig: groupSignature(groups), groups, spacing, padding })
  }

  if (entries.length === 0) return []

  type Span = {
    fromIdx: number
    toIdx: number
    sig: string
    spacing: number
    padding: number
    groups: LayoutGroup[]
  }
  const spans: Span[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!
    const last = spans[spans.length - 1]
    if (
      last &&
      last.sig === entry.sig &&
      last.spacing === entry.spacing &&
      last.padding === entry.padding
    ) {
      last.toIdx = i
    } else {
      spans.push({
        fromIdx: i,
        toIdx: i,
        sig: entry.sig,
        spacing: entry.spacing,
        padding: entry.padding,
        groups: entry.groups,
      })
    }
  }

  return spans.map((span, index) => {
    const isFirst = index === 0
    const isLast = index === spans.length - 1
    const fromBp = entries[span.fromIdx]!.bp
    const nextBp = !isLast ? entries[spans[index + 1]!.fromIdx]!.bp : null

    let spanKey: string
    let condition: string
    if (spans.length === 1) {
      spanKey = 'bp-all'
      condition = ''
    } else if (isFirst) {
      spanKey = `bp-0-${nextBp! - 1}`
      condition = `(max-width: ${nextBp! - 1}px)`
    } else if (isLast) {
      spanKey = `bp-${fromBp}-inf`
      condition = `(min-width: ${fromBp}px)`
    } else {
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
