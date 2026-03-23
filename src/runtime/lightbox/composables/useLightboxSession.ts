import { useEventListener } from '@vueuse/core'
import { effectScope } from 'vue'
import type {
  Bounds,
  ContentInstance,
  ItemHolder,
  LightboxCustomItem,
  LightboxDOMBinding,
  LightboxImageItem,
  LightboxInstance,
  LightboxItem,
  LightboxTransitionPreflight,
  Point,
  PreparedLightboxOptions,
  SlideInstance,
} from '../types'
import { LightboxEvent } from '../types'
import { clamp, equalizePoints, pointsEqual } from '../utils/math'
import {
  debugLog,
  debugWarn,
  getDebugSnapshot,
  shouldTraceCategory,
  shouldTraceEvent,
  summarizeForDebug,
} from '../utils/debug'
import { createAnimations } from './createAnimations'
import { createDOMEvents } from './createDOMEvents'
import { createEventBus } from './createEventBus'
import type { createFilters } from './createFilters'
import { createGestures } from './createGestures'
import { createMainScroll } from './createMainScroll'
import { useContentLoader } from './useContentLoader'
import { useKeyboard } from './useKeyboard'
import { getThumbBounds, getThumbBoundsData, useOpener } from './useOpener'
import { useScrollWheel } from './useScrollWheel'
import { useContent } from './useSlideContent'
import { useSlide } from './useSlide'
import { getViewportSize } from './useViewportSize'

type SessionServices = Pick<
  LightboxInstance,
  'mainScroll' | 'gestures' | 'opener' | 'keyboard' | 'contentLoader' | 'scrollWheel'
>

type SessionCore = Omit<LightboxInstance, keyof SessionServices>

export interface CreateLightboxSessionConfig {
  sessionId: number
  options: PreparedLightboxOptions
  filterBus: ReturnType<typeof createFilters>
  domBinding?: LightboxDOMBinding
  getItems: () => readonly LightboxItem[]
  getThumbnailElement: (index: number, item: LightboxItem) => HTMLElement | null | undefined
  initialTransitionPreflight?: LightboxTransitionPreflight
  itemOverrides: Map<number, Partial<LightboxItem>>
  getControllerListenerSummary: () => Record<string, number>
  onTouchSupportChange: (supportsTouch: boolean) => void
  onUIVisibilityChange: (isVisible: boolean) => void
  onDestroyed: () => void
}

function cloneItem<T extends LightboxItem>(item: T): T {
  return { ...item }
}

function isCustomItem(item: LightboxItem): item is Extract<LightboxItem, { type: 'custom' }> {
  return item.type === 'custom'
}

function isCompleteDOMBinding(domBinding?: LightboxDOMBinding): domBinding is LightboxDOMBinding {
  return Boolean(
    domBinding?.element
    && domBinding.bg
    && domBinding.scrollWrap
    && domBinding.container
    && domBinding.itemHolders[0]
    && domBinding.itemHolders[1]
    && domBinding.itemHolders[2],
  )
}

function resetDOMBinding(binding: LightboxDOMBinding): void {
  binding.element.className = 'photo-lightbox'
  binding.element.removeAttribute('style')
  binding.bg.className = 'photo-lightbox__bg'
  binding.bg.removeAttribute('style')
  binding.scrollWrap.className = 'photo-lightbox__scroll-wrap'
  binding.scrollWrap.removeAttribute('style')
  binding.container.className = 'photo-lightbox__container'
  binding.container.removeAttribute('style')
  binding.itemHolders.forEach((holder) => {
    holder.className = 'photo-lightbox__item'
    holder.removeAttribute('style')
    holder.replaceChildren()
  })
}

