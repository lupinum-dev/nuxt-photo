import type { LightboxItem, LightboxOptions, Point } from '../types'

export function getViewportSize(
  options: LightboxOptions,
  lightbox?: { viewportSize: Point },
): Point {
  if (options.getViewportSizeFn) {
    const newViewportSize = options.getViewportSizeFn(
      options,
      lightbox as Parameters<NonNullable<LightboxOptions['getViewportSizeFn']>>[1],
    )
    if (newViewportSize) return newViewportSize
  }
  return {
    x: document.documentElement.clientWidth,
    y: window.innerHeight,
  }
}

export function parsePaddingOption(
  prop: 'left' | 'top' | 'bottom' | 'right',
  options: LightboxOptions,
  viewportSize: Point,
  itemData: LightboxItem,
  index: number,
): number {
  let paddingValue = 0
  if (options.paddingFn) {
    paddingValue = options.paddingFn(viewportSize, itemData, index)?.[prop] ?? 0
  }
  else if (options.padding) {
    paddingValue = options.padding[prop]
  }
  return Number(paddingValue) || 0
}

export function getPanAreaSize(
  options: LightboxOptions,
  viewportSize: Point,
  itemData: LightboxItem,
  index: number,
): Point {
  return {
    x:
      viewportSize.x
      - parsePaddingOption('left', options, viewportSize, itemData, index)
      - parsePaddingOption('right', options, viewportSize, itemData, index),
    y:
      viewportSize.y
      - parsePaddingOption('top', options, viewportSize, itemData, index)
      - parsePaddingOption('bottom', options, viewportSize, itemData, index),
  }
}
