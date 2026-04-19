import { ref, computed, onMounted, useId, type CSSProperties, type Ref } from 'vue'
import { useContainerWidth } from '@nuxt-photo/vue'
import {
  computeRowsLayout,
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computePhotoSizes,
  resolveResponsiveParameter,
  type PhotoItem,
  type LayoutGroup,
  type LayoutEntry,
  type ResponsiveParameter,
} from '@nuxt-photo/core'

function round(value: number, digits = 0) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export type RowItem = {
  photo: PhotoItem
  index: number
  width: number
  height: number
  style: CSSProperties
  computedSizes?: string
}

export interface PhotoLayoutOptions {
  photos: Ref<PhotoItem[]>
  layout: Ref<'rows' | 'columns' | 'masonry'>
  columns: Ref<ResponsiveParameter<number>>
  spacing: Ref<ResponsiveParameter<number>>
  padding: Ref<ResponsiveParameter<number>>
  targetRowHeight: Ref<ResponsiveParameter<number>>
  defaultContainerWidth?: number
  breakpoints?: readonly number[]
  sizes?: { size: string; sizes?: Array<{ viewport: string; size: string }> }
  interactive: Ref<boolean>
}

export function usePhotoLayout(options: PhotoLayoutOptions) {
  const {
    photos, layout, columns, spacing, padding,
    targetRowHeight,
    defaultContainerWidth, breakpoints, sizes, interactive,
  } = options

  const containerRef = ref<HTMLElement | null>(null)
  const isMounted = ref(false)

  // SSR-safe unique container name for CSS container queries
  const albumId = useId()
  const containerName = computed(() => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`)

  const containerQueriesActive = computed(() =>
    layout.value === 'rows' && !!breakpoints?.length,
  )

  const containerQueryCSS = computed(() => {
    if (!containerQueriesActive.value) return ''
    return computeBreakpointStyles({
      photos: photos.value,
      breakpoints: breakpoints!,
      spacing: spacing.value,
      padding: padding.value,
      targetRowHeight: targetRowHeight.value,
      containerName: containerName.value,
    })
  })

  const { containerWidth } = useContainerWidth(containerRef, {
    defaultContainerWidth,
    breakpoints,
  })

  onMounted(() => {
    isMounted.value = true
  })

  const groups = computed<LayoutGroup[]>(() => {
    if (containerWidth.value <= 0) return []

    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)
    const cols = resolveResponsiveParameter(columns.value, w, 3)
    const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)

    const input = { photos: photos.value, containerWidth: w, spacing: sp, padding: pd }

    switch (layout.value) {
      case 'rows': {
        const result = computeRowsLayout({ ...input, targetRowHeight: trh })
        if (result.length === 0 && photos.value.length > 0) {
          console.warn('[nuxt-photo] rows layout produced no groups — containerWidth may be too small for targetRowHeight')
        }
        return result
      }
      case 'columns':
        return computeColumnsLayout({ ...input, columns: cols })
      case 'masonry':
        return computeMasonryLayout({ ...input, columns: cols })
    }
  })

  const rowItems = computed<RowItem[]>(() => {
    const cursor = interactive.value ? { cursor: 'pointer' as const } : {}
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)
    const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)

    if (containerQueriesActive.value && !defaultContainerWidth) {
      return photos.value.map((photo, index) => ({
        photo, index,
        width: photo.width, height: photo.height,
        style: { ...cursor, overflow: 'hidden' } as CSSProperties,
      }))
    }

    if (containerWidth.value <= 0 || groups.value.length === 0) {
      return photos.value.map((photo, index) => {
        const ar = photo.width / photo.height
        return {
          photo, index,
          width: photo.width, height: photo.height,
          style: { ...cursor, flexGrow: ar, flexBasis: `${trh * ar}px`, overflow: 'hidden' } as CSSProperties,
        }
      })
    }

    return groups.value.flatMap(row =>
      row.entries.map((entry) => {
        const gaps = sp * (entry.itemsCount - 1) + 2 * pd * entry.itemsCount
        return {
          photo: entry.photo,
          index: entry.index,
          width: entry.width,
          height: entry.height,
          computedSizes: computePhotoSizes(entry.width, w, entry.itemsCount, sp, pd, sizes),
          style: {
            ...cursor,
            flex: '0 0 auto',
            boxSizing: 'content-box' as const,
            padding: `${pd}px`,
            overflow: 'hidden',
            width: `calc((100% - ${gaps}px) / ${round((w - gaps) / entry.width, 5)})`,
          } as CSSProperties,
        }
      })
    )
  })

  const ssrWrapperStyle = computed<CSSProperties>(() => {
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const cols = resolveResponsiveParameter(columns.value, w, 3)
    if (layout.value === 'rows') {
      return { display: 'flex', flexWrap: 'wrap', gap: `${sp}px`, width: '100%' }
    }
    return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${sp}px`, width: '100%' }
  })

  function ssrItemStyle(photo: PhotoItem): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}
    if (layout.value === 'rows') {
      const w = containerWidth.value
      const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)
      const ar = photo.width / photo.height
      return { ...cursor, flexGrow: ar, flexBasis: `${trh * ar}px`, overflow: 'hidden' }
    }
    return { ...cursor, overflow: 'hidden' }
  }

  const containerStyle = computed<CSSProperties>(() => {
    if (containerQueriesActive.value) {
      return { width: '100%', containerType: 'inline-size', containerName: containerName.value }
    }
    return { width: '100%' }
  })

  function groupStyle(group: LayoutGroup): CSSProperties {
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)

    if (group.type === 'row') {
      return {
        marginBottom: group.index < groups.value.length - 1 ? `${sp}px` : undefined,
      }
    }

    const columnsCount = groups.value.length || 1

    if (
      layout.value === 'masonry'
      || group.columnsGaps === undefined
      || group.columnsRatios === undefined
    ) {
      return {
        marginLeft: group.index > 0 ? `${sp}px` : undefined,
        width: `calc((100% - ${sp * (columnsCount - 1)}px) / ${columnsCount})`,
      }
    }

    const totalRatio = group.columnsRatios.reduce((acc, v) => acc + v, 0)
    const totalAdjustedGaps = group.columnsRatios.reduce(
      (acc, v, ratioIndex) =>
        acc + ((group.columnsGaps![group.index] ?? 0) - (group.columnsGaps![ratioIndex] ?? 0)) * v,
      0,
    )

    return {
      marginLeft: group.index > 0 ? `${sp}px` : undefined,
      width: `calc((100% - ${round(
        (columnsCount - 1) * sp
        + 2 * columnsCount * pd
        + totalAdjustedGaps,
        3,
      )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
        2 * pd
      }px)`,
    }
  }

  function itemStyle(entry: LayoutEntry, group: LayoutGroup): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)

    if (group.type === 'row') {
      const gaps = sp * (entry.itemsCount - 1) + 2 * pd * entry.itemsCount
      return {
        ...cursor,
        boxSizing: 'content-box',
        display: 'block',
        height: 'auto',
        padding: `${pd}px`,
        width: `calc((100% - ${gaps}px) / ${round((w - gaps) / entry.width, 5)})`,
      }
    }

    const isLast = entry.positionIndex === entry.itemsCount - 1
    return {
      ...cursor,
      boxSizing: 'content-box',
      display: 'block',
      height: 'auto',
      padding: `${pd}px`,
      marginBottom: !isLast ? `${sp}px` : undefined,
      width: `calc(100% - ${2 * pd}px)`,
    }
  }

  return {
    containerRef,
    containerWidth,
    isMounted,
    containerStyle,
    containerQueryCSS,
    containerQueriesActive,
    groups,
    rowItems,
    ssrWrapperStyle,
    ssrItemStyle,
    groupStyle,
    itemStyle,
  }
}
