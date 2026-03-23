import type {
  Bounds,
  LightboxInstance,
  LightboxItem,
  ThumbnailBoundsData,
} from '../types'
import {
  getBoundsByRect,
  getCroppedBoundsByRect,
  getVisibleAreaRatio,
  shouldUseCroppedThumbnailBounds,
} from '../utils/thumbnailGeometry'

function getRenderedImageThumbnail(element?: HTMLElement | null): HTMLImageElement | null {
  if (!element) {
    return null
  }

  if (element.tagName === 'IMG') {
    return element as HTMLImageElement
  }

  return element.querySelector('img')
}

function resolveThumbnailElement(
  index: number,
  itemData: LightboxItem,
  instance: LightboxInstance,
): HTMLElement | null | undefined {
  const thumbnail = instance.getThumbnailElement(index, itemData)
  return instance.applyFilters('thumbEl', thumbnail, itemData, index) as HTMLElement | null | undefined
}

export function getThumbBoundsData(
  index: number,
  itemData: LightboxItem,
  instance: LightboxInstance,
): ThumbnailBoundsData {
  const event = instance.dispatch('thumbBounds', { index, itemData, instance })
  if ((event as Record<string, unknown>).thumbBounds) {
    return {
      bounds: (event as Record<string, unknown>).thumbBounds as Bounds,
    }
  }

  let thumbBounds: Bounds | undefined
  let visibleAreaRatio: number | undefined
  const thumbnail = resolveThumbnailElement(index, itemData, instance)

  if (thumbnail) {
    const boundsTarget = getRenderedImageThumbnail(thumbnail) ?? thumbnail
    const rect = boundsTarget.getBoundingClientRect()
    visibleAreaRatio = getVisibleAreaRatio(rect)

    if (!shouldUseCroppedThumbnailBounds(itemData, thumbnail)) {
      thumbBounds = getBoundsByRect(rect)
    }
    else {
      thumbBounds = getCroppedBoundsByRect(
        rect,
        itemData.width || 0,
        itemData.height || 0,
      )
    }
  }

  return {
    bounds: instance.applyFilters('thumbBounds', thumbBounds, itemData, index) as Bounds | undefined,
    visibleAreaRatio,
    thumbnail,
  }
}

export function getThumbBounds(
  index: number,
  itemData: LightboxItem,
  instance: LightboxInstance,
): Bounds | undefined {
  return getThumbBoundsData(index, itemData, instance).bounds
}
