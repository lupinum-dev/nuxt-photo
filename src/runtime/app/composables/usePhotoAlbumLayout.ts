/**
 * Album layout compositor for the public `PhotoAlbum` surface.
 * It resolves breakpoints, chooses the correct layout algorithm, and attaches image props to each entry.
 */
import type { CSSProperties, ComputedRef, HTMLAttributes, Ref } from 'vue'
import type {
  ColumnsLayoutOptions,
  LayoutOptions,
  LayoutType,
  PhotoItem,
  PhotoLayoutEntry,
  PhotoLayoutGroup,
  RowsLayoutOptions,
  UsePhotoAlbumLayoutOptions,
} from '../../types'
import { computed, ref } from 'vue'
import { LayoutTypes } from '../../types'
import { computeColumnsLayout } from '../../utils/columns'
import { buildImageProps } from '../../utils/imageProps'
import { computeMasonryLayout } from '../../utils/masonry'
import {
  buildResponsiveMap,
  collectResponsiveBreakpoints,
  resolveResponsiveLayoutConfig,
} from '../../utils/responsives'
import { round } from '../../utils/round'
import { computeRowsLayout } from '../../utils/rows'
import { useContainerWidth } from './useContainerWidth'

const [Rows, Columns, Masonry] = LayoutTypes

export interface UsePhotoAlbumLayoutReturn<T extends PhotoItem = PhotoItem> {
  measureRef: Ref<HTMLElement | undefined>
  shouldMeasure: ComputedRef<boolean>
  containerWidth: Ref<number | undefined>
  activeBreakpoint: Ref<number>
  layoutOptions: ComputedRef<LayoutOptions | undefined>
  groups: ComputedRef<PhotoLayoutGroup<T>[]>
  containerStyle: ComputedRef<CSSProperties>
  groupStyle: (group: PhotoLayoutGroup<T>) => CSSProperties
}

