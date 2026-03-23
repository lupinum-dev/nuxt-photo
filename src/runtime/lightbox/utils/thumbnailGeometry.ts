import type {
  Bounds,
  LightboxImageItem,
  LightboxItem,
  LightboxTransitionPreflight,
  ThumbnailBoundsData,
  TransitionFallbackReason,
} from '../types'

function isCustomItem(item: LightboxItem): item is Extract<LightboxItem, { type: 'custom' }> {
  return item.type === 'custom'
}

export function getSourceThumbnailImage(sourceElement?: HTMLElement | null): HTMLImageElement | undefined {
  if (!sourceElement) return
  if (sourceElement instanceof HTMLImageElement) return sourceElement
  return sourceElement.querySelector('img') ?? undefined
}

export function getVisibleAreaRatio(rect: DOMRect): number {
  const totalArea = rect.width * rect.height
  if (!totalArea) return 0

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0))
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))

  return (visibleWidth * visibleHeight) / totalArea
}

export function getBoundsByRect(rect: DOMRect): Bounds {
  return {
    x: rect.left,
    y: rect.top,
    w: rect.width,
  }
}

export function getCroppedBoundsByRect(
  rect: DOMRect,
  imageWidth: number,
  imageHeight: number,
): Bounds {
  const horizontalRatio = rect.width / imageWidth
  const verticalRatio = rect.height / imageHeight
  const fillZoomLevel = horizontalRatio > verticalRatio ? horizontalRatio : verticalRatio

  const offsetX = (rect.width - imageWidth * fillZoomLevel) / 2
  const offsetY = (rect.height - imageHeight * fillZoomLevel) / 2

  return {
    x: rect.left,
    y: rect.top,
    w: rect.width,
    innerRect: {
      w: imageWidth * fillZoomLevel,
      h: imageHeight * fillZoomLevel,
      x: offsetX + rect.left,
      y: offsetY + rect.top,
    },
  }
}

export function shouldUseCroppedThumbnailBounds(
  itemData: LightboxItem,
  sourceElement?: HTMLElement | null,
): boolean {
  return Boolean(
    itemData.thumbCropped
    || sourceElement?.dataset.nuxtPhotoCropped === 'true'
    || sourceElement?.dataset.cropped === 'true',
  )
}

export function createThumbnailBoundsData(
  item: LightboxItem | undefined,
  sourceElement?: HTMLElement | null,
): ThumbnailBoundsData {
  if (!sourceElement) {
    return {}
  }

  const thumbnailImage = getSourceThumbnailImage(sourceElement)
  const boundsTarget = thumbnailImage ?? sourceElement
  const rect = boundsTarget.getBoundingClientRect()
  const visibleAreaRatio = getVisibleAreaRatio(rect)

  let bounds: Bounds | undefined
  if (
    item
    && !isCustomItem(item)
    && shouldUseCroppedThumbnailBounds(item, sourceElement)
    && Number(item.width)
    && Number(item.height)
  ) {
    bounds = getCroppedBoundsByRect(rect, Number(item.width), Number(item.height))
  }
  else {
    bounds = getBoundsByRect(rect)
  }

  return {
    bounds,
    visibleAreaRatio,
    thumbnail: sourceElement,
  }
}

export function createTransitionPreflight(
  item: LightboxItem | undefined,
  sourceElement?: HTMLElement | null,
): LightboxTransitionPreflight | undefined {
  if (!item || isCustomItem(item)) return

  const thumbnailData = createThumbnailBoundsData(item, sourceElement)
  const thumbnailImage = getSourceThumbnailImage(sourceElement)
  const declaredWidth = Number(item.width ?? 0)
  const declaredHeight = Number(item.height ?? 0)
  const declaredDimensionsPresent = Boolean(declaredWidth && declaredHeight)
  const naturalWidth = thumbnailImage?.naturalWidth ?? 0
  const naturalHeight = thumbnailImage?.naturalHeight ?? 0
  const hasUsableNaturalDimensions = Boolean(naturalWidth && naturalHeight)
  const aspectRatioCompatible = declaredDimensionsPresent && hasUsableNaturalDimensions
    ? Math.abs((declaredWidth / declaredHeight) - (naturalWidth / naturalHeight)) / (naturalWidth / naturalHeight) < 0.1
    : false

  let fallbackReason: TransitionFallbackReason | undefined
  if (!thumbnailData.bounds) {
    fallbackReason = 'missing-thumb-bounds'
  }
  else if ((thumbnailData.visibleAreaRatio ?? 0) < 0.5) {
    fallbackReason = 'insufficient-thumb-visibility'
  }
  else if (!declaredDimensionsPresent) {
    fallbackReason = 'missing-declared-dimensions'
  }
  else if (!hasUsableNaturalDimensions) {
    fallbackReason = 'missing-natural-dimensions'
  }
  else if (!aspectRatioCompatible) {
    fallbackReason = 'aspect-ratio-mismatch'
  }

  return {
    thumbData: thumbnailData,
    sourceElement,
    declaredDimensionsPresent,
    hasUsableNaturalDimensions,
    aspectRatioCompatible,
    geometryReliable: !fallbackReason,
    fallbackReason,
  }
}

export function normalizeDimensionsFromThumbnail(
  item: LightboxItem | undefined,
  sourceElement?: HTMLElement | null,
): Partial<LightboxItem> | undefined {
  if (!item || isCustomItem(item)) return

  const thumbnailImage = getSourceThumbnailImage(sourceElement)
  if (!thumbnailImage || !thumbnailImage.naturalWidth || !thumbnailImage.naturalHeight) return

  const declaredWidth = Number(item.width ?? 0)
  const declaredHeight = Number(item.height ?? 0)
  if (!declaredWidth || !declaredHeight) {
    return {
      height: thumbnailImage.naturalHeight,
      width: thumbnailImage.naturalWidth,
    } satisfies Partial<LightboxImageItem>
  }

  const thumbnailRatio = thumbnailImage.naturalWidth / thumbnailImage.naturalHeight
  const declaredRatio = declaredWidth / declaredHeight
  const ratioDelta = Math.abs(declaredRatio - thumbnailRatio) / thumbnailRatio

  if (ratioDelta < 0.1) return

  const dominantDimension = Math.max(declaredWidth, declaredHeight)
  const correctedWidth = thumbnailRatio >= 1
    ? dominantDimension
    : Math.round(dominantDimension * thumbnailRatio)
  const correctedHeight = thumbnailRatio >= 1
    ? Math.round(dominantDimension / thumbnailRatio)
    : dominantDimension

  return {
    width: correctedWidth,
    height: correctedHeight,
  } satisfies Partial<LightboxImageItem>
}
