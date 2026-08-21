import type { Component } from 'vue'

/** Resolve the current lightbox capability into its concrete component. */
export function resolveLightboxComponent(
  option: boolean | Component | undefined,
  injected: Component | null,
  fallback: Component,
): Component | null {
  if (option === false) return null
  if (option === undefined || option === true) return injected ?? fallback
  return option
}
