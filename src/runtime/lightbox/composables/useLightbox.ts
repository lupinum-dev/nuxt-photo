/**
 * Public lightbox controller for the headless runtime.
 * Session construction lives in `useLightboxSession.ts` and thumbnail/preflight logic lives in `thumbnailGeometry.ts`.
 */
import { createEventHook, usePreferredReducedMotion } from '../../utils/dom-helpers'
import { readonly, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type {
  LightboxController,
  LightboxControllerHooks,
  LightboxControllerState,
  LightboxCustomSlideRender,
  LightboxInstance,
  LightboxItem,
  LightboxOpenParams,
  LightboxOptions,
  PreparedLightboxOptions,
  SlideInstance,
} from '../types'
import { clamp } from '../utils/math'
import { debugLog, debugWarn } from '../utils/debug'
import { createFilters } from './createFilters'
import { createLightboxSession } from './useLightboxSession'
import { createTransitionPreflight, normalizeDimensionsFromThumbnail } from '../utils/thumbnailGeometry'

const defaultOptions: PreparedLightboxOptions = {
  allowPanToNext: true,
  spacing: 0.1,
  loop: true,
  pinchToClose: true,
  closeOnVerticalDrag: true,
  hideAnimationDuration: 333,
  showAnimationDuration: 333,
  zoomAnimationDuration: 333,
  escKey: true,
  arrowKeys: true,
  trapFocus: true,
  returnFocus: true,
  maxWidthToAnimate: 4000,
  clickToCloseNonZoomable: true,
  imageClickAction: 'zoom-or-close',
  bgClickAction: 'close',
  tapAction: 'toggle-ui',
  doubleTapAction: 'zoom',
  bgOpacity: 0.8,
  index: 0,
  errorMsg: 'The image cannot be loaded',
  preload: [1, 2],
  easing: 'cubic-bezier(.4,0,.22,1)',
  openAnimationType: 'zoom',
  closeAnimationType: 'zoom',
}

function prepareOptions(options: LightboxOptions): PreparedLightboxOptions {
  return { ...defaultOptions, ...options } as PreparedLightboxOptions
}

function getOpenIndex(baseOptions: PreparedLightboxOptions, params?: LightboxOpenParams): number {
  return params?.index ?? params?.options?.index ?? baseOptions.index ?? 0
}

function debugCorrectedDimensions(
  options: LightboxOptions,
  index: number,
  sourceElement: HTMLElement,
  item: LightboxItem,
  override: Partial<LightboxItem> | undefined,
): void {
  if (!override?.width || !override.height) return

  const thumbnailImage = sourceElement instanceof HTMLImageElement
    ? sourceElement
    : sourceElement.querySelector('img')

  if (!thumbnailImage) return

  debugWarn(options, 'open:corrected-slide-dimensions-from-thumb', {
    index,
    sourceNatural: {
      width: thumbnailImage.naturalWidth,
      height: thumbnailImage.naturalHeight,
    },
    declared: {
      width: item.width,
      height: item.height,
      ratio: Number(item.width) / Number(item.height),
    },
    corrected: {
      width: override.width,
      height: override.height,
      ratio: override.width / override.height,
    },
  })
}

function createTrackedHook<T>() {
  const hook = createEventHook<T>()
  let listeners = 0

  return {
    on(fn: Parameters<typeof hook.on>[0]) {
      listeners += 1
      let disposed = false
      const stop = hook.on(fn)

      return {
        off: () => {
          if (disposed) return
          disposed = true
          listeners = Math.max(0, listeners - 1)
          stop.off()
        },
      }
    },
    trigger: hook.trigger,
    getListenerCount() {
      return listeners
    },
  }
}

export interface UseLightboxConfig {
  items: MaybeRefOrGetter<readonly LightboxItem[]>
  options?: MaybeRefOrGetter<LightboxOptions | undefined>
  getThumbnailElement?: MaybeRefOrGetter<((index: number, item: LightboxItem) => HTMLElement | null | undefined) | undefined>
}

function resolveThumbnailElementGetter(
  getter: UseLightboxConfig['getThumbnailElement'],
): ((index: number, item: LightboxItem) => HTMLElement | null | undefined) | undefined {
  if (typeof getter === 'function' && getter.length > 0) {
    return getter as (index: number, item: LightboxItem) => HTMLElement | null | undefined
  }

  return toValue(getter)
}

export function useLightbox(config: UseLightboxConfig): LightboxController {
  const reducedMotion = usePreferredReducedMotion()
  const filterBus = createFilters()
  const itemsRef = shallowRef<readonly LightboxItem[]>([])
  const optionsRef = shallowRef<PreparedLightboxOptions>(prepareControllerOptions({}))
  const activeSession = shallowRef<LightboxInstance>()
  let sessionId = 0
  const sessionIdRef = ref(0)
  const isOpenRef = ref(false)
  const isDestroyingRef = ref(false)
  const currIndexRef = ref(optionsRef.value.index)
  const potentialIndexRef = ref(optionsRef.value.index)
  const totalItemsRef = ref(0)
  const touchSupportedRef = ref(false)
  const uiVisibleRef = ref(false)
  const hasMouseRef = ref(false)
  const isLoadingRef = ref(false)
  const zoomAllowedRef = ref(false)
  const isZoomedInRef = ref(false)
  const transitionPhaseRef = ref<'idle' | 'opening' | 'open' | 'closing'>('idle')
  const currSlideRef = shallowRef<SlideInstance>()
  const customSlideRendersRef = shallowRef<LightboxCustomSlideRender[]>([])

  const beforeOpenHook = createTrackedHook<undefined>()
  const openHook = createTrackedHook<undefined>()
  const changeHook = createTrackedHook<number>()
  const closeHook = createTrackedHook<undefined>()
  const destroyHook = createTrackedHook<undefined>()

  function prepareControllerOptions(options: LightboxOptions): PreparedLightboxOptions {
    const prepared = prepareOptions(options)

    if (reducedMotion.value === 'reduce') {
      prepared.openAnimationType = 'none'
      prepared.closeAnimationType = 'none'
      prepared.zoomAnimationDuration = 0
    }

    return prepared
  }

  function getHookListenerSummary(): Record<string, number> {
    const summary: Record<string, number> = {}
    const counts = {
      beforeOpen: beforeOpenHook.getListenerCount(),
      open: openHook.getListenerCount(),
      change: changeHook.getListenerCount(),
      close: closeHook.getListenerCount(),
      destroy: destroyHook.getListenerCount(),
    }

    Object.entries(counts).forEach(([name, count]) => {
      if (count) summary[name] = count
    })

    return summary
  }

  function getClampedIndex(index: number, itemCount = itemsRef.value.length): number {
    return itemCount > 0 ? clamp(index, 0, itemCount - 1) : 0
  }

  function syncCustomSlideRenders(session?: LightboxInstance): void {
    if (!session) {
      customSlideRendersRef.value = []
      return
    }

    customSlideRendersRef.value = session.mainScroll.itemHolders.flatMap((holder) => {
      const slide = holder.slide
      if (
        !slide
        || slide.data.type !== 'custom'
        || !(slide.content.element instanceof HTMLDivElement)
      ) {
        return []
      }

      return [{
        index: slide.index,
        item: slide.data,
        slide,
        target: slide.content.element,
        isActive: slide.isActive,
      }]
    })
  }

  function syncZoomState(session?: LightboxInstance): void {
    const slide = session?.currSlide
    currSlideRef.value = slide

    if (!slide) {
      zoomAllowedRef.value = false
      isZoomedInRef.value = false
      isLoadingRef.value = false
      return
    }

    const zoomDifference = slide.zoomLevels.initial - slide.zoomLevels.secondary
    zoomAllowedRef.value = Math.abs(zoomDifference) >= 0.01 && slide.isZoomable()
    isLoadingRef.value = slide.content.isLoading()

    if (!zoomAllowedRef.value) {
      isZoomedInRef.value = false
      return
    }

    const potentialZoom = slide.currZoomLevel === slide.zoomLevels.initial
      ? slide.zoomLevels.secondary
      : slide.zoomLevels.initial
    isZoomedInRef.value = potentialZoom <= slide.currZoomLevel
  }

  function resetControllerState(): void {
    sessionIdRef.value = activeSession.value?.sessionId ?? sessionId
    isOpenRef.value = false
    isDestroyingRef.value = false
    currIndexRef.value = getClampedIndex(optionsRef.value.index)
    potentialIndexRef.value = getClampedIndex(optionsRef.value.index)
    totalItemsRef.value = itemsRef.value.length
    touchSupportedRef.value = false
    uiVisibleRef.value = false
    hasMouseRef.value = false
    transitionPhaseRef.value = 'idle'
    currSlideRef.value = undefined
    customSlideRendersRef.value = []
    zoomAllowedRef.value = false
    isZoomedInRef.value = false
    isLoadingRef.value = false
  }

  function syncControllerState(session = activeSession.value): void {
    if (!session) {
      resetControllerState()
      return
    }

    sessionIdRef.value = session.sessionId
    isOpenRef.value = session.isOpen
    isDestroyingRef.value = session.isDestroying
    currIndexRef.value = session.currIndex
    potentialIndexRef.value = session.potentialIndex
    totalItemsRef.value = session.getNumItems()
    touchSupportedRef.value = session.gestures.supportsTouch
    uiVisibleRef.value = session.uiVisible
    hasMouseRef.value = session.hasMouse
    syncZoomState(session)
    syncCustomSlideRenders(session)
  }

  function attachControllerObservers(session: LightboxInstance): void {
    session.on('beforeOpen', () => {
      transitionPhaseRef.value = 'opening'
      syncControllerState(session)
      void beforeOpenHook.trigger()
    })

    session.on('openingAnimationEnd', () => {
      transitionPhaseRef.value = 'open'
      syncControllerState(session)
      void openHook.trigger()
    })

    session.on('change', () => {
      syncControllerState(session)
      void changeHook.trigger(session.currIndex)
    })

    session.on('uiVisibilityChange', () => {
      uiVisibleRef.value = session.uiVisible
    })

    session.on('zoomPanUpdate', () => {
      syncZoomState(session)
    })

    session.on('contentLoad', () => {
      isLoadingRef.value = true
    })

    session.on('loadComplete', () => {
      syncZoomState(session)
    })

    session.on('loadError', () => {
      isLoadingRef.value = false
    })

    session.on('close', () => {
      transitionPhaseRef.value = 'closing'
      syncControllerState(session)
      void closeHook.trigger()
    })

    session.on('destroy', () => {
      syncControllerState(session)
      void destroyHook.trigger()
    })
  }

  const hooks: LightboxControllerHooks = {
    onBeforeOpen: beforeOpenHook.on as LightboxControllerHooks['onBeforeOpen'],
    onOpen: openHook.on as LightboxControllerHooks['onOpen'],
    onChange: changeHook.on as LightboxControllerHooks['onChange'],
    onClose: closeHook.on as LightboxControllerHooks['onClose'],
    onDestroy: destroyHook.on as LightboxControllerHooks['onDestroy'],
  }

  const state: LightboxControllerState = {
    sessionId: readonly(sessionIdRef),
    isOpen: readonly(isOpenRef),
    isDestroying: readonly(isDestroyingRef),
    currIndex: readonly(currIndexRef),
    potentialIndex: readonly(potentialIndexRef),
    totalItems: readonly(totalItemsRef),
    touchSupported: readonly(touchSupportedRef),
    uiVisible: readonly(uiVisibleRef),
    hasMouse: readonly(hasMouseRef),
    isLoading: readonly(isLoadingRef),
    zoomAllowed: readonly(zoomAllowedRef),
    isZoomedIn: readonly(isZoomedInRef),
    transitionPhase: readonly(transitionPhaseRef),
    currSlide: readonly(currSlideRef) as LightboxControllerState['currSlide'],
    customSlideRenders: readonly(customSlideRendersRef) as LightboxControllerState['customSlideRenders'],
  }

  const controller: LightboxController = {
    options: readonly(optionsRef) as LightboxController['options'],
    items: readonly(itemsRef) as LightboxController['items'],
    state,
    hooks,
    open(params?: LightboxOpenParams) {
      if (activeSession.value?.isOpen || activeSession.value?.isDestroying) {
        debugWarn(optionsRef.value, 'controller.open:during-active-session', {
          session: activeSession.value?.sessionId,
          isOpen: activeSession.value?.isOpen,
          isDestroying: activeSession.value?.isDestroying,
          openSource: params?.openSource,
        })
        return false
      }

      if (itemsRef.value.length === 0) return false

      const requestedIndex = getClampedIndex(getOpenIndex(optionsRef.value, params))
      const nextOptions = prepareControllerOptions({
        ...optionsRef.value,
        ...(params?.options || {}),
        index: requestedIndex,
        initialPointerPos: params?.initialPointerPos ?? params?.options?.initialPointerPos ?? optionsRef.value.initialPointerPos,
      })

      const itemOverrides = new Map<number, Partial<LightboxItem>>()
      const initialItem = itemsRef.value[requestedIndex]
      const initialTransitionPreflight = nextOptions.openAnimationType === 'zoom'
        ? createTransitionPreflight(initialItem, params?.sourceElement)
        : undefined
      const initialOverride = normalizeDimensionsFromThumbnail(initialItem, params?.sourceElement)
      if (initialOverride) {
        itemOverrides.set(requestedIndex, initialOverride)
        if (params?.sourceElement && initialItem) {
          debugCorrectedDimensions(nextOptions, requestedIndex, params.sourceElement, initialItem, initialOverride)
        }
      }

      sessionId += 1
      debugLog(nextOptions, 'controller.open', {
        session: sessionId,
        openSource: params?.openSource || 'direct',
        requestedIndex,
        domBinding: params?.domBinding ? 'external' : 'internal',
        controllerListeners: getHookListenerSummary(),
      })

      const session = createLightboxSession({
        sessionId,
        options: nextOptions,
        filterBus,
        domBinding: params?.domBinding,
        getItems: () => itemsRef.value,
        getThumbnailElement: (index, item) => {
          if (index === requestedIndex && params?.sourceElement) {
            return params.sourceElement
          }
          return resolveThumbnailElementGetter(config.getThumbnailElement)?.(index, item)
        },
        initialTransitionPreflight,
        itemOverrides,
        getControllerListenerSummary: getHookListenerSummary,
        onTouchSupportChange: (supportsTouch) => {
          touchSupportedRef.value = supportsTouch
        },
        onUIVisibilityChange: (isVisible) => {
          uiVisibleRef.value = isVisible
        },
        onDestroyed: () => {
          if (activeSession.value === session) {
            activeSession.value = undefined
          }
          resetControllerState()
        },
      })

      attachControllerObservers(session)
      activeSession.value = session
      optionsRef.value = nextOptions
      sessionIdRef.value = sessionId

      if (!session.init()) {
        if (activeSession.value === session) {
          activeSession.value = undefined
        }
        resetControllerState()
        return false
      }

      syncControllerState(session)
      return true
    },
    close() {
      activeSession.value?.close()
    },
    destroy() {
      if (!activeSession.value) return
      if (!activeSession.value.isDestroying) {
        activeSession.value.options.closeAnimationType = 'none'
      }
      activeSession.value.destroy()
    },
    next() {
      activeSession.value?.next()
    },
    prev() {
      activeSession.value?.prev()
    },
    zoomTo(...args) {
      activeSession.value?.zoomTo(...args)
    },
    toggleZoom() {
      activeSession.value?.toggleZoom()
    },
    setUiVisible(isVisible: boolean) {
      activeSession.value?.setUIVisible(isVisible)
      uiVisibleRef.value = isVisible
    },
    refreshSlideContent(slideIndex: number) {
      activeSession.value?.refreshSlideContent(slideIndex)
      syncControllerState(activeSession.value)
    },
    refreshLayout(force?: boolean) {
      activeSession.value?.updateSize(force)
      syncControllerState(activeSession.value)
    },
    setOptions(nextOptions: LightboxOptions) {
      optionsRef.value = prepareControllerOptions({
        ...optionsRef.value,
        ...nextOptions,
      })
      if (!activeSession.value) {
        currIndexRef.value = getClampedIndex(optionsRef.value.index)
        potentialIndexRef.value = getClampedIndex(optionsRef.value.index)
      }
      return optionsRef.value
    },
  }

  watch(
    () => toValue(config.items),
    (nextItems) => {
      itemsRef.value = [...(nextItems ?? [])]
      if (activeSession.value && !activeSession.value.isDestroying) {
        activeSession.value.syncItems()
        syncControllerState(activeSession.value)
        return
      }

      currIndexRef.value = getClampedIndex(optionsRef.value.index)
      potentialIndexRef.value = getClampedIndex(optionsRef.value.index)
      totalItemsRef.value = itemsRef.value.length
      syncCustomSlideRenders()
    },
    { immediate: true, deep: true },
  )

  watch(
    () => toValue(config.options),
    (nextOptions) => {
      controller.setOptions(nextOptions ?? {})
    },
    { immediate: true, deep: true },
  )

  resetControllerState()

  return controller
}
