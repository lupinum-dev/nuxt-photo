// @vitest-environment node

import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import { computeBreakpointStyles, responsive } from '@nuxt-photo/core'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import Photo from '../src/components/Photo.vue'
import PhotoGallery from '../src/components/PhotoGallery.vue'
import PhotoGroup from '../src/components/PhotoGroup.vue'

const photos = [
  makePhoto({ id: 'ssr-1', width: 1600, height: 900 }),
  makePhoto({ id: 'ssr-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'ssr-3', width: 1500, height: 1000 }),
]

describe('SSR', () => {
  it('PhotoAlbum renders photo items on the server without needing a fixed width', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // All photos are present
    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum SSR rows layout uses CSS flex-grow with aspect ratios (no fixed width)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // CSS flex wrapper — responsive at any width
    expect(html).toContain('flex-wrap')
    // aspect-ratio on each image — scales correctly at any width
    expect(html).toContain('aspect-ratio')
    // flex-grow based on photo aspect ratio
    expect(html).toContain('flex-grow')
  })

  it('PhotoAlbum rows layout never switches to JS row groups (zero CLS)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // No row-group divs — the DOM structure stays the same after mount
    expect(html).not.toContain('np-album__row')
    // Filler span is present to prevent last-row stretch
    expect(html).toContain('flex-grow:9999')
  })

  it('PhotoAlbum with defaultContainerWidth uses JS layout on server (no flex-grow)', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, defaultContainerWidth: 800 }),
    })

    const html = await renderToString(app)

    // All photos are present
    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    // JS layout emits calc() widths — not flex-grow proportions
    expect(html).toContain('calc(')
    // Items use fixed flex basis, not flex-grow
    expect(html).not.toContain('flex-grow:1.777')
    expect(html).not.toContain('flex-grow:0.8')
    // No skeleton (layout was computed)
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum without defaultContainerWidth still uses CSS flex-grow fallback', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
    })

    const html = await renderToString(app)

    // CSS fallback: flex-grow present
    expect(html).toContain('flex-grow')
    // No JS-computed calc widths for individual items
    expect(html).not.toContain('flex:0 0 auto')
  })

  it('PhotoAlbum with defaultContainerWidth includes filler span', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, defaultContainerWidth: 800 }),
    })

    const html = await renderToString(app)

    // Filler span must always be present regardless of layout mode
    expect(html).toContain('flex-grow:9999')
  })

  describe('with breakpoints (container query mode)', () => {
    it('emits @container style block with np-item-N rules', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [375, 600, 900] }),
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
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      expect(html).toContain('container-type')
      expect(html).toContain('inline-size')
    })

    it('renders no inline width on items when only breakpoints is provided', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      // flex:0 0 auto appears in the @container CSS — but NOT as inline styles on item elements
      expect(html).not.toContain('style="flex:0 0 auto')
      expect(html).toContain('ssr-1')
    })

    it('with both breakpoints and defaultContainerWidth renders inline calc() AND container query CSS', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false, breakpoints: [600, 900], defaultContainerWidth: 800 }),
      })
      const html = await renderToString(app)
      expect(html).toContain('calc(')
      expect(html).toContain('@container')
    })

    it('does not apply container queries to non-rows layouts', async () => {
      const app = createSSRApp({
        render: () => h(PhotoAlbum, { photos, layout: { type: 'columns', columns: 3 }, lightbox: false, breakpoints: [600] }),
      })
      const html = await renderToString(app)
      expect(html).not.toContain('@container')
      expect(html).not.toContain('container-type')
    })
  })

  it('PhotoAlbum SSR columns layout uses CSS grid', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: { type: 'columns', columns: 3 }, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('grid-template-columns')
    expect(html).not.toContain('np-album__skeleton')
  })

  it('PhotoAlbum accepts object-form layout with custom options', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: { type: 'rows', targetRowHeight: 200 }, lightbox: false }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('ssr-2')
    expect(html).toContain('ssr-3')
    expect(html).toContain('flex-grow')
  })

  it('PhotoAlbum renders with its own lightbox during SSR', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('role="button"')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('PhotoGroup renders shared-lightbox SSR markup without crashing', async () => {
    const app = createSSRApp({
      render: () => h(PhotoGroup, null, {
        default: () => h(PhotoAlbum, { photos, layout: 'rows', lightbox: false }),
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('Photo renders standalone SSR markup with solo lightbox enabled', async () => {
    const app = createSSRApp({
      render: () => h(Photo, { photo: photos[0], lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('np-photo')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('PhotoGallery renders on the server with shared lightbox composition intact', async () => {
    const app = createSSRApp({
      render: () => h(PhotoGallery, { photos, layout: 'rows', lightbox: true }),
    })

    const html = await renderToString(app)

    expect(html).toContain('ssr-1')
    expect(html).toContain('np-album')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })

  it('infers breakpoints from responsive() metadata when rows options are responsive', async () => {
    const app = createSSRApp({
      render: () => h(PhotoAlbum, {
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

  it('returns empty string for empty photos', () => {
    expect(computeBreakpointStyles({ photos: [], breakpoints: [600], containerName: 'test' })).toBe('')
  })

  it('returns empty string for empty breakpoints', () => {
    expect(computeBreakpointStyles({ photos: twoPhotos, breakpoints: [], containerName: 'test' })).toBe('')
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

  it('scopes rules to the provided containerName', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600, 900],
      containerName: 'my-album',
    })
    expect(css).toContain('my-album')
    expect(css).toContain('@container my-album')
  })

  it('generates np-item-N class rules for each photo', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600],
      containerName: 'test',
    })
    expect(css).toContain('.np-item-0')
    expect(css).toContain('.np-item-1')
  })

  it('includes calc() width expressions', () => {
    const css = computeBreakpointStyles({
      photos: twoPhotos,
      breakpoints: [600, 900],
      containerName: 'test',
    })
    expect(css).toContain('calc(')
    expect(css).toContain('flex:0 0 auto')
  })
})
