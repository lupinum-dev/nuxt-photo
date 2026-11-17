import type { Component } from 'vue'
import type { LightboxOptions } from '../../config'

/**
 * Resolve the setup-time lightbox option: null when the lightbox is off, `true` for the
 * built-in one, otherwise the component that replaces it.
 */
export function resolveLightboxComponent(
  option: boolean | LightboxOptions | undefined,
  injected: Component | null,
  defaultEnabled: boolean,
): Component | true | null {
  if (option === false || (option === undefined && !defaultEnabled)) return null
  return (typeof option === 'object' ? option.component : undefined) ?? injected ?? true
}
