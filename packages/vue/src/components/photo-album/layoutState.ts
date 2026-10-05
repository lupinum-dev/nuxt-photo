import {
  ref,
  computed,
  useId,
  onMounted,
  watch,
  type CSSProperties,
  type ComputedRef,
  type Ref,
} from 'vue'
import { useElementWidth } from '../../composables/useElementWidth'
import {
  computeRowsLayout,
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computePhotoSizes,
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  computeGaps,
  computeWidthDivisor,
  resolveResponsiveValue,
  type ResolvedPhotoItem as PhotoItem,
  type AlbumLayout,
  type LayoutEntry,
  type LayoutGroup,
  type RowsLayoutOptions,
  type ResponsiveParameter,
  type ResponsivePhotoSizes,
} from '../../core/index'
import { albumGroupStyle, albumItemStyle, albumColumnWidth, type AlbumStyleContext } from './styles'
import { devWarn } from '../../core/env'

export type RowItem<TMeta extends object = Readonly<Record<string, unknown>>> = {
  photo: PhotoItem<TMeta>
  index: number
  width: number
  height: number
  style: CSSProperties
  computedSizes?: string
}

interface AlbumLayoutRenderingOptions<TMeta extends object> {
  photos: Ref<readonly PhotoItem<TMeta>[]>
  layout: Ref<AlbumLayout['type']>
  columns: Ref<ResponsiveParameter<number>>
  spacing: Ref<ResponsiveParameter<number>>
  padding: Ref<ResponsiveParameter<number>>
  targetRowHeight: Ref<ResponsiveParameter<number>>
  defaultContainerWidth?: number
  breakpoints: ComputedRef<readonly number[] | undefined>
  sizes: ComputedRef<string | ResponsivePhotoSizes | undefined>
  interactive: Ref<boolean>
}

