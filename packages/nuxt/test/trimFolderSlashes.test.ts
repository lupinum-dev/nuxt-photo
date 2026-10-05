import { expect, it } from 'vite-plus/test'
import { trimFolderSlashes } from '../src/runtime/trimFolderSlashes'

it.each([
  ['', ''],
  ['/', ''],
  ['///', ''],
  ['trips', 'trips'],
  ['/trips/', 'trips'],
  ['///trips///', 'trips'],
  ['trips/2026', 'trips/2026'],
  ['/trips//2026/', 'trips//2026'],
  [' /trips/ ', ' /trips/ '],
])('normalizes folder boundaries: %j → %j', (input, expected) => {
  expect(trimFolderSlashes(input)).toBe(expected)
})

it('handles 100,000 slashes without quadratic scanning', () => {
  const slashes = '/'.repeat(100_000)
  const interior = 'trips' + slashes + 'photo'
  const start = performance.now()
  expect(trimFolderSlashes(slashes)).toBe('')
  expect(trimFolderSlashes(interior)).toBe(interior)
  expect(performance.now() - start).toBeLessThan(200)
})
