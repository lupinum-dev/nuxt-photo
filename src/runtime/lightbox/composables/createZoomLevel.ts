import type { LightboxInstance, LightboxItem, LightboxOptions, Point, ZoomLevelInstance } from '../types'

const MAX_IMAGE_WIDTH = 4000

type ZoomLevelOptionPrefix = 'initial' | 'secondary' | 'max'

export function createZoomLevel(
  options: LightboxOptions,
  itemData: LightboxItem,
  index: number,
  lightbox?: LightboxInstance,
): ZoomLevelInstance & { update(maxWidth: number, maxHeight: number, panAreaSize: Point): void } {
  const state: ZoomLevelInstance & { update(maxWidth: number, maxHeight: number, panAreaSize: Point): void } = {
    lightbox,
    options,
    itemData,
    index,
    panAreaSize: null,
    elementSize: null,
    fit: 1,
    fill: 1,
    vFill: 1,
    initial: 1,
    secondary: 1,
    max: 1,
    min: 1,
    update(maxWidth: number, maxHeight: number, panAreaSize: Point) {
      const elementSize: Point = { x: maxWidth, y: maxHeight }
      this.elementSize = elementSize
      this.panAreaSize = panAreaSize

      const hRatio = panAreaSize.x / elementSize.x
      const vRatio = panAreaSize.y / elementSize.y

      this.fit = Math.min(1, hRatio < vRatio ? hRatio : vRatio)
      this.fill = Math.min(1, hRatio > vRatio ? hRatio : vRatio)
      this.vFill = Math.min(1, vRatio)

      this.initial = parseZoomLevelOption('initial') || this.fit
      this.secondary = getSecondary()
      this.max = Math.max(this.initial, this.secondary, getMax())
      this.min = Math.min(this.fit, this.initial, this.secondary)

      if (this.lightbox) {
        this.lightbox.dispatch('zoomLevelsUpdate', { zoomLevels: this, slideData: this.itemData })
      }
    },
  }

  function parseZoomLevelOption(optionPrefix: ZoomLevelOptionPrefix): number | undefined {
    const optionName = (optionPrefix + 'ZoomLevel') as
      | 'initialZoomLevel'
      | 'secondaryZoomLevel'
      | 'maxZoomLevel'
    const optionValue = state.options[optionName]

    if (!optionValue) return undefined
    if (typeof optionValue === 'function') return (optionValue as (zl: ZoomLevelInstance) => number)(state)
    if (optionValue === 'fill') return state.fill
    if (optionValue === 'fit') return state.fit
    return Number(optionValue)
  }

  function getSecondary(): number {
    let level = parseZoomLevelOption('secondary')
    if (level) return level

    level = Math.min(1, state.fit * 3)
    if (state.elementSize && level * state.elementSize.x > MAX_IMAGE_WIDTH) {
      level = MAX_IMAGE_WIDTH / state.elementSize.x
    }
    return level
  }

  function getMax(): number {
    return parseZoomLevelOption('max') || Math.max(1, state.fit * 4)
  }

  return state
}