export function createLightboxSession({
  sessionId,
  options,
  filterBus,
  domBinding,
  getItems,
  getThumbnailElement,
  initialTransitionPreflight,
  itemOverrides,
  getControllerListenerSummary,
  onTouchSupportChange,
  onUIVisibilityChange,
  onDestroyed,
}: CreateLightboxSessionConfig): LightboxInstance {
  const sessionScope = effectScope(true)
  const localEvents = createEventBus()
  const events = createDOMEvents()
  const animations = createAnimations()
  const previousViewportSize: Point = { x: 0, y: 0 }
  let initialItemData: LightboxItem | undefined
  let initialThumbBounds: Bounds | undefined
  const resolvedItemOverrides = new Map<number, Partial<LightboxItem>>(itemOverrides)
  const lightbox = {} as LightboxInstance
  let scrollWheel: LightboxInstance['scrollWheel']

  function syncRootElementClasses(): void {
    if (!lightbox.createdDOM || !lightbox.element) {
      return
    }

    lightbox.element.className = [
      'photo-lightbox',
      lightbox.isOpen ? 'photo-lightbox--open' : '',
      lightbox.gestures.supportsTouch ? 'photo-lightbox--touch' : '',
      lightbox.uiVisible ? 'photo-lightbox--ui-visible' : '',
      lightbox.hasMouse ? 'photo-lightbox--has-mouse' : '',
    ].filter(Boolean).join(' ')
  }

  function debugState(scope: string, details?: Record<string, unknown>): void {
    if (!shouldTraceCategory(options, 'traceState')) return
    debugLog(options, scope, getDebugSnapshot(lightbox, {
      session: sessionId,
      localListeners: localEvents.getListenerSummary(),
      controllerListeners: getControllerListenerSummary(),
      ...details,
    }))
  }

  function getResolvedItem(index: number): LightboxItem | undefined {
    const item = getItems()[index]
    if (!item) return
    const override = resolvedItemOverrides.get(index)
    if (!override) return cloneItem(item)
    if (isCustomItem(item)) return { ...cloneItem(item), ...override } as LightboxCustomItem
    return { ...cloneItem(item), ...override } as LightboxImageItem
  }

  function rebuildVisibleSlides(): void {
    lightbox.contentLoader.destroy()
    lightbox.mainScroll.itemHolders.forEach((holder) => {
      holder.slide?.destroy()
      holder.slide = undefined
      holder.el.replaceChildren()
      holder.el.style.display = 'block'
    })

    lightbox.mainScroll.resetPosition()
    lightbox.mainScroll.resize()

    if (lightbox.mainScroll.itemHolders[1]) lightbox.setContent(lightbox.mainScroll.itemHolders[1], lightbox.currIndex, true)
    if (lightbox.mainScroll.itemHolders[0]) lightbox.setContent(lightbox.mainScroll.itemHolders[0], lightbox.currIndex - 1, true)
    if (lightbox.mainScroll.itemHolders[2]) lightbox.setContent(lightbox.mainScroll.itemHolders[2], lightbox.currIndex + 1, true)

    lightbox.currSlide = lightbox.mainScroll.itemHolders[1]?.slide
    lightbox.currSlide?.setIsActive(true)
    lightbox.appendHeavy()
    lightbox.dispatch('change')
  }

  const core: SessionCore = {
    sessionId,
    options,
    initialTransitionPreflight,
    resolvedOpenTransition: undefined,
    offset: { x: 0, y: 0 },
    viewportSize: { x: 0, y: 0 },
    bgOpacity: 1,
    currIndex: 0,
    potentialIndex: 0,
    isOpen: false,
    isDestroying: false,
    uiVisible: false,
    hasMouse: false,
    domBinding,
    createdDOM: !domBinding,
    element: undefined,
    template: undefined,
    container: undefined,
    scrollWrap: undefined,
    bg: undefined,
    currSlide: undefined,
    events,
    animations,
    dispatch<T extends string>(name: T, details?: Record<string, unknown>) {
      const event = new LightboxEvent(name, details)
      localEvents.dispatchEvent(event)

      if (shouldTraceEvent(options, name)) {
        debugLog(options, `event:${name}`, {
          session: sessionId,
          details: summarizeForDebug(details),
          defaultPrevented: event.defaultPrevented,
          localListeners: localEvents.getListenerSummary(),
          controllerListeners: getControllerListenerSummary(),
        })
      }

      return event
    },
    on<T extends string>(name: T, fn: (event: LightboxEvent<T>) => void) {
      const before = localEvents.getListenerCount(name)
      localEvents.on(name, fn)

      if (shouldTraceCategory(options, 'traceListeners')) {
        debugLog(options, 'session.listener:on', {
          session: sessionId,
          event: name,
          before,
          after: localEvents.getListenerCount(name),
          total: localEvents.getListenerCount(),
        })
      }
    },
    off<T extends string>(name: T, fn: (event: LightboxEvent<T>) => void) {
      const before = localEvents.getListenerCount(name)
      localEvents.off(name, fn)

      if (shouldTraceCategory(options, 'traceListeners')) {
        debugLog(options, 'session.listener:off', {
          session: sessionId,
          event: name,
          before,
          after: localEvents.getListenerCount(name),
          total: localEvents.getListenerCount(),
        })
      }
    },
    applyFilters<T extends string>(name: T, ...args: unknown[]) {
      return (filterBus.applyFilters as (...allArgs: unknown[]) => unknown)(name, ...args)
    },
    addFilter<T extends string>(name: T, fn: (...args: unknown[]) => unknown, priority?: number) {
      (filterBus.addFilter as (...allArgs: unknown[]) => void)(name, fn, priority)
    },
    removeFilter<T extends string>(name: T, fn: (...args: unknown[]) => unknown) {
      (filterBus.removeFilter as (...allArgs: unknown[]) => void)(name, fn)
    },
    getNumItems() {
      const numItems = getItems().length
      const event = lightbox.dispatch('numItems', { numItems })
      return lightbox.applyFilters('numItems', (event as Record<string, unknown>).numItems) as number
    },
    getItemData(index: number): LightboxItem {
      const itemData = getResolvedItem(index) ?? { type: 'custom' as const }
      const event = lightbox.dispatch('itemData', { itemData, index })
      return lightbox.applyFilters('itemData', (event as Record<string, unknown>).itemData, index) as LightboxItem
    },
    getLoopedIndex(index: number): number {
      const numSlides = lightbox.getNumItems()
      if (lightbox.options.loop) {
        if (index > numSlides - 1) index -= numSlides
        if (index < 0) index += numSlides
      }
      return clamp(index, 0, numSlides - 1)
    },
    canLoop() {
      return lightbox.options.loop && lightbox.getNumItems() > 2
    },
    goTo(index: number) {
      lightbox.mainScroll.moveIndexBy(lightbox.getLoopedIndex(index) - lightbox.potentialIndex)
    },
    next() {
      lightbox.goTo(lightbox.potentialIndex + 1)
    },
    prev() {
      lightbox.goTo(lightbox.potentialIndex - 1)
    },
    zoomTo(...args: Parameters<SlideInstance['zoomTo']>) {
      lightbox.currSlide?.zoomTo(...args)
    },
    toggleZoom() {
      lightbox.currSlide?.toggleZoom()
    },
    close() {
      if (!lightbox.opener.isOpen || lightbox.isDestroying) return
      debugState('close:start')
      lightbox.isDestroying = true
      lightbox.dispatch('close')
      lightbox.events.removeAll()
      lightbox.opener.close()
    },
    destroy() {
      if (!lightbox.isDestroying) {
        lightbox.options.closeAnimationType = 'none'
        lightbox.close()
        return
      }

      debugState('destroy:start')
      lightbox.dispatch('destroy')

      if (lightbox.scrollWrap) {
        (lightbox.scrollWrap as HTMLElement).ontouchmove = null
        ;(lightbox.scrollWrap as HTMLElement).ontouchend = null
      }

      lightbox.mainScroll.itemHolders.forEach((holder) => {
        if (holder.slide) {
          holder.slide.destroy()
          holder.slide = undefined
        }
        if (!lightbox.createdDOM) {
          holder.el.replaceChildren()
        }
      })

      lightbox.contentLoader.destroy()
      lightbox.events.removeAll()
      lightbox.animations.stopAll()
      lightbox.opener.reset()
      localEvents.removeAll()

      if (lightbox.createdDOM) {
        lightbox.element?.remove()
      }
      else if (lightbox.domBinding) {
        resetDOMBinding(lightbox.domBinding)
      }

      lightbox.mainScroll.resetPosition()
      lightbox.mainScroll.itemHolders = []
      lightbox.isOpen = false
      lightbox.isDestroying = false
      lightbox.uiVisible = false
      lightbox.currIndex = lightbox.options.index ?? 0
      lightbox.potentialIndex = lightbox.currIndex
      lightbox.currSlide = undefined
      lightbox.bgOpacity = 1

      if (lightbox.createdDOM) {
        lightbox.element = undefined
        lightbox.template = undefined
        lightbox.bg = undefined
        lightbox.scrollWrap = undefined
        lightbox.container = undefined
      }

      sessionScope.stop()
      debugState('destroy:complete')
      onDestroyed()
    },
    refreshSlideContent(slideIndex: number) {
      lightbox.contentLoader.removeByIndex(slideIndex)
      lightbox.mainScroll.itemHolders.forEach((holder, holderOffset) => {
        let potentialHolderIndex = (lightbox.currSlide?.index ?? 0) - 1 + holderOffset
        if (lightbox.canLoop()) {
          potentialHolderIndex = lightbox.getLoopedIndex(potentialHolderIndex)
        }
        if (potentialHolderIndex === slideIndex) {
          lightbox.setContent(holder, slideIndex, true)
          if (holderOffset === 1) {
            lightbox.currSlide = holder.slide
            holder.slide?.setIsActive(true)
          }
        }
      })
      lightbox.dispatch('change')
    },
    setContent(holder: ItemHolder, index: number, force?: boolean) {
      const requestedIndex = index
      if (lightbox.canLoop()) {
        index = lightbox.getLoopedIndex(index)
      }

      if (shouldTraceCategory(options, 'traceSlides')) {
        debugLog(options, 'setContent:start', {
          session: sessionId,
          requestedIndex,
          resolvedIndex: index,
          force: Boolean(force),
          holder: summarizeForDebug({
            display: holder.el.style.display || undefined,
            slideIndex: holder.slide?.index,
            childCount: holder.el.childElementCount,
          }),
        })
      }

      if (holder.slide) {
        if (holder.slide.index === index && !force) return
        holder.slide.destroy()
        holder.slide = undefined
      }

      holder.el.replaceChildren()
      if (!lightbox.canLoop() && (index < 0 || index >= lightbox.getNumItems())) return

      const itemData = lightbox.getItemData(index)
      holder.slide = useSlide(itemData, index, lightbox)

      if (index === lightbox.currIndex) {
        lightbox.currSlide = holder.slide
      }

      holder.slide.append(holder.el)

      if (index === lightbox.currIndex && !lightbox.currSlide) {
        debugWarn(options, 'setContent:missing-current-slide', {
          session: sessionId,
          currIndex: lightbox.currIndex,
          requestedIndex,
          resolvedIndex: index,
        })
      }

      if (shouldTraceCategory(options, 'traceSlides')) {
        debugLog(options, 'setContent:complete', {
          session: sessionId,
          requestedIndex,
          resolvedIndex: index,
          currIndex: lightbox.currIndex,
          currSlideIndex: lightbox.currSlide?.index,
          holderChildCount: holder.el.childElementCount,
        })
      }
    },
    getViewportCenterPoint(): Point {
      return {
        x: lightbox.viewportSize.x / 2,
        y: lightbox.viewportSize.y / 2,
      }
    },
    updateSize(force?: boolean) {
      if (lightbox.isDestroying) return
      const newViewportSize = getViewportSize(lightbox.options, lightbox)
      if (!force && pointsEqual(newViewportSize, previousViewportSize)) return

      equalizePoints(previousViewportSize, newViewportSize)
      lightbox.dispatch('beforeResize')
      equalizePoints(lightbox.viewportSize, previousViewportSize)
      updatePageScrollOffset()
      lightbox.dispatch('viewportSize')
      lightbox.mainScroll.resize(lightbox.opener.isOpen)

      if (!lightbox.hasMouse && window.matchMedia('(any-hover: hover)').matches) {
        lightbox.mouseDetected()
      }
      lightbox.dispatch('resize')
    },
    applyBgOpacity(opacity: number) {
      lightbox.bgOpacity = Math.max(opacity, 0)
      if (lightbox.bg) {
        lightbox.bg.style.opacity = String(lightbox.bgOpacity * lightbox.options.bgOpacity)
      }
    },
    mouseDetected() {
      if (!lightbox.hasMouse) {
        lightbox.hasMouse = true
        syncRootElementClasses()
      }
    },
    setUIVisible(isVisible: boolean) {
      lightbox.uiVisible = isVisible
      syncRootElementClasses()
      onUIVisibilityChange(isVisible)
      lightbox.dispatch('uiVisibilityChange', { isVisible })
    },
    setScrollOffset(x: number, y: number) {
      lightbox.offset.x = x
      lightbox.offset.y = y
      lightbox.dispatch('updateScrollOffset')
    },
    appendHeavy() {
      lightbox.mainScroll.itemHolders.forEach((holder) => {
        holder.slide?.appendHeavy()
      })
    },
    syncItems() {
      resolvedItemOverrides.clear()
      const numItems = lightbox.getNumItems()
      if (numItems === 0) {
        lightbox.close()
        return
      }

      lightbox.currIndex = clamp(lightbox.currIndex, 0, numItems - 1)
      lightbox.potentialIndex = clamp(lightbox.potentialIndex, 0, numItems - 1)
      rebuildVisibleSlides()
    },
    getThumbBounds(): Bounds | undefined {
      return getThumbBounds(
        lightbox.currIndex,
        lightbox.currSlide?.data ?? initialItemData ?? { type: 'custom' },
        lightbox,
      )
    },
    getThumbnailElement(index: number, itemData: LightboxItem) {
      return getThumbnailElement(index, itemData)
    },
    createContentFromData(slideData: LightboxItem, index: number): ContentInstance {
      return useContent(slideData, lightbox, index)
    },
    init() {
      debugLog(options, 'session.init:requested', {
        session: sessionId,
        index: lightbox.options.index,
        domBinding: lightbox.domBinding ? 'external' : 'internal',
        controllerListeners: getControllerListenerSummary(),
      })

      if (lightbox.isOpen || lightbox.isDestroying) {
        debugWarn(options, 'session.init:bailed', {
          session: sessionId,
          isOpen: lightbox.isOpen,
          isDestroying: lightbox.isDestroying,
        })
        return false
      }

      lightbox.isOpen = true
      lightbox.dispatch('init')
      lightbox.dispatch('beforeOpen')

      createMainStructure()
      debugState('init:after-createMainStructure', {
        bindingMode: lightbox.domBinding ? 'external' : 'internal',
      })

      syncRootElementClasses()
      onTouchSupportChange(lightbox.gestures.supportsTouch)

      lightbox.currIndex = lightbox.options.index || 0
      lightbox.potentialIndex = lightbox.currIndex
      lightbox.dispatch('firstUpdate')

      lightbox.scrollWheel = sessionScope.run(() => useScrollWheel(lightbox))!

      if (Number.isNaN(lightbox.currIndex) || lightbox.currIndex < 0 || lightbox.currIndex >= lightbox.getNumItems()) {
        lightbox.currIndex = 0
      }

      if (!lightbox.gestures.supportsTouch) {
        lightbox.mouseDetected()
      }

      lightbox.updateSize()
      lightbox.offset.y = window.pageYOffset

      initialItemData = lightbox.getItemData(lightbox.currIndex)
      lightbox.dispatch('gettingData', { index: lightbox.currIndex, data: initialItemData, slide: undefined })

      const initialThumbData = lightbox.initialTransitionPreflight?.thumbData
        ?? getThumbBoundsData(
          lightbox.currIndex,
          initialItemData,
          lightbox,
        )
      const lightboxWithThumbData = lightbox as LightboxInstance & {
        __initialThumbBoundsData?: typeof initialThumbData
      }
      lightboxWithThumbData.__initialThumbBoundsData = initialThumbData
      initialThumbBounds = initialThumbData.bounds
      lightbox.opener.setInitialThumbBounds(initialThumbBounds)
      lightbox.dispatch('initialLayout')
      debugState('init:after-initialLayout', {
        initialItemData: summarizeForDebug(initialItemData),
        initialThumbBounds: summarizeForDebug(initialThumbBounds),
      })

      if (lightbox.mainScroll.itemHolders[1]) {
        lightbox.setContent(lightbox.mainScroll.itemHolders[1], lightbox.currIndex)
      }

      lightbox.dispatch('change')
      lightbox.opener.open()
      lightbox.dispatch('afterInit')
      debugState('init:complete')

      return true
    },
  }

  const mainScroll = createMainScroll({
    options: core.options,
    viewportSize: core.viewportSize,
    domBinding: core.domBinding,
    animations: core.animations,
    getContainer: () => lightbox.container,
    getNumItems: () => lightbox.getNumItems(),
    canLoop: () => lightbox.canLoop(),
    getLoopedIndex: index => lightbox.getLoopedIndex(index),
    getCurrIndex: () => lightbox.currIndex,
    setCurrIndex: (index) => { lightbox.currIndex = index },
    getPotentialIndex: () => lightbox.potentialIndex,
    setPotentialIndex: (index) => { lightbox.potentialIndex = index },
    getCurrSlide: () => lightbox.currSlide,
    setCurrSlide: (slide) => { lightbox.currSlide = slide },
    setContent: (holder, index) => lightbox.setContent(holder, index),
    updateLazy: diff => lightbox.contentLoader.updateLazy(diff),
    appendHeavy: () => lightbox.appendHeavy(),
    dispatch: (name, details) => lightbox.dispatch(name, details),
  })

  const gestures = createGestures({
    options: core.options,
    offset: core.offset,
    viewportSize: core.viewportSize,
    events: core.events,
    animations: core.animations,
    mainScroll,
    dispatch: (name, details) => lightbox.dispatch(name, details),
    applyFilters: (name, ...args) => lightbox.applyFilters(name, ...args),
    getCurrSlide: () => lightbox.currSlide,
    getOpener: () => lightbox.opener,
    getScrollWrap: () => lightbox.scrollWrap,
    getElement: () => lightbox.element,
    getBgOpacity: () => lightbox.bgOpacity,
    getInstance: () => lightbox,
    onBindEvents: fn => core.on('bindEvents', fn),
    mouseDetected: () => lightbox.mouseDetected(),
    setUIVisible: isVisible => lightbox.setUIVisible(isVisible),
    close: () => lightbox.close(),
    next: () => lightbox.next(),
    applyBgOpacity: opacity => lightbox.applyBgOpacity(opacity),
  })
  Object.assign(lightbox, {
    ...core,
    mainScroll,
    gestures,
  })

  const opener = useOpener(lightbox)
  const keyboard = sessionScope.run(() => useKeyboard(lightbox))!
  const contentLoader = useContentLoader(lightbox)

  Object.assign(lightbox, {
    opener,
    keyboard,
    contentLoader,
    get scrollWheel() {
      return scrollWheel
    },
    set scrollWheel(value: LightboxInstance['scrollWheel']) {
      scrollWheel = value
    },
  })

  function createMainStructure(): void {
    if (lightbox.domBinding) {
      if (!isCompleteDOMBinding(lightbox.domBinding)) {
        debugWarn(options, 'createMainStructure:invalid-dom-binding', {
          session: sessionId,
          domBinding: summarizeForDebug(lightbox.domBinding),
        })
        throw new Error('Lightbox requires a complete DOM binding when using external DOM.')
      }

      resetDOMBinding(lightbox.domBinding)
      lightbox.element = lightbox.domBinding.element
      lightbox.template = lightbox.domBinding.element
      lightbox.bg = lightbox.domBinding.bg
      lightbox.scrollWrap = lightbox.domBinding.scrollWrap
      lightbox.container = lightbox.domBinding.container
    }
    else {
      const element = document.createElement('div')
      element.className = 'photo-lightbox'
      element.tabIndex = -1
      element.setAttribute('role', 'dialog')
      const background = document.createElement('div')
      background.className = 'photo-lightbox__bg'
      const scrollWrap = document.createElement('section')
      scrollWrap.className = 'photo-lightbox__scroll-wrap'
      const container = document.createElement('div')
      container.className = 'photo-lightbox__container'
      scrollWrap.appendChild(container)
      element.appendChild(background)
      element.appendChild(scrollWrap)
      lightbox.element = element
      lightbox.template = element
      lightbox.bg = background
      lightbox.scrollWrap = scrollWrap
      lightbox.container = container
    }

    lightbox.scrollWrap?.setAttribute('aria-roledescription', 'carousel')
    lightbox.container?.setAttribute('aria-live', 'off')
    lightbox.container?.setAttribute('id', 'photo-lightbox__items')
    lightbox.mainScroll.appendHolders()

    if (lightbox.createdDOM && lightbox.element && !lightbox.element.parentElement) {
      document.body.appendChild(lightbox.element)
    }
  }

  function handlePageResize(): void {
    if (lightbox.isDestroying) return
    lightbox.updateSize()
    if (/iPhone|iPad|iPod/i.test(window.navigator.userAgent)) {
      setTimeout(() => lightbox.updateSize(), 500)
    }
  }

  function updatePageScrollOffset(): void {
    if (lightbox.isDestroying) return
    lightbox.setScrollOffset(0, window.pageYOffset)
  }

  function handleOpeningAnimationEnd(): void {
    const { itemHolders } = lightbox.mainScroll
    if (itemHolders[0]) {
      itemHolders[0].el.style.display = 'block'
      lightbox.setContent(itemHolders[0], lightbox.currIndex - 1)
    }
    if (itemHolders[2]) {
      itemHolders[2].el.style.display = 'block'
      lightbox.setContent(itemHolders[2], lightbox.currIndex + 1)
    }
    lightbox.appendHeavy()
    lightbox.contentLoader.updateLazy()
    sessionScope.run(() => {
      useEventListener(window, 'resize', handlePageResize as EventListener)
      useEventListener(window, 'scroll', updatePageScrollOffset as EventListener)
    })
    lightbox.dispatch('bindEvents')
  }

  lightbox.on('openingAnimationEnd', handleOpeningAnimationEnd)

  return lightbox
}
