import { defineComponent } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import { resolveLightboxComponent } from '../../src/components/shared/resolveLightboxComponent'

describe('lightbox capability resolution', () => {
  const fallback = defineComponent(() => () => null)
  const injected = defineComponent(() => () => null)
  const custom = defineComponent(() => () => null)

  it('enables the injected or built-in lightbox by default', () => {
    expect(resolveLightboxComponent(undefined, injected, fallback)).toBe(injected)
    expect(resolveLightboxComponent(undefined, null, fallback)).toBe(fallback)
  })

  it('handles explicit disable, built-in enable, and custom components', () => {
    expect(resolveLightboxComponent(false, injected, fallback)).toBeNull()
    expect(resolveLightboxComponent(true, injected, fallback)).toBe(injected)
    expect(resolveLightboxComponent(custom, injected, fallback)).toBe(custom)
  })
})
