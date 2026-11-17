import { defineComponent } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import { resolveLightboxComponent } from '../../src/components/shared/resolveLightboxComponent'

describe('setup-time lightbox capability', () => {
  const injected = defineComponent(() => () => null)
  const custom = defineComponent(() => () => null)

  it('uses each recipe default as the single enablement decision', () => {
    expect(resolveLightboxComponent(undefined, injected, false)).toBeNull()
    expect(resolveLightboxComponent(undefined, injected, true)).toBe(injected)
  })

  it('handles explicit disable, built-in enable, and custom components', () => {
    expect(resolveLightboxComponent(false, injected, true)).toBeNull()
    expect(resolveLightboxComponent(true, injected, false)).toBe(injected)
    expect(resolveLightboxComponent(true, null, false)).toBe(true)
    expect(resolveLightboxComponent({ component: custom }, injected, false)).toBe(custom)
  })
})
