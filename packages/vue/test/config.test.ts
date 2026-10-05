// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vite-plus/test'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createPhoto,
  PhotoAlbum,
  PhotoImage,
  PhotoGroup,
  LightboxProvider,
  usePhotoLabels,
  validatePhotos,
  PhotoValidationError,
} from '../src'
import { makePhoto } from '@test-fixtures/photos'
import { resolvePhotoLabels, PHOTO_LOCALES } from '../src/provide/labels'
import templates from '../src/provide/photoLocaleTemplates'
import { installBrowserStubs, mountComponent } from './support/runtime'

beforeEach(installBrowserStubs)
afterEach(() => {
  document.documentElement.lang = ''
  document.body.innerHTML = ''
})

// Catches the previous runtime path accepting malformed config without setup validation.
it.each([
  [{ thumb: {} }, 'Unknown `photo.thumb` option.'],
  [{ lightbox: { navigation: 3 } }, '`photo.lightbox.navigation` must be'],
  [{ lightbox: { transition: false } }, '`photo.lightbox.transition` must be an object'],
  [
    { lightbox: { component: '~/components/CaptionLightbox.vue' } },
    '`photo.lightbox.component` must be a Vue component object or function',
  ],
  [{ validation: false }, '`photo.validation` must be'],
  [{ labels: { close: 1 } }, '`photo.labels.close` must be a string'],
  [{ labels: 'xx' }, '`photo.labels` must be'],
])('createPhoto rejects malformed input at its public boundary: %j', (input, message) => {
  // JSON is an untyped external boundary, as in an app loading config.
  expect(() => createPhoto(JSON.parse(JSON.stringify(input)))).toThrow(TypeError)
  expect(() => createPhoto(JSON.parse(JSON.stringify(input)))).toThrow(message)
})

it.each([
  ['de-AT', undefined, 'Foto 2 ansehen'],
  ['fr', undefined, 'Voir la photo 2'],
  ['xx', undefined, 'View photo 2'],
  ['', undefined, 'View photo 2'],
  ['de', 'es' as const, 'Ver la foto 2'],
])(
  'detects HTML language %s, with explicit locale %s taking precedence',
  async (lang, labels, expected) => {
    document.documentElement.lang = lang
    const mounted = await mountComponent(PhotoAlbum, {
      props: { photos: [makePhoto(), makePhoto({ id: 'second', alt: undefined })], lightbox: true },
      plugins: [createPhoto({ labels })],
    })
    expect(
      mounted.container.querySelectorAll('[role="button"]')[1]?.getAttribute('aria-label'),
    ).toBe(expected)
    mounted.unmount()
  },
)

// Catches regional Portuguese being collapsed, or explicit tags rejected at setup.
it.each([
  ['pt-PT', 'Seguinte', 'Descarregar'],
  ['pt-pt', 'Seguinte', 'Descarregar'],
  ['pt-BR', 'Próximo', 'Baixar'],
  ['pt', 'Próximo', 'Baixar'],
  ['pt-AO', 'Próximo', 'Baixar'],
  ['fr-CA', 'Suivant', 'Télécharger'],
] as const)(
  'resolves %s through HTML language and explicit labels',
  async (locale, next, download) => {
    const Consumer = defineComponent({
      setup() {
        const labels = usePhotoLabels()
        return () => h('p', `${labels.next} / ${labels.download}`)
      },
    })
    document.documentElement.lang = locale
    for (const labels of [undefined, locale]) {
      const mounted = await mountComponent(Consumer, { plugins: [createPhoto({ labels })] })
      expect(mounted.container.textContent).toBe(`${next} / ${download}`)
      mounted.unmount()
    }
  },
)

it('each bundled locale supplies all eighteen labels and indexed text', () => {
  for (const locale of PHOTO_LOCALES) {
    const labels = resolvePhotoLabels(locale)
    if (!templates[locale]) throw new Error(`Missing plain Vue locale: ${locale}`)
    expect(Object.keys(labels)).toHaveLength(18)
    for (const value of Object.values(labels))
      expect(typeof value === 'string' ? value.length : value(2, 7).length).toBeGreaterThan(0)
    expect(templates[locale]).toHaveLength(18)
    expect(Object.keys(labels)).toEqual(Object.keys(resolvePhotoLabels('en')))
    for (const [index, template] of templates[locale].entries()) {
      expect(template.match(/\{[^}]+\}/g) ?? []).toEqual(
        index < 15 ? [] : index < 17 ? ['{index}'] : ['{index}', '{count}'],
      )
    }
    expect(labels.goToSlide(2)).toContain('2')
    expect(labels.viewPhoto(2)).toContain('2')
    expect(labels.slideStatus(2, 7)).toContain('7')
  }
})

