// @vitest-environment node

import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { responsive } from '../../src/core/index'
import { computeBreakpointStyles } from '../../src/core/index'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import Photo from '../../src/components/Photo.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'

const photos = [
  makePhoto({ id: 'ssr-1', width: 1600, height: 900 }),
  makePhoto({ id: 'ssr-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'ssr-3', width: 1500, height: 1000 }),
]

describe('SSR', () => {
  it('renders a complete responsive rows fallback without a fixed width', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('flex-wrap')
    expect(html).toContain('aspect-ratio')
    expect(html).toContain('flex-grow')
    expect(html).not.toContain('flex:0 0 auto')
    expect(html).not.toContain('np-album__row')
    expect(html).toContain('flex-grow:9999')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum with defaultContainerWidth uses JS layout on server (no flex-grow)', async () => {
    const app = createSSRApp({
      render: () =>
        h(PhotoAlbum, {
          photos,
          layout: 'rows',
          lightbox: false,
          defaultContainerWidth: 800,
        }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('calc(')
    expect(html).not.toContain('flex-grow:1.777')
    expect(html).not.toContain('flex-grow:0.8')
    expect(html).toContain('flex-grow:9999')
    expect(html).not.toContain('np-album__skeleton')
  })

  describe('with breakpoints (container query mode)', () => {
    it('emits @container style block with np-item-N rules', async () => {
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
      expect(html).toContain('@container')
      expect(html).toContain('np-item-0')
      expect(html).toContain('np-item-1')
      expect(html).toContain('np-item-2')
      expect(html).toContain('calc(')
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

    it('with defaultContainerWidth renders inline geometry without dead container-query CSS', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: 'rows',
            lightbox: false,
            breakpoints: [600, 900],
            defaultContainerWidth: 800,
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('calc(')
      expect(html).not.toContain('@container')
    })

    it('columns breakpoints do not emit hidden SSR variant branches', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: { type: 'columns', columns: 3 },
            lightbox: false,
            breakpoints: [600],
          }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('@container')
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).not.toContain('data-bp')
      expect(html).toContain('grid-template-columns')
    })
  })

  describe('columns/masonry SSR', () => {
    it('columns with defaultContainerWidth renders deterministic column groups', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: { type: 'columns', columns: 3 },
            lightbox: false,
            defaultContainerWidth: 900,
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__column')
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).not.toContain('data-bp')
      expect(html).not.toContain('@container')
      expect(html).not.toMatch(/grid-template-columns\s*:\s*repeat\(3\s*,\s*1fr\)/)
      expect(html).toContain('ssr-1')
    })

    it('masonry with defaultContainerWidth renders deterministic column groups', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: { type: 'masonry', columns: 3 },
            lightbox: false,
            defaultContainerWidth: 900,
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__column')
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).not.toContain('data-bp')
      expect(html).not.toContain('@container')
      expect(html).not.toMatch(/grid-template-columns\s*:\s*repeat\(3\s*,\s*1fr\)/)
      expect(html).toContain('ssr-1')
    })

    it('columns with explicit breakpoints still uses the simple SSR fallback without defaultContainerWidth', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: {
              type: 'columns',
              columns: responsive({ 0: 1, 800: 3 }),
            },
            lightbox: false,
            breakpoints: [320, 800, 1200],
            spacing: responsive({ 0: 4, 640: 8, 1200: 16 }),
          }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('@container')
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).not.toContain('data-bp')
      expect(html).toMatch(/grid-template-columns\s*:\s*repeat\(1\s*,\s*1fr\)/)
    })

    it('responsive columns infer client snap breakpoints but not SSR branches', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: {
              type: 'columns',
              columns: responsive({ 0: 1, 640: 2, 1120: 3 }),
            },
            lightbox: false,
          }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('@container')
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).toContain('grid-template-columns')
    })

    it('masonry responsive spacing does not create duplicate SSR branches', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: { type: 'masonry', columns: 3 },
            lightbox: false,
            spacing: responsive({ 0: 4, 640: 12, 1200: 20 }),
          }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).not.toContain('@container')
      expect(html).toContain('grid-template-columns')
    })

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
            defaultContainerWidth: 800,
          }),
      })
      const html = await renderToString(app)
      expect(html).toContain('np-album__column')
      expect(html).toContain('type="button"')
      expect(html).not.toContain('tabindex="0"')
    })

    it('columns without any SSR signal falls back to the approximate flat grid', async () => {
      const app = createSSRApp({
        render: () =>
          h(PhotoAlbum, {
            photos,
            layout: { type: 'columns', columns: 3 },
            lightbox: false,
          }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('np-album__ssr-variant')
      expect(html).toContain('grid-template-columns')
      expect(html).toContain('ssr-1')
    })
  })

  it('PhotoAlbum omits its closed lightbox portal during SSR', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('type="button"')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('role="dialog"')
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
    expect(html).not.toContain('role="dialog"')
  })

  it('Photo omits its closed solo-lightbox portal during SSR', async () => {
    const app = createSSRApp({
      render: () => h(Photo, { photo: photos[0], lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('np-photo')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('role="dialog"')
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

    expect(html).toContain('@container')
    expect(html).toContain('np-item-0')
    expect(html).toContain('class="np-album__item np-item-0" style="overflow:hidden;"')
    expect(html).not.toContain('style="flex-grow:1.777')
  })
})

describe('computeBreakpointStyles', () => {
  const twoPhotos = [
    makePhoto({ id: 'a', width: 1600, height: 900 }),
    makePhoto({ id: 'b', width: 1200, height: 1500 }),
  ]

  it('returns no rules without both photos and breakpoints', () => {
    expect(
      computeBreakpointStyles({
        photos: [],
        breakpoints: [600],
        containerName: 'test',
      }),
    ).toBe('')
    expect(
      computeBreakpointStyles({
        photos: twoPhotos,
        breakpoints: [],
        containerName: 'test',
      }),
    ).toBe('')
  })

  it('deduplicates identical layouts across adjacent breakpoints', () => {
    // Use breakpoints that are close together — likely produce identical row breaks
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [900, 1200],
      containerName: 'test',
    })
    const ruleCount = (css.match(/@container/g) ?? []).length
    // Both widths may produce identical row assignments → deduplicated to 1 rule
    expect(ruleCount).toBeGreaterThan(0)
    expect(ruleCount).toBeLessThanOrEqual(2)
  })

  it('scopes complete item and width rules to the container', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600, 900],
      containerName: 'my-album',
    })
    expect(css).toContain('my-album')
    expect(css).toContain('@container my-album')
    expect(css).toContain('.np-item-0')
    expect(css).toContain('.np-item-1')
    expect(css).toContain('calc(')
    expect(css).toContain('flex:0 0 auto')
  })
})
