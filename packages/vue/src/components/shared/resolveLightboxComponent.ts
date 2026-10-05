import type { Component } from 'vue'
import type { LightboxOptions } from '../../config'

/** Resolve one setup-time lightbox capability into its concrete component. */
export function resolveLightboxComponent(
  option: boolean | LightboxOptions | undefined,
  injected: Component | null,
  fallback: Component,
  defaultEnabled: boolean,
): Component | null {
  if (option === false || (option === undefined && !defaultEnabled)) return null
  return (typeof option === 'object' ? option.component : undefined) ?? injected ?? fallback
}
