import type { Component } from 'vue'

/** Resolve the current lightbox capability into its concrete component. */
export function resolveLightboxComponent(
  option: boolean | Component | undefined,
  injected: Component | null,
  fallback: Component,
  defaultEnabled: boolean,
): Component | null {
  if (option === false || (option === undefined && !defaultEnabled)) return null
  if (option === undefined || option === true) return injected ?? fallback
  return option
}
