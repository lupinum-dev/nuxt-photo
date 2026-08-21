import { describe, expect, it } from 'vite-plus/test'
import * as provide from '../src/provide'

describe('@lupinum/vue-photo/provide exports', () => {
  it('exposes only the documented extension keys at runtime', () => {
    expect(Object.keys(provide).sort()).toEqual(
      ['ImageAdapterKey', 'LightboxComponentKey', 'PhotoDefaultsKey'].sort(),
    )
  })
})
