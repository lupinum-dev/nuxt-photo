/**
 * Lightweight replacements for @vueuse/core utilities.
 * Removes the runtime dependency on @vueuse/core (~24 KB gzipped).
 */
import type { Ref } from 'vue'
import { getCurrentScope, onScopeDispose, ref, toValue, watch } from 'vue'

function tryOnScopeDispose(fn: () => void): void {
  if (getCurrentScope()) {
    onScopeDispose(fn)
  }
}

export function useResizeObserver(
  target: Ref<HTMLElement | undefined> | HTMLElement | undefined,
  callback: (entries: ResizeObserverEntry[]) => void,
): { stop: () => void } {
  let observer: ResizeObserver | undefined

  function cleanup() {
    if (observer) {
      observer.disconnect()
      observer = undefined
    }
  }

  function observe() {
    cleanup()
    const el = toValue(target)
    if (!el) return

    observer = new ResizeObserver(callback)
    observer.observe(el)
  }

  observe()

  if (typeof target === 'object' && target !== null && 'value' in target) {
    watch(target, () => observe())
  }

  tryOnScopeDispose(cleanup)

  return { stop: cleanup }
}

export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement | EventTarget | null | undefined,
  event: K | string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  if (!target) return

  target.addEventListener(event, handler, options)

  tryOnScopeDispose(() => {
    target.removeEventListener(event, handler, options)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHookOn<T = any> = (fn: (param?: T) => void) => { off: () => void }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventHook<T = any> {
  on: EventHookOn<T>
  off: (fn: (param?: T) => void) => void
  trigger: (param?: T) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEventHook<T = any>(): EventHook<T> {
  const fns = new Set<(param?: T) => void>()

  return {
    on(fn: (param?: T) => void) {
      fns.add(fn)
      return {
        off() {
          fns.delete(fn)
        },
      }
    },
    off(fn: (param?: T) => void) {
      fns.delete(fn)
    },
    trigger(param?: T) {
      fns.forEach(fn => fn(param))
    },
  }
}

export function usePreferredReducedMotion(): Ref<'reduce' | 'no-preference'> {
  const result = ref<'reduce' | 'no-preference'>('no-preference')

  if (typeof window === 'undefined') return result

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  result.value = mql.matches ? 'reduce' : 'no-preference'

  const handler = (e: MediaQueryListEvent) => {
    result.value = e.matches ? 'reduce' : 'no-preference'
  }

  mql.addEventListener('change', handler)
  tryOnScopeDispose(() => mql.removeEventListener('change', handler))

  return result
}
