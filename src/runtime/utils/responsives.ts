import type {
  ResolvedResponsiveLayoutConfig,
  ResponsiveLayoutConfig,
  ResponsiveProp,
  RowConstraints,
} from '../types'

const DEFAULT_SPACING = 20
const DEFAULT_PADDING = 0
const DEFAULT_COLUMNS = 1

function mergeRowConstraints(
  current: RowConstraints | undefined,
  next: RowConstraints | undefined,
) {
  if (next === undefined) {
    return current
  }

  return {
    ...current,
    ...next,
  }
}

function numericKeys(input: Record<number, unknown>) {
  return Object.keys(input)
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)
}

export function collectResponsiveBreakpoints(
  ...sources: Array<Record<number, unknown> | undefined>
) {
  const breakpoints = new Set<number>([0])

  sources.forEach((source) => {
    if (!source) {
      return
    }

    numericKeys(source).forEach((breakpoint) => {
      breakpoints.add(breakpoint)
    })
  })

  return [...breakpoints].sort((a, b) => a - b)
}

export function resolveBreakpoint(
  width: number,
  breakpoints: readonly number[],
) {
  return [...breakpoints]
    .sort((a, b) => a - b)
    .reduce(
      (active, breakpoint) => (breakpoint <= width ? breakpoint : active),
      0,
    )
}

function normalizeResponsiveProp<T>(value: ResponsiveProp<T> | undefined): Record<number, T> | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'object' || value === null) {
    return { 0: value }
  }

  return value as Record<number, T>
}

export function buildResponsiveMap(options: {
  columns?: ResponsiveProp<number>
  spacing?: ResponsiveProp<number>
  padding?: ResponsiveProp<number>
  targetRowHeight?: ResponsiveProp<number>
  rowConstraints?: RowConstraints
}): Record<number, ResponsiveLayoutConfig> {
  const columns = normalizeResponsiveProp(options.columns)
  const spacing = normalizeResponsiveProp(options.spacing)
  const padding = normalizeResponsiveProp(options.padding)
  const targetRowHeight = normalizeResponsiveProp(options.targetRowHeight)

  const allBreakpoints = new Set<number>([0])
  for (const map of [columns, spacing, padding, targetRowHeight]) {
    if (map) {
      numericKeys(map).forEach(bp => allBreakpoints.add(bp))
    }
  }

  const result: Record<number, ResponsiveLayoutConfig> = {}

  for (const bp of allBreakpoints) {
    const config: ResponsiveLayoutConfig = {}

    if (columns?.[bp] !== undefined) config.columns = columns[bp]
    if (spacing?.[bp] !== undefined) config.spacing = spacing[bp]
    if (padding?.[bp] !== undefined) config.padding = padding[bp]
    if (targetRowHeight?.[bp] !== undefined) config.targetRowHeight = targetRowHeight[bp]
    if (bp === 0 && options.rowConstraints) config.rowConstraints = options.rowConstraints

    result[bp] = config
  }

  return Object.keys(result).length > 0 ? result : { 0: {} }
}

export function resolveResponsiveLayoutConfig(
  responsive: Record<number, ResponsiveLayoutConfig> | undefined,
  containerWidth: number,
  activeBreakpoint: number,
): ResolvedResponsiveLayoutConfig {
  const safeResponsive = responsive ?? { 0: {} }
  const merged = numericKeys(safeResponsive)
    .filter(breakpoint => breakpoint <= activeBreakpoint)
    .reduce<ResponsiveLayoutConfig>(
      (current, breakpoint) => ({
        ...current,
        ...safeResponsive[breakpoint],
        rowConstraints: mergeRowConstraints(
          current.rowConstraints,
          safeResponsive[breakpoint]?.rowConstraints,
        ),
      }),
      {},
    )

  return {
    columns: Math.max(1, Math.round(merged.columns ?? DEFAULT_COLUMNS)),
    spacing: Math.max(0, Math.round(merged.spacing ?? DEFAULT_SPACING)),
    padding: Math.max(0, Math.round(merged.padding ?? DEFAULT_PADDING)),
    targetRowHeight: Math.max(
      1,
      Math.round(merged.targetRowHeight ?? Math.max(160, containerWidth / 4)),
    ),
    rowConstraints: merged.rowConstraints,
  }
}
