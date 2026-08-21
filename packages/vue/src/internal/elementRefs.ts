import type { ComponentPublicInstance, Ref } from 'vue'

/**
 * Shared element-ref plumbing for lightbox DOM bindings.
 *
 * Template refs arrive as either a raw `HTMLElement` or a component public
 * instance wrapping one. These helpers normalize both shapes once so motion,
 * zoom, and gesture code can treat every binding as a plain element.
 */

/** Unwrap a template ref value into its HTMLElement, or null. */
export function domElement(
  value: Element | ComponentPublicInstance | null | undefined,
): HTMLElement | null {
  if (value instanceof HTMLElement) return value
  const root = value ? (value as ComponentPublicInstance).$el : null
  if (root instanceof HTMLElement) {
    return root
  }
  return null
}

/** Create a ref setter that stores the unwrapped element in `target`. */
export function setRef(target: Ref<HTMLElement | null>) {
  return (value: Element | ComponentPublicInstance | null) => {
    target.value = domElement(value)
  }
}

/** Create an indexed ref setter backed by a map; clearing removes the entry. */
export function setMapRef(map: Map<number, HTMLElement>, index: number) {
  return (value: Element | ComponentPublicInstance | null) => {
    const element = domElement(value)
    if (element) map.set(index, element)
    else map.delete(index)
  }
}

/**
 * Create a single-slot setter for a shared element set: each setter owns at
 * most one element, and rebinding swaps membership. Used for controls and
 * captions, where any number of components contribute elements.
 */
export function registerSetRef(set: Set<HTMLElement>) {
  let current: HTMLElement | null = null
  return (value: Element | ComponentPublicInstance | null) => {
    if (current) set.delete(current)
    const element = domElement(value)
    current = element
    if (current) set.add(current)
  }
}