export function usePhotoAlbumLayoutState<TMeta extends object>(
  options: AlbumLayoutRenderingOptions<TMeta>,
) {
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
  const albumId = useId()
  const containerName = computed(() => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`)
  const scopeClass = computed(() => `np-scope-${containerName.value}`)
  const containerQueriesActive = computed(() => !!breakpoints.value?.length)
  // Grid, bento, mosaic and accordion are positioned by CSS alone.
  const isFrame = computed(
    () => layout.value !== 'rows' && layout.value !== 'columns' && layout.value !== 'masonry',
  )

  // When defaultContainerWidth is set, items render inline calc widths and the
  // observed width snaps at breakpoints — inline styles would outrank any
  // @container rules, so generating both would ship a dead stylesheet.
  const containerQueriesRender = computed(
    () => containerQueriesActive.value && !defaultContainerWidth,
  )

  const containerQueryCSS = computed(() => {
    if (!containerQueriesRender.value || layout.value !== 'rows' || rowWidth.value <= 0) return ''
    return computeBreakpointStyles(
      {
        photos: photos.value,
        breakpoints: breakpoints.value!,
        spacing: spacing.value,
        padding: padding.value,
        targetRowHeight: targetRowHeight.value,
        containerName: containerName.value,
      },
      computeStableRows,
    )
  })

  const { containerWidth } = useElementWidth(containerRef, {
    defaultContainerWidth,
    breakpoints,
  })

  // Anchor each set of column settings to a server-known width. A width-only
  // measurement scales columns without repartitioning or remounting photos.
  const estimatedWidth = computed(() =>
    defaultContainerWidth && defaultContainerWidth > 0
      ? defaultContainerWidth
      : ([...(breakpoints.value ?? [])].filter((width) => width > 0).sort((a, b) => a - b)[0] ??
        1200),
  )

  // Ignore the first measurement: affine CSS already fits the actual width.
  // Only a subsequent resize may choose new row breaks.
  const rowWidth = ref(estimatedWidth.value)
  let measured = false
  onMounted(() => {
    measured = true
  })
  watch(
    containerWidth,
    (width) => {
      if (measured && width > 0) {
        rowCache.clear()
        rowWidth.value = width
      }
    },
    { flush: 'sync' },
  )

  const rowCache = new Map<
    number,
    {
      settings: string
      signatures: string[]
      groups: LayoutGroup<TMeta>[]
    }
  >()
  function computeStableRows(input: RowsLayoutOptions<TMeta>): LayoutGroup<TMeta>[] {
    const { photos: collection, containerWidth: width } = input
    const settings = `${input.spacing}/${input.padding}/${input.targetRowHeight}`
    const signatures = collection.map((photo) => `${photo.id}/${photo.width}/${photo.height}`)
    const previous = rowCache.get(width)
    const append =
      previous?.settings === settings &&
      previous.signatures.length <= signatures.length &&
      previous.signatures.every((signature, index) => signature === signatures[index])
    const offset = append ? previous.signatures.length : 0
    const retained = append
      ? previous.groups.map((group) => ({
          ...group,
          entries: group.entries.map((entry) => ({ ...entry, photo: collection[entry.index]! })),
        }))
      : []
    const added = computeRowsLayout({ ...input, photos: collection.slice(offset) }).map(
      (group) => ({
        ...group,
        index: group.index + retained.length,
        entries: group.entries.map((entry) => ({ ...entry, index: entry.index + offset })),
      }),
    )
    const result = [...retained, ...added]
    rowCache.set(width, { settings, signatures, groups: result })
    return result
  }

  const layoutWidth = computed(() =>
    containerWidth.value > 0 ? containerWidth.value : estimatedWidth.value,
  )
  const parameterWidth = computed(() =>
    layout.value === 'rows' ? rowWidth.value : layoutWidth.value,
  )
  // Keep scalar controls separate from measured width: an unchanged setting does
  // not invalidate the (potentially expensive) column assignment.
  const resolvedSpacing = computed(() =>
    resolveResponsiveValue(spacing.value, parameterWidth.value, DEFAULT_SPACING),
  )
  const resolvedPadding = computed(() =>
    resolveResponsiveValue(padding.value, parameterWidth.value, DEFAULT_PADDING),
  )
  const resolvedColumns = computed(() =>
    resolveResponsiveValue(columns.value, layoutWidth.value, DEFAULT_COLUMNS),
  )
  const resolvedTargetRowHeight = computed(() =>
    resolveResponsiveValue(targetRowHeight.value, parameterWidth.value, DEFAULT_TARGET_ROW_HEIGHT),
  )
  const resolvedParameters = computed(() => ({
    width: parameterWidth.value,
    spacing: resolvedSpacing.value,
    padding: resolvedPadding.value,
    columns: resolvedColumns.value,
    targetRowHeight: resolvedTargetRowHeight.value,
  }))

  const assignedGroups = computed<LayoutGroup<TMeta>[]>(() => {
    const input = {
      photos: photos.value,
      containerWidth: layout.value === 'rows' ? rowWidth.value : estimatedWidth.value,
      spacing: resolvedSpacing.value,
      padding: resolvedPadding.value,
    }

    switch (layout.value) {
      case 'rows': {
        const result = computeStableRows({
          ...input,
          targetRowHeight: resolvedTargetRowHeight.value,
        })
        if (result.length === 0 && photos.value.length > 0) {
          devWarn(
            'rows layout produced no groups; containerWidth may be too small for targetRowHeight',
          )
        }
        return result
      }
      case 'columns':
        return computeColumnsLayout({ ...input, columns: resolvedColumns.value })
      case 'masonry':
        return computeMasonryLayout({ ...input, columns: resolvedColumns.value })
      default:
        return []
    }
  })

  const groups = computed(() => {
    if (layout.value === 'rows')
      return assignedGroups.value.map((group) => {
        const gaps = computeGaps(resolvedSpacing.value, resolvedPadding.value, group.entries.length)
        const scale = (layoutWidth.value - gaps) / (rowWidth.value - gaps)
        return {
          ...group,
          entries: group.entries.map((entry) => ({
            ...entry,
            width: entry.width * scale,
            height: entry.height * scale,
          })),
        }
      })
    const ctx = liveCtx()
    return assignedGroups.value.map((group) => {
      const width = albumColumnWidth(group, ctx)
      return {
        ...group,
        entries: group.entries.map((entry) => ({
          ...entry,
          width,
          height: (width * entry.photo.height) / entry.photo.width,
        })),
      }
    })
  })

  const estimatedRowEntries = computed(
    () =>
      new Map(
        computeStableRows({
          photos: photos.value,
          containerWidth: estimatedWidth.value,
          spacing: resolveResponsiveValue(spacing.value, estimatedWidth.value, DEFAULT_SPACING),
          padding: resolveResponsiveValue(padding.value, estimatedWidth.value, DEFAULT_PADDING),
          targetRowHeight: resolveResponsiveValue(
            targetRowHeight.value,
            estimatedWidth.value,
            DEFAULT_TARGET_ROW_HEIGHT,
          ),
        }).flatMap((group) => group.entries.map((entry) => [entry.index, entry] as const)),
      ),
  )

  function estimatedSizes(photo: PhotoItem<TMeta>, index: number): string {
    const entry = estimatedRowEntries.value.get(index)
    const width =
      entry?.width ??
      Math.min(estimatedWidth.value, (DEFAULT_TARGET_ROW_HEIGHT * photo.width) / photo.height)
    return (
      computePhotoSizes(
        width,
        estimatedWidth.value,
        entry?.itemsCount ?? 1,
        resolveResponsiveValue(spacing.value, estimatedWidth.value, DEFAULT_SPACING),
        resolveResponsiveValue(padding.value, estimatedWidth.value, DEFAULT_PADDING),
        sizes.value,
      ) ?? `${Math.ceil(width)}px`
    )
  }

  function thumbnailSizes(entry: LayoutEntry<TMeta>): string {
    const resolved = resolvedParameters.value
    return (
      computePhotoSizes(
        entry.width,
        layout.value === 'rows' ? layoutWidth.value : resolved.width,
        layout.value === 'rows' ? entry.itemsCount : groups.value.length,
        resolved.spacing,
        resolved.padding,
        sizes.value,
      ) ?? `${Math.ceil(entry.width)}px`
    )
  }

  const rowItems = computed<RowItem<TMeta>[]>(() => {
    const cursor = interactive.value ? { cursor: 'pointer' as const } : {}
    const resolved = resolvedParameters.value

    if (containerQueriesRender.value) {
      return photos.value.map((photo, index) => ({
        photo,
        index,
        width: photo.width,
        height: photo.height,
        computedSizes: estimatedSizes(photo, index),
        style: { ...cursor, overflow: 'hidden' } as CSSProperties,
      }))
    }

    return groups.value.flatMap((row) => {
      const totalRatio = row.entries.reduce(
        (sum, entry) => sum + entry.photo.width / entry.photo.height,
        0,
      )
      return row.entries.map((entry) => {
        const gaps = computeGaps(resolved.spacing, resolved.padding, entry.itemsCount)
        return {
          photo: entry.photo,
          index: entry.index,
          width: entry.width,
          height: entry.height,
          computedSizes: thumbnailSizes(entry),
          style: {
            ...cursor,
            flex: '0 0 auto',
            boxSizing: 'content-box' as const,
            padding: `${resolved.padding}px`,
            overflow: 'hidden',
            width: `calc((100% - ${gaps}px) / ${computeWidthDivisor(1, 0, entry.photo.width / entry.photo.height / totalRatio)})`,
          } as CSSProperties,
        }
      })
    })
  })

  const ssrWrapperStyle = computed<CSSProperties>(() => {
    const resolved = resolvedParameters.value
    if (layout.value === 'rows') {
      return {
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${resolved.spacing}px`,
        width: '100%',
      }
    }
    return { width: '100%' }
  })

  const containerStyle = computed<CSSProperties>(() => {
    if (isFrame.value || (layout.value === 'rows' && containerQueriesRender.value)) {
      return {
        width: '100%',
        containerType: 'inline-size',
        containerName: containerName.value,
      }
    }
    return { width: '100%' }
  })

  function liveCtx(): AlbumStyleContext {
    const resolved = resolvedParameters.value
    return {
      containerWidth: resolved.width,
      spacing: resolved.spacing,
      padding: resolved.padding,
      columnsCount: assignedGroups.value.length || 1,
      layoutType: layout.value,
    }
  }

  return {
    containerRef,
    containerWidth,
    layoutWidth,
    containerName,
    scopeClass,
    containerStyle,
    containerQueryCSS,
    containerQueriesRender,
    groups,
    rowItems,
    thumbnailSizes,
    ssrWrapperStyle,
    groupStyle: (group: LayoutGroup<TMeta>) => albumGroupStyle(group, liveCtx()),
    itemStyle: (entry: LayoutEntry<TMeta>, group: LayoutGroup<TMeta>) =>
      albumItemStyle(entry, group, liveCtx(), interactive),
  }
}
