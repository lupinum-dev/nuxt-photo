const defaultCSSEasing = 'cubic-bezier(.4,0,.22,1)'

export function createElement<T extends keyof HTMLElementTagNameMap>(
  className: string,
  tagName: T,
  parent?: Node,
): HTMLElementTagNameMap[T] {
  const el = document.createElement(tagName)
  if (className) {
    el.className = className
  }
  if (parent) {
    parent.appendChild(el)
  }
  return el
}

export function toTransformString(x: number, y?: number, scale?: number): string {
  let propValue = `translate3d(${x}px,${y || 0}px,0)`
  if (scale !== undefined) {
    propValue += ` scale3d(${scale},${scale},1)`
  }
  return propValue
}

export function setTransform(el: HTMLElement, x: number, y?: number, scale?: number): void {
  el.style.transform = toTransformString(x, y, scale)
}

export function setTransitionStyle(
  el: HTMLElement,
  prop?: string,
  duration?: number,
  ease?: string,
): void {
  el.style.transition = prop
    ? `${prop} ${duration}ms ${ease || defaultCSSEasing}`
    : 'none'
}

export function removeTransitionStyle(el: HTMLElement): void {
  setTransitionStyle(el)
}

export function setWidthHeight(el: HTMLElement, w: string | number, h: string | number): void {
  el.style.width = typeof w === 'number' ? `${w}px` : w
  el.style.height = typeof h === 'number' ? `${h}px` : h
}

export const LOAD_STATE = {
  IDLE: 'idle' as const,
  LOADING: 'loading' as const,
  LOADED: 'loaded' as const,
  ERROR: 'error' as const,
}

export function specialKeyUsed(e: MouseEvent | KeyboardEvent): boolean {
  return ('button' in e && e.button === 1) || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

export function isSafari(): boolean {
  return Boolean(navigator.vendor && navigator.vendor.match(/apple/i))
}
