import type {
  ContentInstance,
  ContentLoaderInstance,
  LightboxInstance,
  LightboxItem,
  SlideInstance,
} from '../types'
import { createZoomLevel } from './createZoomLevel'
import { getPanAreaSize, getViewportSize } from './useViewportSize'

const MIN_SLIDES_TO_CACHE = 5

export function lazyLoadData(
  itemData: LightboxItem,
  instance: LightboxInstance,
  index: number,
): ContentInstance {
  const content = instance.createContentFromData(itemData, index)
  const { options } = instance

  if (options) {
    const zoomLevel = createZoomLevel(options, itemData, -1)
    let viewportSize = instance.viewportSize
    if (!viewportSize || (viewportSize.x === 0 && viewportSize.y === 0)) {
      viewportSize = getViewportSize(options, instance)
    }
    const panAreaSize = getPanAreaSize(options, viewportSize, itemData, index)
    zoomLevel.update(content.width, content.height, panAreaSize)

    content.lazyLoad()

    content.setDisplayedSize(
      Math.ceil(content.width * zoomLevel.initial),
      Math.ceil(content.height * zoomLevel.initial),
    )
  }

  return content
}

export function lazyLoadSlide(
  index: number,
  instance: LightboxInstance,
): ContentInstance | undefined {
  const itemData = instance.getItemData(index)

  if (instance.dispatch('lazyLoadSlide', { index, itemData }).defaultPrevented) {
    return
  }

  return lazyLoadData(itemData, instance, index)
}

export function useContentLoader(lightbox: LightboxInstance): ContentLoaderInstance {
  const limit = Math.max(
    (lightbox.options.preload?.[0] ?? 1) + (lightbox.options.preload?.[1] ?? 2) + 1,
    MIN_SLIDES_TO_CACHE,
  )
  let cachedItems: ContentInstance[] = []

  const loader: ContentLoaderInstance = {
    limit,

    updateLazy(diff?: number) {
      if (lightbox.dispatch('lazyLoad').defaultPrevented) return

      const { preload } = lightbox.options
      const isForward = diff === undefined ? true : diff >= 0

      for (let i = 0; i <= (preload?.[1] ?? 2); i++) {
        loader.loadSlideByIndex(lightbox.currIndex + (isForward ? i : -i))
      }
      for (let i = 1; i <= (preload?.[0] ?? 1); i++) {
        loader.loadSlideByIndex(lightbox.currIndex + (isForward ? -i : i))
      }
    },

    loadSlideByIndex(initialIndex: number) {
      const index = lightbox.getLoopedIndex(initialIndex)
      let content = loader.getContentByIndex(index)
      if (!content) {
        content = lazyLoadSlide(index, lightbox)
        if (content) {
          loader.addToCache(content)
        }
      }
    },

    getContentBySlide(slide: SlideInstance): ContentInstance {
      let content = loader.getContentByIndex(slide.index)
      if (!content) {
        content = lightbox.createContentFromData(slide.data, slide.index)
        loader.addToCache(content)
      }
      content.setSlide(slide)
      return content
    },

    addToCache(content: ContentInstance) {
      loader.removeByIndex(content.index)
      cachedItems.push(content)

      if (cachedItems.length > limit) {
        const indexToRemove = cachedItems.findIndex(
          item => !item.isAttached && !item.hasSlide,
        )
        if (indexToRemove !== -1) {
          const removed = cachedItems.splice(indexToRemove, 1)[0]
          removed?.destroy()
        }
      }
    },

    removeByIndex(index: number) {
      const idx = cachedItems.findIndex(item => item.index === index)
      if (idx !== -1) {
        cachedItems.splice(idx, 1)
      }
    },

    getContentByIndex(index: number): ContentInstance | undefined {
      return cachedItems.find(c => c.index === index)
    },

    destroy() {
      cachedItems.forEach(c => c.destroy())
      cachedItems = []
    },
  }

  return loader
}
