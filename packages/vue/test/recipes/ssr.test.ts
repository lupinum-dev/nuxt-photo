// @vitest-environment node

import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { computeFramePlan, responsive } from '../../src/core/index'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import Photo from '../../src/components/Photo.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'

const photos = [
  makePhoto({ id: 'ssr-1', width: 1600, height: 900 }),
  makePhoto({ id: 'ssr-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'ssr-3', width: 1500, height: 1000 }),
]

describe('SSR', () => {
  it('renders complete rows positioned by CSS without a width', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('container-type:inline-size')
    expect(html).toMatch(/<style>@container np-\w+ \(width < \d+px\)/)
    expect(html).toContain('aspect-ratio')
    // Grow factors are aspect ratios, scaled so the narrowest photo grows by 1.
    expect(html).toContain('style="flex-grow:2.22222;"')
    expect(html.match(/<span class="np-br-\d np-album__break"/g)).toHaveLength(2)
    expect(html).not.toContain('width:calc(')
    expect(html).not.toContain('np-album__row')
    expect(html).not.toContain('flex-grow:9999')
  })

  it('names the album CSS scope without an instance ID', async () => {
    // A host app can give a component another `useId()` on the server than in the browser
    // (a Markdown renderer did). The album then lost its layout after hydration.
    const render = (idPrefix: string, layout: 'columns' | 'masonry') => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout, lightbox: false }),
      })
      app.config.idPrefix = idPrefix
      return renderToString(app)
    }
    const names = (html: string) => ({
      scopeClass: html.match(/np-scope-(np-\w+)/)?.[1],
      container: html.match(/container-name:(np-\w+)/)?.[1],
      query: html.match(/@container (np-\w+)/)?.[1],
    })
    const server = names(await render('server', 'columns'))
    const browser = names(await render('browser', 'columns'))
    const otherAlbum = names(await render('server', 'masonry'))

    expect(server.container).toMatch(/^np-\w+$/)
    expect(new Set(Object.values(server)).size).toBe(1)
    expect(browser).toEqual(server)
    expect(otherAlbum.container).not.toBe(server.container)
  })

  describe('with breakpoints (container query mode)', () => {
    it('emits @container rules that show the breaks at row ends', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: 'rows',
            lightbox: false,
            breakpoints: [375, 600, 900],
          }),
      })
      const html = await renderToString(app)
      expect(html).toMatch(
        /@container np-\w+[^{]*\{\.np-album__frame\{--np-gap:8px;--np-padding:0px\}/,
      )
      expect(html).toMatch(/\.np-br-\d[^{]*\{display:block\}/)
      expect(html).not.toContain('(width >= 320px)')
    })

    it('sets container-type: inline-size on the album wrapper', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: 'rows',
            lightbox: false,
            breakpoints: [600],
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('container-type')
      expect(html).toContain('inline-size')
    })

    it('renders no inline width on items when only breakpoints is provided', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: 'rows',
            lightbox: false,
            breakpoints: [600],
          }),
      })
      const html = await renderToString(app)
      // flex:0 0 auto appears in the @container CSS — but NOT as inline styles on item elements
      expect(html).not.toContain('style="flex:0 0 auto')
      expect(html).toContain('ssr-1')
    })
  })

  describe('columns/masonry SSR', () => {
    const photo = /<div class="np-album__item[ "][^>]*>[\s\S]*?ssr-(\d)/g
    it.each([
      ['columns', { type: 'columns', columns: 3 }, {}],
      ['columns with breakpoints', { type: 'columns', columns: 3 }, { breakpoints: [600] }],
      [
        'responsive columns and spacing',
        { type: 'columns', columns: responsive({ 0: 1, 800: 3 }) },
        { breakpoints: [320, 800, 1200], spacing: responsive({ 0: 4, 640: 8, 1200: 16 }) },
      ],
      ['masonry', { type: 'masonry', columns: 3 }, {}],
      [
        'masonry with responsive spacing',
        { type: 'masonry', columns: 3 },
        { spacing: responsive({ 0: 4, 640: 12, 1200: 20 }) },
      ],
    ] as const)(
      '%s renders each photo once, in photo order, placed by container CSS',
      async (_, layout, extra) => {
        const html = await renderToString(
          createSSRApp({
            render: () => h(PhotoAlbum, { photos, layout, lightbox: false, ...extra }),
          }),
        )
        expect([...html.matchAll(photo)].map((match) => match[1])).toEqual(['1', '2', '3'])
        expect(html).toMatch(/<style>@container np-\w+[^{]*\{\.np-album__frame\{/)
        expect(html).not.toContain('np-album__column')
        expect(html).not.toContain('100vw')
      },
    )

    it('deterministic server layout keeps button semantics when lightbox is enabled', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: {
              type: 'columns',
              columns: responsive({ 0: 1, 800: 3 }),
            },
            lightbox: true,
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('role="button"')
      expect(html).toContain('tabindex="0"')
    })
  })

  it('PhotoAlbum omits its closed lightbox portal during SSR', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('role="button"')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('<dialog')
  })

  it('PhotoGroup omits its closed shared-lightbox portal during SSR', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          PhotoGroup,
          { photos },
          {
            default: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
          },
        ),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('<dialog')
  })

  it('Photo omits its closed solo-lightbox portal during SSR', async () => {
    const app = createSSRApp({
      render: () => h(Photo, { photo: photos[0], lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('np-photo')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('<dialog')
  })

  it('infers breakpoints from responsive() metadata when rows options are responsive', async () => {
    const app = createSSRApp({
      render: () =>
        h(PhotoAlbum, {
          photos,
          layout: {
            type: 'rows',
            targetRowHeight: responsive({ 0: 180, 640: 240, 1120: 280 }),
          },
          spacing: responsive({ 0: 4, 640: 8 }),
          lightbox: false,
        }),
    })

    const html = await renderToString(app)

    // The responsive() keys replace the default ladder above the smallest key.
    expect(html).toMatch(/\(width < \d+px\)\{\.np-album__frame\{--np-gap:4px/)
    expect(html).toContain('(width >= 640px) and (width < 1120px){.np-album__frame{--np-gap:8px')
    expect(html).toContain('(width >= 1120px)')
    expect(html).not.toContain('320px')
  })
})

describe('CSS-only album SSR', () => {
  it.each(['grid', 'mosaic', 'accordion'] as const)(
    'renders %s completely from CSS',
    async (type) => {
      const framePhotos = Array.from({ length: 8 }, (_, index) =>
        makePhoto({ id: `frame-${index}`, width: 1200 + index * 100, height: 900 }),
      )
      const html = await renderToString(
        createSSRApp({
          render: () =>
            h(PhotoAlbum, { photos: framePhotos, layout: { type, max: 5 }, lightbox: false }),
        }),
      )
      expect(html).toContain(`np-album--${type}`)
      expect(html).toContain('container-type:inline-size')
      expect(html).toMatch(/<style>@container/)
      expect(html.match(/class="np-album__item"/g)).toHaveLength(type === 'mosaic' ? 5 : 8)
      expect(html.match(/object-fit:cover/g)).toHaveLength(type === 'mosaic' ? 5 : 8)
      if (type === 'mosaic') expect(html).toContain('+3')
    },
  )
})

it('renders responsive bento CSS with the primary reading order and item classes', async () => {
  const photos = Array.from({ length: 12 }, (_, index) =>
    makePhoto({ id: `bento-${index}`, width: [1600, 900, 1200][index % 3], height: 1000 }),
  )
  const columns = responsive({ 0: 2, 768: 4 })
  const html = await renderToString(
    createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: { type: 'bento', columns }, lightbox: false }),
    }),
  )
  const frame = computeFramePlan({
    type: 'bento',
    photos,
    columns,
    containerName: 'album',
    breakpoints: [768],
  })
  expect(html).toContain('np-album--bento')
  expect(html).toContain('container-type:inline-size')
  expect(html).toMatch(/<style>.*grid-column/s)
  expect(html).toContain('(width < 768px)')
  expect(html).toContain('(width >= 768px)')
  expect([...html.matchAll(/src="\/photos\/(bento-\d+)\.jpg"/g)].map((match) => match[1])).toEqual(
    frame.order.map((index) => photos[index]!.id),
  )
  expect(
    [...html.matchAll(/class="np-album__item np-item-(\d+)"/g)].map((match) => Number(match[1])),
  ).toEqual(Array.from({ length: 12 }, (_, index) => index))
  expect(html.match(/object-fit:cover/g)).toHaveLength(12)
})
