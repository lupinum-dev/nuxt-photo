import { expect, it } from 'vite-plus/test'
import { validateNuxtPhotoOptions } from '../src/options'

it.each([
  ['array css', { css: ['all'] }],
  ['array provider', { image: { provider: ['native'] } }],
  ['boxed css', { css: new String('all') }],
  ['sparse widths', { image: { slide: { widths: Array(2) } } }],
  ['inherited root', Object.create({ css: 'all' })],
  ['inherited child', { image: Object.create({ provider: 'native' }) }],
  ['date root', new Date()],
  ['class child', { image: new (class Config {})() }],
  ['sparse thumb widths', { image: { thumb: { widths: Array(2) } } }],
  ['invalid thumb widths', { image: { thumb: { widths: [0] } } }],
  ['boxed format', { image: { format: new String('webp') } }],
  ['invalid format', { image: { format: 'jpeg' } }],
  ['invalid placeholder', { image: { placeholder: 1 } }],
])('rejects malformed config: %s', (_, config) => {
  expect(() => validateNuxtPhotoOptions(config)).toThrow(TypeError)
})

it.each(['sm:100vw', '100vw md:50vw'])('rejects old shorthand sizes: %s', (sizes) => {
  expect(() => validateNuxtPhotoOptions({ image: { thumb: { sizes } } })).toThrow(
    "[nuxt-photo] `nuxtPhoto.image.thumb.sizes` is now an HTML sizes string, e.g. '(max-width: 768px) 100vw, 400px'.",
  )
})

it('rejects the removed density option as unknown', () => {
  expect(() => validateNuxtPhotoOptions({ image: { slide: { maxDensity: 1.5 } } })).toThrow(
    '[nuxt-photo] Unknown `nuxtPhoto.image.slide.maxDensity` option.',
  )
})
