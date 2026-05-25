import {
  ref,
  computed,
  onMounted,
  useId,
  type CSSProperties,
  type ComputedRef,
  type Ref,
} from 'vue'
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
  type ResponsiveParameter,
} from '@nuxt-photo/core'
import {
  albumGroupStyle,
  albumItemStyle,
  type AlbumStyleContext,
} from './albumStyles'
import { devWarn, round } from '../utils/runtime'

const warnedApproximateLayouts = new Set<'columns' | 'masonry'>()

export type RowItem = {
  photo: PhotoItem
  index: number
  width: number
  height: number
  style: CSSProperties
  computedSizes?: string
}

interface AlbumLayoutRenderingOptions {
  photos: Ref<PhotoItem[]>
  layout: Ref<'rows' | 'columns' | 'masonry'>
  columns: Ref<ResponsiveParameter<number>>
  spacing: Ref<ResponsiveParameter<number>>
  padding: Ref<ResponsiveParameter<number>>
  targetRowHeight: Ref<ResponsiveParameter<number>>
  defaultContainerWidth?: number
  breakpoints: ComputedRef<readonly number[] | undefined>
  sizes?: { size: string; sizes?: Array<{ viewport: string; size: string }> }
  interactive: Ref<boolean>
}

export function usePhotoAlbumLayoutState(options: AlbumLayoutRenderingOptions) {
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
  const containerName = computed(
    () => `np-${albumId.replace(/[^a-z0-9]/gi, '')}`,
  )
  const scopeClass = computed(() => `np-scope-${containerName.value}`)
  const containerQueriesActive = computed(() => !!breakpoints.value?.length)

  const containerQueryCSS = computed(() => {
    if (!containerQueriesActive.value || layout.value !== 'rows') return ''
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
          devWarn(
            'rows layout produced no groups; containerWidth may be too small for targetRowHeight',
          )
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

  const containerStyle = computed<CSSProperties>(() => {
    if (layout.value === 'rows' && containerQueriesActive.value) {
      return {
        width: '100%',
        containerType: 'inline-size',
        containerName: containerName.value,
      }
    }
    return { width: '100%' }
  })

  function maybeWarnApproximate() {
    if (layout.value === 'rows') return
    if (defaultContainerWidth && defaultContainerWidth > 0) return
    if (warnedApproximateLayouts.has(layout.value)) return
    warnedApproximateLayouts.add(layout.value)
    devWarn(
      `${layout.value} layout rendered without defaultContainerWidth; SSR uses a simple fallback and recomputes after mount. See https://nuxt-photo.lupinum.com/docs/guides/ssr-and-cls`,
    )
  }

  function liveCtx(): AlbumStyleContext {
    const w = containerWidth.value
    return {
      containerWidth: w,
      spacing: resolveResponsiveParameter(spacing.value, w, 8),
      padding: resolveResponsiveParameter(padding.value, w, 0),
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
    containerQueriesActive,
    groups,
    rowItems,
    ssrWrapperStyle,
    ssrItemStyle,
    groupStyle: (group: LayoutGroup) => albumGroupStyle(group, liveCtx()),
    itemStyle: (
      entry: Parameters<typeof albumItemStyle>[0],
      group: LayoutGroup,
    ) => albumItemStyle(entry, group, liveCtx(), interactive),
    maybeWarnApproximate,
  }
}
