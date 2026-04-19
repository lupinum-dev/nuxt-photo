import { computeRowsLayout } from './index'
import { round } from '../../utils/math'
import { resolveResponsiveParameter } from '../../types'
import type { LayoutGroup, PhotoItem, ResponsiveParameter } from '../../types'

export interface BreakpointStylesOptions {
  photos: PhotoItem[]
  breakpoints: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  targetRowHeight?: ResponsiveParameter<number>
  containerName: string
}

function rowSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries[g.entries.length - 1]!.index).join(',')
}

/**
 * Generates CSS `@container` rules for each unique Knuth-Plass row layout across the provided
 * breakpoints. Adjacent breakpoints that produce identical row assignments are deduplicated into
 * a single rule — this is mathematically valid because the `calc()` divisor equals
 * `totalAspectRatio / ratio(photo)`, which is independent of container width.
 *
 * The output is scoped to `containerName` so multiple albums on the same page never conflict.
 * Items must carry class `np-item-{index}` for the rules to apply.
 */
export function computeBreakpointStyles(opts: BreakpointStylesOptions): string {
  const { photos, containerName } = opts
  if (photos.length === 0 || opts.breakpoints.length === 0) return ''

  const sorted = [...opts.breakpoints].filter(bp => bp > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return ''

  // 1. Compute layout at each breakpoint
  type BpEntry = { bp: number; sig: string; groups: LayoutGroup[] }
  const bpEntries: BpEntry[] = []
  for (const bp of sorted) {
    const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
    const padding = resolveResponsiveParameter(opts.padding, bp, 0)
    const targetRowHeight = resolveResponsiveParameter(opts.targetRowHeight, bp, 300)
    const groups = computeRowsLayout({ photos, containerWidth: bp, spacing, padding, targetRowHeight })
    if (groups.length === 0 && photos.length > 0) continue
    bpEntries.push({ bp, sig: rowSignature(groups), groups })
  }
  if (bpEntries.length === 0) return ''

  // 2. Collapse adjacent identical layouts into spans
  type Span = { sig: string; fromIdx: number; toIdx: number; groups: LayoutGroup[]; sampleBp: number }
  const spans: Span[] = []
  for (let i = 0; i < bpEntries.length; i++) {
    const e = bpEntries[i]!
    const last = spans[spans.length - 1]
    if (last && last.sig === e.sig) {
      last.toIdx = i
    }
    else {
      spans.push({ sig: e.sig, fromIdx: i, toIdx: i, groups: e.groups, sampleBp: e.bp })
    }
  }

  // 3. Generate CSS rules for each unique span
  const rules: string[] = []
  for (let s = 0; s < spans.length; s++) {
    const span = spans[s]!
    const isFirst = s === 0
    const isLast = s === spans.length - 1
    const sampleBp = span.sampleBp

    const spacing = resolveResponsiveParameter(opts.spacing, sampleBp, 8)
    const padding = resolveResponsiveParameter(opts.padding, sampleBp, 0)

    // Build the @container condition
    let condition: string
    if (spans.length === 1) {
      // Single span: bare @container — always applies within this container
      condition = containerName
    }
    else if (isFirst) {
      const nextBp = bpEntries[span.toIdx + 1]!.bp
      condition = `${containerName} (max-width: ${nextBp - 1}px)`
    }
    else if (isLast) {
      const fromBp = bpEntries[span.fromIdx]!.bp
      condition = `${containerName} (min-width: ${fromBp}px)`
    }
    else {
      const fromBp = bpEntries[span.fromIdx]!.bp
      const nextBp = bpEntries[span.toIdx + 1]!.bp
      condition = `${containerName} (min-width: ${fromBp}px) and (max-width: ${nextBp - 1}px)`
    }

    const itemRules: string[] = []
    for (const group of span.groups) {
      for (const entry of group.entries) {
        const gaps = spacing * (entry.itemsCount - 1) + 2 * padding * entry.itemsCount
        const divisor = round((sampleBp - gaps) / entry.width, 5)
        const paddingPart = padding > 0 ? `padding:${padding}px;` : ''
        itemRules.push(
          `.np-item-${entry.index}{flex:0 0 auto;box-sizing:content-box;${paddingPart}overflow:hidden;width:calc((100% - ${gaps}px) / ${divisor})}`,
        )
      }
    }

    rules.push(`@container ${condition}{\n${itemRules.join('\n')}\n}`)
  }

  return rules.join('\n')
}