it('nested provider and recipe lightbox options retain inherited labels and the nearest component', async () => {
  const Viewer = defineComponent({
    setup() {
      const labels = usePhotoLabels()
      return () => h('p', { id: 'viewer' }, `${labels.close} / ${labels.next}`)
    },
  })
  const OuterViewer = defineComponent({ render: () => h('p', 'Wrong viewer') })
  const photos = [makePhoto({ alt: undefined })]
  const Root = defineComponent({
    render: () =>
      h(
        LightboxProvider,
        { photos, minZoom: 3 },
        {
          default: () =>
            h(
              PhotoGroup,
              { photos, lightbox: { component: Viewer } },
              {
                default: () => h(PhotoAlbum, { photos, lightbox: { minZoom: 4 } }),
              },
            ),
        },
      ),
  })
  const mounted = await mountComponent(Root, {
    plugins: [
      createPhoto({
        labels: { close: 'Global close' },
        lightbox: { component: OuterViewer, minZoom: 2 },
      }),
    ],
  })
  expect(mounted.container.querySelector('#viewer')?.textContent).toBe('Global close / Next')
  expect(mounted.container.textContent).not.toContain('Wrong viewer')
  mounted.unmount()
})

it('component validation overrides inherited drop policy and config dimensions resolve first', async () => {
  const invalid = { id: 'bad', src: '/bad.jpg' }
  const photos = [makePhoto(), invalid] as ReturnType<typeof makePhoto>[]
  const render = (validation?: 'throw') => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, lightbox: false, validation }),
    })
    app.use(createPhoto({ validation: 'drop' }))
    return renderToString(app)
  }
  expect((await render()).match(/<img/g)).toHaveLength(1)
  await expect(render('throw')).rejects.toThrow('has no width; pass width and height')
  const app = createSSRApp({
    render: () =>
      h(PhotoAlbum, { photos: [invalid] as ReturnType<typeof makePhoto>[], lightbox: false }),
  })
  app.use(createPhoto({ dimensions: () => ({ width: 100, height: 50 }) }))
  expect(await renderToString(app)).toContain('width="100" height="50"')
})

// Catches the primitive losing runtime validation or dimension resolution when its imports shrink.
it('PhotoImage resolves dimensions and still reports all invalid fields', async () => {
  const render = (photo: unknown) => {
    const app = createSSRApp({
      render: () => h(PhotoImage, { photo: JSON.parse(JSON.stringify(photo)) }),
    })
    app.use(createPhoto({ dimensions: () => ({ width: 100, height: 50 }) }))
    return renderToString(app)
  }
  expect(await render({ id: 'image', src: '/image.jpg' })).toContain('width="100" height="50"')
  await expect(render({ id: 'image', src: '', meta: 'invalid' })).rejects.toMatchObject({
    name: 'PhotoValidationError',
    owner: 'PhotoImage',
    issues: [
      { code: 'missing-src', index: 0 },
      { code: 'invalid-meta', index: 0 },
    ],
  })
  await expect(
    render({ id: 'image', src: '/image.jpg', width: 0, height: 50 }),
  ).rejects.toBeInstanceOf(PhotoValidationError)
})

it('validatePhotos is pure, drops invalid photos, and names the missing-dimension fix', () => {
  const valid = Object.freeze(makePhoto({ id: 'valid' }))
  const missing = Object.freeze({ id: 'lake', src: '/lake.jpg' })
  const input = [valid, missing]
  const result = validatePhotos(input, { owner: 'Import' })
  expect(result.photos).toEqual([valid])
  expect(result.issues.map(({ code, owner }) => ({ code, owner }))).toEqual([
    { code: 'invalid-width', owner: 'Import' },
    { code: 'invalid-height', owner: 'Import' },
  ])
  expect(result.issues[0]?.message).toBe(
    'photo "lake" has no width; pass width and height, or in Nuxt use localImages / usePhotoFolder for files in public/',
  )
  expect(input).toEqual([valid, { id: 'lake', src: '/lake.jpg' }])
})
