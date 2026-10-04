import { expect, it } from 'vite-plus/test'
import { validateNuxtPhotoOptions } from '../src/options'

it.each([
  ['array css', { css: ['all'] }],
  ['array provider', { provider: ['ipx'] }],
  ['boxed css', { css: new String('all') }],
  ['inherited root', Object.create({ css: 'all' })],
  ['date root', new Date()],
  ['class child', { labels: new (class Config {})() }],
])('rejects malformed config: %s', (_, config) => {
  expect(() => validateNuxtPhotoOptions(config)).toThrow(TypeError)
})

it.each([false, {}, { provider: 'native' }])('rejects removed image option: %j', (image) => {
  expect(() => validateNuxtPhotoOptions({ image })).toThrow(
    '[nuxt-photo] Unknown `nuxtPhoto.image` option.',
  )
})