/** Resolve album entries into renderable groups for rows, balanced columns, or masonry. */
export function usePhotoAlbumLayout<T extends PhotoItem = PhotoItem>(
  options: UsePhotoAlbumLayoutOptions<T>,
): UsePhotoAlbumLayoutReturn<T> {
  const measureRef = ref<HTMLElement>() as Ref<HTMLElement | undefined>

  const items = computed<T[]>(() =>
    options.items().filter(
      item =>
        Number.isFinite(item.width)
        && Number.isFinite(item.height)
        && item.width > 0
        && item.height > 0,
    ),
  )

  const responsiveMap = computed(() =>
    buildResponsiveMap({
      columns: options.columns?.(),
      padding: options.padding?.(),
      rowConstraints: options.rowConstraints?.(),
      spacing: options.spacing?.(),
      targetRowHeight: options.targetRowHeight?.(),
    }),
  )

  const breakpoints = computed(() =>
    collectResponsiveBreakpoints(responsiveMap.value),
  )

  const resolvedContainerWidthProp = computed(() => options.containerWidth?.())
  const resolvedDefaultContainerWidth = computed(() => options.defaultContainerWidth?.() ?? 1024)

  const { activeBreakpoint, containerWidth } = useContainerWidth(measureRef, {
    breakpoints,
    containerWidth: resolvedContainerWidthProp,
    defaultContainerWidth: resolvedDefaultContainerWidth,
  })

  const shouldMeasure = computed(() => typeof resolvedContainerWidthProp.value !== 'number')
  const layout = computed(() => options.layout())

  const layoutOptions = computed<LayoutOptions | undefined>(() => {
    const resolvedWidth = containerWidth.value ?? resolvedDefaultContainerWidth.value
    if (!resolvedWidth) {
      return undefined
    }

    const resolved = resolveResponsiveLayoutConfig(
      responsiveMap.value,
      resolvedWidth,
      activeBreakpoint.value,
    )

    const common = {
      containerWidth: resolvedWidth,
      padding: resolved.padding,
      spacing: resolved.spacing,
    }

    switch (layout.value) {
      case Rows:
        return {
          ...common,
          layout: Rows,
          rowConstraints: resolved.rowConstraints,
          targetRowHeight: resolved.targetRowHeight,
        } satisfies RowsLayoutOptions
      case Columns:
      case Masonry:
        return {
          ...common,
          columns: resolved.columns,
          layout: layout.value,
        } satisfies ColumnsLayoutOptions
      default:
        return undefined
    }
  })

  function buildEntry(
    item: T,
    layoutMetrics: {
      width: number
      height: number
      index: number
      positionIndex: number
      itemsCount: number
    },
    mode: LayoutType,
    groupIndex: number,
  ): PhotoLayoutEntry<T> {
    const image = options.image?.()
    const imgClass = options.imageClass?.()
    const imagePropsResult = buildImageProps(item, image)

    return {
      imageProps: {
        ...imagePropsResult,
        class: [imagePropsResult.class as HTMLAttributes['class'], imgClass],
        height: layoutMetrics.height,
        width: layoutMetrics.width,
      },
      index: layoutMetrics.index,
      item,
      layout: {
        ...layoutMetrics,
        ...(mode === Rows ? { mode, rowIndex: groupIndex } : { mode, columnIndex: groupIndex }),
      },
    }
  }

  const groups = computed<PhotoLayoutGroup<T>[]>(() => {
    const opts = layoutOptions.value
    if (!opts) {
      return []
    }

    switch (opts.layout) {
      case Rows: {
        const rows = computeRowsLayout({ items: items.value, layoutOptions: opts })
        if (!rows) return []
        return rows.map((row, rowIndex) => ({
          type: 'row' as const,
          index: rowIndex,
          entries: row.map(({ item, layout }) => buildEntry(item as T, layout, Rows, rowIndex)),
        }))
      }
      case Columns: {
        const result = computeColumnsLayout({ items: items.value, layoutOptions: opts })
        if (!result) return []
        return result.columnsModel.map((column, columnIndex) => ({
          type: 'column' as const,
          index: columnIndex,
          entries: column.map(({ item, layout }) => buildEntry(item as T, layout, Columns, columnIndex)),
          columnsGaps: result.columnsGaps,
          columnsRatios: result.columnsRatios,
        }))
      }
      case Masonry: {
        const columns = computeMasonryLayout({ items: items.value, layoutOptions: opts })
        if (!columns) return []
        return columns.map((column, columnIndex) => ({
          type: 'column' as const,
          index: columnIndex,
          entries: column.map(({ item, layout }) => buildEntry(item as T, layout, Masonry, columnIndex)),
        }))
      }
      default:
        return []
    }
  })

  const containerStyle = computed<CSSProperties>(() => {
    const opts = layoutOptions.value
    let maxWidth: string | undefined

    if (opts?.layout === Rows) {
      const singleRowMaxHeight = opts.rowConstraints?.singleRowMaxHeight

      if (singleRowMaxHeight !== undefined) {
        const maxHeight = Math.max(singleRowMaxHeight, opts.targetRowHeight)
        const photoCount = items.value.length
        const initialWidth
          = opts.padding * photoCount * 2 + opts.spacing * Math.max(photoCount - 1, 0)

        maxWidth = `${Math.floor(
          items.value.reduce(
            (sum, item) => sum + maxHeight * (item.width / item.height),
            initialWidth,
          ),
        )}px`
      }
    }

    return {
      display: 'flex',
      flexDirection: opts?.layout === Rows ? 'column' : 'row',
      flexWrap: 'nowrap',
      justifyContent: opts?.layout === Rows ? undefined : 'space-between',
      maxWidth,
      width: '100%',
    }
  })

  function groupStyle(group: PhotoLayoutGroup<T>): CSSProperties {
    const opts = layoutOptions.value
    if (!opts) {
      return {}
    }

    if (group.type === 'row') {
      return {
        alignItems: 'flex-start',
        display: 'flex',
        flexFlow: 'row nowrap',
        justifyContent: 'space-between',
        marginBottom: group.index < groups.value.length - 1 ? `${opts.spacing}px` : undefined,
      }
    }

    const columnsCount = groups.value.length || 1

    if (
      opts.layout === 'masonry'
      || group.columnsGaps === undefined
      || group.columnsRatios === undefined
    ) {
      return {
        alignItems: 'flex-start',
        display: 'flex',
        flexFlow: 'column nowrap',
        justifyContent: opts.layout === 'columns' ? 'space-between' : 'flex-start',
        marginLeft: group.index > 0 ? `${opts.spacing}px` : undefined,
        width: `calc((100% - ${opts.spacing * (columnsCount - 1)}px) / ${columnsCount})`,
      }
    }

    const totalRatio = group.columnsRatios.reduce(
      (accumulator, value) => accumulator + value,
      0,
    )
    const totalAdjustedGaps = group.columnsRatios.reduce(
      (accumulator, value, ratioIndex) =>
        accumulator + ((group.columnsGaps?.[group.index] ?? 0) - (group.columnsGaps?.[ratioIndex] ?? 0)) * value,
      0,
    )

    return {
      alignItems: 'flex-start',
      display: 'flex',
      flexFlow: 'column nowrap',
      justifyContent: 'space-between',
      marginLeft: group.index > 0 ? `${opts.spacing}px` : undefined,
      width: `calc((100% - ${round(
        (columnsCount - 1) * opts.spacing
        + 2 * columnsCount * opts.padding
        + totalAdjustedGaps,
        3,
      )}px) * ${round((group.columnsRatios[group.index] ?? 0) / totalRatio, 5)} + ${
        2 * opts.padding
      }px)`,
    }
  }

  return {
    activeBreakpoint,
    containerStyle,
    containerWidth,
    groupStyle,
    groups,
    layoutOptions,
    measureRef,
    shouldMeasure,
  }
}
