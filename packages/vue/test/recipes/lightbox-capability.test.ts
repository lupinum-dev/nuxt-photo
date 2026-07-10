import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { resolveLightboxComponent } from '../../src/components/shared/resolveLightboxComponent'

describe('setup-time lightbox capability', () => {
  const fallback = defineComponent(() => () => null)
  const injected = defineComponent(() => () => null)
  const custom = defineComponent(() => () => null)

  it('uses each recipe default as the single enablement decision', () => {
    expect(
      resolveLightboxComponent(undefined, injected, fallback, false),
    ).toBeNull()
    expect(resolveLightboxComponent(undefined, injected, fallback, true)).toBe(
      injected,
    )
  })

  it('handles explicit disable, built-in enable, and custom components', () => {
    expect(resolveLightboxComponent(false, injected, fallback, true)).toBeNull()
    expect(resolveLightboxComponent(true, injected, fallback, false)).toBe(
      injected,
    )
    expect(resolveLightboxComponent(custom, injected, fallback, false)).toBe(
      custom,
    )
  })
})
