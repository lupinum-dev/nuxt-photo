import {
  ref,
  computed,
  onMounted,
  useId,
  type CSSProperties,
  type ComputedRef,
  type Ref,
} from 'vue'
import { useContainerWidth } from '../../composables/useContainerWidth'
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
  resolveResponsiveParameter,
  type PhotoItem,
  type LayoutEntry,
  type LayoutGroup,
  type ResponsiveParameter,
  type ResponsivePhotoSizes,
} from '../../core/index'
import { albumGroupStyle, albumItemStyle, type AlbumStyleContext } from './styles'
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
  layout: Ref<'rows' | 'columns' | 'masonry'>
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
  const isMounted = ref(false)
  const albumId = useId()
  const containerName = computed(() => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`)
  const scopeClass = computed(() => `np-scope-${containerName.value}`)
  const containerQueriesActive = computed(() => !!breakpoints.value?.length)

  // When defaultContainerWidth is set, items render inline calc widths and the
  // observed width snaps at breakpoints — inline styles would outrank any
  // @container rules, so generating both would ship a dead stylesheet.
  const containerQueriesRender = computed(
    () => containerQueriesActive.value && !defaultContainerWidth,
  )

  const containerQueryCSS = computed(() => {
    if (!containerQueriesRender.value || layout.value !== 'rows') return ''
    return computeBreakpointStyles({
      photos: photos.value,
      breakpoints: breakpoints.value!,
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

  const resolvedParameters = computed(() => {
    const w = containerWidth.value
    return {
      width: w,
      spacing: resolveResponsiveParameter(spacing.value, w, DEFAULT_SPACING),
      padding: resolveResponsiveParameter(padding.value, w, DEFAULT_PADDING),
      columns: resolveResponsiveParameter(columns.value, w, DEFAULT_COLUMNS),
      targetRowHeight: resolveResponsiveParameter(
        targetRowHeight.value,
        w,
        DEFAULT_TARGET_ROW_HEIGHT,
      ),
    }
  })

  const groups = computed<LayoutGroup<TMeta>[]>(() => {
    const resolved = resolvedParameters.value
    if (resolved.width <= 0) return []

    const input = {
      photos: photos.value,
      containerWidth: resolved.width,
      spacing: resolved.spacing,
      padding: resolved.padding,
    }

    switch (layout.value) {
      case 'rows': {
        const result = computeRowsLayout({ ...input, targetRowHeight: resolved.targetRowHeight })
        if (result.length === 0 && photos.value.length > 0) {
          devWarn(
            'rows layout produced no groups; containerWidth may be too small for targetRowHeight',
          )
        }
        return result
      }
      case 'columns':
        return computeColumnsLayout({ ...input, columns: resolved.columns })
      case 'masonry':
        return computeMasonryLayout({ ...input, columns: resolved.columns })
    }
  })

  const rowItems = computed<RowItem<TMeta>[]>(() => {
    const cursor = interactive.value ? { cursor: 'pointer' as const } : {}
    const resolved = resolvedParameters.value

    if (containerQueriesRender.value) {
      return photos.value.map((photo, index) => ({
        photo,
        index,
        width: photo.width,
        height: photo.height,
        computedSizes: typeof sizes.value === 'string' ? sizes.value : undefined,
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
          computedSizes: typeof sizes.value === 'string' ? sizes.value : undefined,
          style: {
            ...cursor,
            flexGrow: ar,
            flexBasis: `${resolved.targetRowHeight * ar}px`,
            overflow: 'hidden',
          } as CSSProperties,
        }
      })
    }

    return groups.value.flatMap((row) =>
      row.entries.map((entry) => {
        const gaps = computeGaps(resolved.spacing, resolved.padding, entry.itemsCount)
        return {
          photo: entry.photo,
          index: entry.index,
          width: entry.width,
          height: entry.height,
          computedSizes: computePhotoSizes(
            entry.width,
            resolved.width,
            entry.itemsCount,
            resolved.spacing,
            resolved.padding,
            sizes.value,
          ),
          style: {
            ...cursor,
            flex: '0 0 auto',
            boxSizing: 'content-box' as const,
            padding: `${resolved.padding}px`,
            overflow: 'hidden',
            width: `calc((100% - ${gaps}px) / ${computeWidthDivisor(resolved.width, gaps, entry.width)})`,
          } as CSSProperties,
        }
      }),
    )
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
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${resolved.columns}, 1fr)`,
      gap: `${resolved.spacing}px`,
      width: '100%',
    }
  })

  function ssrItemStyle(photo: PhotoItem<TMeta>): CSSProperties {
    const cursor = interactive.value ? { cursor: 'pointer' } : {}
    if (layout.value === 'rows') {
      const ar = photo.width / photo.height
      return {
        ...cursor,
        flexGrow: ar,
        flexBasis: `${resolvedParameters.value.targetRowHeight * ar}px`,
        overflow: 'hidden',
      }
    }
    return { ...cursor, overflow: 'hidden' }
  }

  const containerStyle = computed<CSSProperties>(() => {
    if (layout.value === 'rows' && containerQueriesRender.value) {
      return {
        width: '100%',
        containerType: 'inline-size',
        containerName: containerName.value,
      }
    }
    return { width: '100%' }
  })

  // Warned once per album instance, not once per module: module-level state
  // survives HMR and silences warnings for albums mounted later.
  let warnedApproximate = false

  function maybeWarnApproximate() {
    if (layout.value === 'rows') return
    if (defaultContainerWidth && defaultContainerWidth > 0) return
    if (warnedApproximate) return
    warnedApproximate = true
    devWarn(
      `${layout.value} layout rendered without defaultContainerWidth; SSR uses a simple fallback and recomputes after mount. See https://nuxt-photo.lupinum.com/docs/concepts/ssr-and-layout-stability`,
    )
  }

  function liveCtx(): AlbumStyleContext {
    const resolved = resolvedParameters.value
    return {
      containerWidth: resolved.width,
      spacing: resolved.spacing,
      padding: resolved.padding,
      columnsCount: groups.value.length || 1,
      layoutType: layout.value,
    }
  }

  return {
    containerRef,
    containerWidth,
    isMounted,
    scopeClass,
    containerStyle,
    containerQueryCSS,
    containerQueriesRender,
    groups,
    rowItems,
    ssrWrapperStyle,
    ssrItemStyle,
    groupStyle: (group: LayoutGroup<TMeta>) => albumGroupStyle(group, liveCtx()),
    itemStyle: (entry: LayoutEntry<TMeta>, group: LayoutGroup<TMeta>) =>
      albumItemStyle(entry, group, liveCtx(), interactive),
    maybeWarnApproximate,
  }
}
