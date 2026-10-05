import { expect, it } from 'vite-plus/test'
import { validateNuxtPhotoOptions } from '../src/options'

it.each([
  ['array css', { css: ['all'] }],
  ['array provider', { provider: ['ipx'] }],
  ['boxed css', { css: new String('all') }],
  ['inherited root', Object.create({ css: 'all' })],
  ['date root', new Date()],
  ['class child', { labels: new (class Config {})() }],
  ['component object', { lightbox: { component: {} } }],
  ['empty component path', { lightbox: { component: ' ' } }],
])('rejects malformed config: %s', (_, config) => {
  expect(() => validateNuxtPhotoOptions(config)).toThrow(TypeError)
})

it('requires a component path string in Nuxt config', () => {
  const component: NonNullable<import('../src/options').NuxtPhotoOptions['lightbox']>['component'] =
    '~/components/CaptionLightbox.vue'
  expect(() => validateNuxtPhotoOptions({ lightbox: { component } })).not.toThrow()
  expect(() => validateNuxtPhotoOptions({ lightbox: { component: {} } })).toThrow(
    '`nuxtPhoto.lightbox.component` must be a non-empty component path or alias string',
  )
})

it.each([false, {}, { provider: 'native' }])('rejects removed image option: %j', (image) => {
  expect(() => validateNuxtPhotoOptions({ image })).toThrow(
    '[nuxt-photo] Unknown `nuxtPhoto.image` option.',
  )
})
