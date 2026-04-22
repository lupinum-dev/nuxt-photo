import {
  ref,
  computed,
  onMounted,
  useId,
  type CSSProperties,
  type Ref,
} from 'vue'
import { useContainerWidth } from '@nuxt-photo/vue'
import {
  computeRowsLayout,
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computeColumnsBreakpointSnapshots,
  computeMasonryBreakpointSnapshots,
  computeBreakpointVisibilityCSS,
  computePhotoSizes,
  devWarn,
  resolveResponsiveParameter,
  round,
  type PhotoItem,
  type LayoutGroup,
  type LayoutEntry,
  type ResponsiveParameter,
} from '@nuxt-photo/core'

export type BreakpointSnapshot = {
  spanKey: string
  condition: string
  containerWidth: number
  spacing: number
  padding: number
  groups: LayoutGroup[]
}

const warnedApproximateLayouts = new Set<'columns' | 'masonry'>()

export type RowItem = {
  photo: PhotoItem
  index: number
  width: number
  height: number
  style: CSSProperties
  computedSizes?: string
}

interface PhotoLayoutOptions {
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

/**
 * Derive the SSR and client-side layout state used by `PhotoAlbum`, including
 * container-query snapshots and per-item inline styles.
 */
export function usePhotoLayout(options: PhotoLayoutOptions) {
  const {
    photos,
    layout,
    columns,
    spacing,
    padding,
    targetRowHeight,
    defaultContainerWidth,
    breakpoints,
    sizes,
    interactive,
  } = options

  const containerRef = ref<HTMLElement | null>(null)
  const isMounted = ref(false)

  // SSR-safe unique container name for CSS container queries
  const albumId = useId()
  const containerName = computed(
    () => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`,
  )
  const scopeClass = computed(() => `np-scope-${containerName.value}`)
  const snapshotClass = computed(() => `np-snapshot-${containerName.value}`)

  const containerQueriesActive = computed(() => !!breakpoints?.length)

  // ─── Per-breakpoint SSR snapshots for columns/masonry ──────────────────────
  // Precedence:
  //   1. breakpoint-aware (explicit or inferred breakpoints)
  //   2. exact single-width (defaultContainerWidth)
  //   3. approximate fallback (neither)
  const breakpointSnapshots = computed<BreakpointSnapshot[]>(() => {
    if (layout.value === 'rows') return []

    if (breakpoints?.length) {
      if (layout.value === 'columns') {
        return computeColumnsBreakpointSnapshots({
          photos: photos.value,
          breakpoints,
          spacing: spacing.value,
          padding: padding.value,
          columns: columns.value,
        })
      }
      return computeMasonryBreakpointSnapshots({
        photos: photos.value,
        breakpoints,
        spacing: spacing.value,
        padding: padding.value,
        columns: columns.value,
      })
    }

    if (defaultContainerWidth && defaultContainerWidth > 0) {
      const sp = resolveResponsiveParameter(
        spacing.value,
        defaultContainerWidth,
        8,
      )
      const pd = resolveResponsiveParameter(
        padding.value,
        defaultContainerWidth,
        0,
      )
      const cols = resolveResponsiveParameter(
        columns.value,
        defaultContainerWidth,
        3,
      )
      const compute =
        layout.value === 'columns' ? computeColumnsLayout : computeMasonryLayout
      const g = compute({
        photos: photos.value,
        containerWidth: defaultContainerWidth,
        spacing: sp,
        padding: pd,
        columns: cols,
      })
      if (g.length === 0) return []
      return [
        {
          spanKey: 'all',
          condition: '',
          containerWidth: defaultContainerWidth,
          spacing: sp,
          padding: pd,
          groups: g,
        },
      ]
    }

    return []
  })

  const containerQueryCSS = computed(() => {
    if (!containerQueriesActive.value) return ''
    if (layout.value === 'rows') {
      return computeBreakpointStyles({
        photos: photos.value,
        breakpoints: breakpoints!,
        spacing: spacing.value,
        padding: padding.value,
        targetRowHeight: targetRowHeight.value,
        containerName: containerName.value,
      })
    }
    return computeBreakpointVisibilityCSS(
      breakpointSnapshots.value,
      containerName.value,
      snapshotClass.value,
    )
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

    const input = {
      photos: photos.value,
      containerWidth: w,
      spacing: sp,
      padding: pd,
    }

    switch (layout.value) {
      case 'rows': {
        const result = computeRowsLayout({ ...input, targetRowHeight: trh })
        if (result.length === 0 && photos.value.length > 0) {
          console.warn(
            '[nuxt-photo] rows layout produced no groups — containerWidth may be too small for targetRowHeight',
          )
        }
        return result
      }
      case 'columns':
        return computeColumnsLayout({ ...input, columns: cols })
      case 'masonry':
        return computeMasonryLayout({ ...input, columns: cols })
    }

    return []
  })

  const rowItems = computed<RowItem[]>(() => {
    const cursor = interactive.value ? { cursor: 'pointer' as const } : {}
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const pd = resolveResponsiveParameter(padding.value, w, 0)
    const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)

    if (containerQueriesActive.value && !defaultContainerWidth) {
      return photos.value.map((photo, index) => ({
        photo,
        index,
        width: photo.width,
        height: photo.height,
        style: { ...cursor, overflow: 'hidden' } as CSSProperties,
      }))
    }

    if (containerWidth.value <= 0 || groups.value.length === 0) {
      return photos.value.map((photo, index) => {
        const ar = photo.width / photo.height
        return {
          photo,
          index,
          width: photo.width,
          height: photo.height,
          style: {
            ...cursor,
            flexGrow: ar,
            flexBasis: `${trh * ar}px`,
            overflow: 'hidden',
          } as CSSProperties,
        }
      })
    }

    return groups.value.flatMap((row) =>
      row.entries.map((entry) => {
        const gaps = sp * (entry.itemsCount - 1) + 2 * pd * entry.itemsCount
        return {
          photo: entry.photo,
          index: entry.index,
          width: entry.width,
          height: entry.height,
          computedSizes: computePhotoSizes(
            entry.width,
            w,
            entry.itemsCount,
            sp,
            pd,
            sizes,
          ),
          style: {
            ...cursor,
            flex: '0 0 auto',
            boxSizing: 'content-box' as const,
            padding: `${pd}px`,
            overflow: 'hidden',
            width: `calc((100% - ${gaps}px) / ${round((w - gaps) / entry.width, 5)})`,
          } as CSSProperties,
        }
      }),
    )
  })

  const ssrWrapperStyle = computed<CSSProperties>(() => {
    const w = containerWidth.value
    const sp = resolveResponsiveParameter(spacing.value, w, 8)
    const cols = resolveResponsiveParameter(columns.value, w, 3)
    if (layout.value === 'rows') {
      return {
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${sp}px`,
        width: '100%',
      }
    }
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: `${sp}px`,
      width: '100%',
    }
  })

  function ssrItemStyle(photo: PhotoItem): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}
    if (layout.value === 'rows') {
      const w = containerWidth.value
      const trh = resolveResponsiveParameter(targetRowHeight.value, w, 300)
      const ar = photo.width / photo.height
      return {
        ...cursor,
        flexGrow: ar,
        flexBasis: `${trh * ar}px`,
        overflow: 'hidden',
      }
    }
    return { ...cursor, overflow: 'hidden' }
  }

  const snapshotsActive = computed(() => breakpointSnapshots.value.length > 0)

  const containerStyle = computed<CSSProperties>(() => {
    if (containerQueriesActive.value || snapshotsActive.value) {
      return {
        width: '100%',
        containerType: 'inline-size',
        containerName: containerName.value,
      }
    }
    return { width: '100%' }
  })

  // Warn once per layout type if columns/masonry is used without any SSR signal.
  function maybeWarnApproximate() {
    if (layout.value === 'rows') return
    if (
      breakpoints?.length ||
      (defaultContainerWidth && defaultContainerWidth > 0)
    )
      return
    if (warnedApproximateLayouts.has(layout.value)) return
    warnedApproximateLayouts.add(layout.value)
    devWarn(
      `${layout.value} layout rendered without breakpoints or defaultContainerWidth — SSR will visibly reflow on hydration. See https://nuxt-photo.lupinum.com/docs/guides/ssr-and-cls`,
    )
  }

  type StyleContext = {
    containerWidth: number
    spacing: number
    padding: number
    columnsCount: number
    layoutType: 'rows' | 'columns' | 'masonry'
  }

  function groupStyleWith(
    group: LayoutGroup,
    ctx: StyleContext,
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

  function itemStyleWith(
    entry: LayoutEntry,
    group: LayoutGroup,
    ctx: StyleContext,
  ): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}

    if (group.type === 'row') {
      const gaps =
        ctx.spacing * (entry.itemsCount - 1) +
        2 * ctx.padding * entry.itemsCount
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

  function liveCtx(): StyleContext {
    const w = containerWidth.value
    return {
      containerWidth: w,
      spacing: resolveResponsiveParameter(spacing.value, w, 8),
      padding: resolveResponsiveParameter(padding.value, w, 0),
      columnsCount: groups.value.length || 1,
      layoutType: layout.value,
    }
  }

  function snapCtx(snap: BreakpointSnapshot): StyleContext {
    return {
      containerWidth: snap.containerWidth,
      spacing: snap.spacing,
      padding: snap.padding,
      columnsCount: snap.groups.length || 1,
      layoutType: layout.value,
    }
  }

  function groupStyle(group: LayoutGroup): CSSProperties {
    return groupStyleWith(group, liveCtx())
  }

  function itemStyle(entry: LayoutEntry, group: LayoutGroup): CSSProperties {
    return itemStyleWith(entry, group, liveCtx())
  }

  function snapshotGroupStyle(
    group: LayoutGroup,
    snap: BreakpointSnapshot,
  ): CSSProperties {
    return groupStyleWith(group, snapCtx(snap))
  }

  function snapshotItemStyle(
    entry: LayoutEntry,
    group: LayoutGroup,
    snap: BreakpointSnapshot,
  ): CSSProperties {
    return itemStyleWith(entry, group, snapCtx(snap))
  }

  function snapshotWrapperStyle(
    snap: BreakpointSnapshot,
    multiSpan: boolean,
  ): CSSProperties {
    // Column-layout snapshots use a row-flex wrapper (columns side-by-side). When there are
    // multiple spans, CSS `@container` rules toggle display between flex and none; when there
    // is only one span we skip the stylesheet and render flex inline.
    return multiSpan ? { width: '100%' } : { width: '100%', display: 'flex' }
  }

  return {
    containerRef,
    containerWidth,
    isMounted,
    scopeClass,
    snapshotClass,
    containerStyle,
    containerQueryCSS,
    containerQueriesActive,
    breakpointSnapshots,
    snapshotsActive,
    groups,
    rowItems,
    ssrWrapperStyle,
    ssrItemStyle,
    groupStyle,
    itemStyle,
    snapshotGroupStyle,
    snapshotItemStyle,
    snapshotWrapperStyle,
    maybeWarnApproximate,
  }
}
