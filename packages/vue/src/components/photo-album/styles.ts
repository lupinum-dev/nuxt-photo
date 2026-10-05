import type { CSSProperties, Ref } from 'vue'
import type { LayoutEntry, LayoutGroup } from '../../core/index'
import { round } from '../../core/utils/math'

export type AlbumStyleContext = {
  containerWidth: number
  spacing: number
  padding: number
  columnsCount: number
  layoutType: 'rows' | 'columns' | 'masonry'
}

export function albumGroupStyle<TMeta extends object>(
  group: LayoutGroup<TMeta>,
  ctx: AlbumStyleContext,
): CSSProperties {
  if (group.type === 'row') {
    return {
      marginBottom: group.index < ctx.columnsCount - 1 ? `${ctx.spacing}px` : undefined,
    }
  }

  const { gaps, fraction } = columnGeometry(group, ctx)
  return {
    marginLeft: group.index > 0 ? `${ctx.spacing}px` : undefined,
    width: `calc((100% - ${round(gaps, 3)}px) * ${round(fraction, 5)} + ${2 * ctx.padding}px)`,
  }
}

function columnGeometry<TMeta extends object>(group: LayoutGroup<TMeta>, ctx: AlbumStyleContext) {
  const baseGaps = (ctx.columnsCount - 1) * ctx.spacing + 2 * ctx.columnsCount * ctx.padding
  if (ctx.layoutType === 'masonry' || !group.columnsGaps || !group.columnsRatios)
    return { gaps: baseGaps, fraction: 1 / ctx.columnsCount }

  const totalRatio = group.columnsRatios.reduce((acc, value) => acc + value, 0)
  const adjustedGaps = group.columnsRatios.reduce(
    (acc, value, index) =>
      acc + ((group.columnsGaps![group.index] ?? 0) - (group.columnsGaps![index] ?? 0)) * value,
    0,
  )
  return {
    gaps: baseGaps + adjustedGaps,
    fraction: (group.columnsRatios[group.index] ?? 0) / totalRatio,
  }
}

/** Content width from the same affine geometry used by the SSR CSS. */
export function albumColumnWidth<TMeta extends object>(
  group: LayoutGroup<TMeta>,
  ctx: AlbumStyleContext,
) {
  const { gaps, fraction } = columnGeometry(group, ctx)
  return (ctx.containerWidth - gaps) * fraction
}

export function albumItemStyle<TMeta extends object>(
  entry: LayoutEntry<TMeta>,
  group: LayoutGroup<TMeta>,
  ctx: AlbumStyleContext,
  interactive: Ref<boolean>,
): CSSProperties {
  const cursor = interactive.value ? { cursor: 'pointer' } : {}

  if (group.type === 'row') {
    const gaps = ctx.spacing * (entry.itemsCount - 1) + 2 * ctx.padding * entry.itemsCount
    return {
      ...cursor,
      boxSizing: 'content-box',
      display: 'block',
      height: 'auto',
      padding: `${ctx.padding}px`,
      width: `calc((100% - ${gaps}px) / ${round((ctx.containerWidth - gaps) / entry.width, 5)})`,
    }
  }

  const isLast = entry.positionIndex === entry.itemsCount - 1
  return {
    ...cursor,
    boxSizing: 'content-box',
    display: 'block',
    height: 'auto',
    padding: `${ctx.padding}px`,
    marginBottom: !isLast ? `${ctx.spacing}px` : undefined,
    width: `calc(100% - ${2 * ctx.padding}px)`,
  }
}
