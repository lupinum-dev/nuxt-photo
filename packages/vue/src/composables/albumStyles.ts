import type { CSSProperties, Ref } from 'vue'
import type { LayoutEntry, LayoutGroup } from '../core/index'
import { round } from '../utils/runtime'

export type AlbumStyleContext = {
  containerWidth: number
  spacing: number
  padding: number
  columnsCount: number
  layoutType: 'rows' | 'columns' | 'masonry'
}

export function albumGroupStyle(
  group: LayoutGroup,
  ctx: AlbumStyleContext,
): CSSProperties {
  if (group.type === 'row') {
    return {
      marginBottom:
        group.index < ctx.columnsCount - 1 ? `${ctx.spacing}px` : undefined,
    }
  }

  if (
    ctx.layoutType === 'masonry' ||
    group.columnsGaps === undefined ||
    group.columnsRatios === undefined
  ) {
    return {
      marginLeft: group.index > 0 ? `${ctx.spacing}px` : undefined,
      width: `calc((100% - ${ctx.spacing * (ctx.columnsCount - 1)}px) / ${ctx.columnsCount})`,
    }
  }

  const totalRatio = group.columnsRatios.reduce((acc, v) => acc + v, 0)
  const totalAdjustedGaps = group.columnsRatios.reduce(
    (acc, v, ratioIndex) =>
      acc +
      ((group.columnsGaps![group.index] ?? 0) -
        (group.columnsGaps![ratioIndex] ?? 0)) *
        v,
    0,
  )

  return {
    marginLeft: group.index > 0 ? `${ctx.spacing}px` : undefined,
    width: `calc((100% - ${round(
      (ctx.columnsCount - 1) * ctx.spacing +
        2 * ctx.columnsCount * ctx.padding +
        totalAdjustedGaps,
      3,
    )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
      2 * ctx.padding
    }px)`,
  }
}

export function albumItemStyle(
  entry: LayoutEntry,
  group: LayoutGroup,
  ctx: AlbumStyleContext,
  interactive: Ref<boolean>,
): CSSProperties {
  const cursor = interactive.value ? { cursor: 'pointer' } : {}

  if (group.type === 'row') {
    const gaps =
      ctx.spacing * (entry.itemsCount - 1) + 2 * ctx.padding * entry.itemsCount
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
