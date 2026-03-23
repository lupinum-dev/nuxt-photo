import type {
  ItemHolder,
  LightboxDebugOptions,
  LightboxInstance,
  LightboxOptions,
  PreparedLightboxOptions,
} from '../types'

type DebuggableOptions = LightboxOptions | PreparedLightboxOptions

const DEFAULT_EVENT_TRACE = new Set([
  'init',
  'beforeOpen',
  'firstUpdate',
  'initialLayout',
  'afterInit',
  'change',
  'bindEvents',
  'close',
  'destroy',
  'openingAnimationStart',
  'openingAnimationEnd',
  'closingAnimationStart',
  'closingAnimationEnd',
  'firstZoomPan',
])

export function isDebugEnabled(options: DebuggableOptions): boolean {
  return Boolean(options.debug)
}

export function getDebugOptions(options: DebuggableOptions): LightboxDebugOptions {
  if (typeof options.debug === 'object' && options.debug) {
    return options.debug
  }
  return {}
}

export function shouldTraceEvent(options: DebuggableOptions, eventName: string): boolean {
  if (!isDebugEnabled(options)) {
    return false
  }

  const debugOptions = getDebugOptions(options)
  if (debugOptions.traceEvents === true) {
    return true
  }
  if (Array.isArray(debugOptions.traceEvents)) {
    return debugOptions.traceEvents.includes(eventName)
  }

  return DEFAULT_EVENT_TRACE.has(eventName)
}

export function shouldTraceCategory(
  options: DebuggableOptions,
  category: keyof Pick<LightboxDebugOptions, 'traceListeners' | 'traceState' | 'traceDOM' | 'traceSlides' | 'traceWarnings'>,
): boolean {
  if (!isDebugEnabled(options)) {
    return false
  }

  const debugOptions = getDebugOptions(options)
  const value = debugOptions[category]
  return value !== false
}

export function debugLog(
  options: DebuggableOptions,
  scope: string,
  details?: unknown,
): void {
  if (!isDebugEnabled(options)) {
    return
  }

  if (details === undefined) {
    console.debug(`[photo-lightbox] ${scope}`)
    return
  }

  console.debug(`[photo-lightbox] ${scope}`, summarizeForDebug(details))
}

export function debugWarn(
  options: DebuggableOptions,
  scope: string,
  details?: unknown,
): void {
  if (!isDebugEnabled(options)) {
    return
  }

  if (shouldTraceCategory(options, 'traceWarnings') === false) {
    return
  }

  if (details === undefined) {
    console.warn(`[photo-lightbox][warn] ${scope}`)
    return
  }

  console.warn(`[photo-lightbox][warn] ${scope}`, summarizeForDebug(details))
}

export function describeElement(el?: Element | null): Record<string, unknown> | null {
  if (!el) {
    return null
  }

  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    className: el.className || undefined,
    isConnected: el.isConnected,
    childCount: el.childElementCount,
    parent: el.parentElement?.tagName?.toLowerCase(),
  }
}

export function summarizeForDebug(value: unknown, maxDepth = 2): unknown {
  return summarizeValue(value, new WeakSet<object>(), 0, maxDepth)
}

export function getDebugSnapshot(
  lightbox: LightboxInstance,
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    sessionId: lightbox.sessionId,
    currIndex: lightbox.currIndex,
    potentialIndex: lightbox.potentialIndex,
    isOpen: lightbox.isOpen,
    isDestroying: lightbox.isDestroying,
    hasMouse: lightbox.hasMouse,
    opener: {
      isOpen: lightbox.opener.isOpen,
      isClosed: lightbox.opener.isClosed,
      isOpening: lightbox.opener.isOpening,
      isClosing: lightbox.opener.isClosing,
    },
    resolvedOpenTransition: summarizeForDebug(lightbox.resolvedOpenTransition),
    viewportSize: { ...lightbox.viewportSize },
    offset: { ...lightbox.offset },
    bgOpacity: lightbox.bgOpacity,
    currSlide: lightbox.currSlide
      ? {
          index: lightbox.currSlide.index,
          currZoomLevel: lightbox.currSlide.currZoomLevel,
          width: lightbox.currSlide.width,
          height: lightbox.currSlide.height,
          pan: { ...lightbox.currSlide.pan },
          isActive: lightbox.currSlide.isActive,
        }
      : null,
    mainScroll: {
      x: lightbox.mainScroll.x,
      slideWidth: lightbox.mainScroll.slideWidth,
      itemHolderCount: lightbox.mainScroll.itemHolders.length,
    },
    itemHolders: lightbox.mainScroll.itemHolders.map((holder, index) => describeHolder(holder, index)),
    dom: {
      bindingMode: lightbox.domBinding ? 'external' : 'internal',
      element: describeElement(lightbox.element),
      template: describeElement(lightbox.template),
      bg: describeElement(lightbox.bg),
      scrollWrap: describeElement(lightbox.scrollWrap),
      container: describeElement(lightbox.container),
      containerChildren: lightbox.container?.childElementCount ?? 0,
    },
    ...extras,
  }
}

function describeHolder(holder: ItemHolder, position: number): Record<string, unknown> {
  return {
    position,
    display: holder.el.style.display || undefined,
    slideIndex: holder.slide?.index,
    hasSlide: Boolean(holder.slide),
    childCount: holder.el.childElementCount,
    isConnected: holder.el.isConnected,
  }
}

function summarizeValue(
  value: unknown,
  seen: WeakSet<object>,
  depth: number,
  maxDepth: number,
): unknown {
  if (
    value === null
    || value === undefined
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value
  }

  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`
  }

  if (value instanceof Element) {
    return describeElement(value)
  }

  if (value instanceof Event) {
    return {
      type: value.type,
      target: describeElement(value.target instanceof Element ? value.target : null),
    }
  }

  if (Array.isArray(value)) {
    if (depth >= maxDepth) {
      return `[Array(${value.length})]`
    }
    return value.map(entry => summarizeValue(entry, seen, depth + 1, maxDepth))
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[Circular]'
    }
    seen.add(value as object)

    const summary: Record<string, unknown> = {}
    const entries = Object.entries(value as Record<string, unknown>)

    for (const [key, entry] of entries.slice(0, 15)) {
      if (depth >= maxDepth) {
        summary[key] = `[${getConstructorName(entry)}]`
      }
      else {
        summary[key] = summarizeValue(entry, seen, depth + 1, maxDepth)
      }
    }

    if (entries.length > 15) {
      summary.__truncatedKeys = entries.length - 15
    }

    return summary
  }

  return String(value)
}

function getConstructorName(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return typeof value
  }
  return (value as { constructor?: { name?: string } }).constructor?.name || 'Object'
}
