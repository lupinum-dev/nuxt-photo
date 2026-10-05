import { describe, expect, it } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { computeFrameLayout, responsive } from '../../src/core/index'
import { computeBentoLayout } from '../../src/core/layout/bento'

describe('CSS-only frame layouts', () => {
  it('merges identical samples into complete responsive grid ranges', () => {
    const result = computeFrameLayout({
      type: 'grid',
      photos: [makePhoto()],
      containerName: 'album',
      columns: responsive({ 0: 2, 640: 3, 1024: 4 }),
      breakpoints: [1024, 320, 640, 640, NaN, -1, Infinity, 1200],
    })
    expect(result.css).toBe(
      [
        '@container album (width < 640px){.np-album__frame{--np-gap:8px;--np-padding:0px;--np-columns:2}}',
        '@container album (width >= 640px) and (width < 1024px){.np-album__frame{--np-gap:8px;--np-padding:0px;--np-columns:3}}',
        '@container album (width >= 1024px){.np-album__frame{--np-gap:8px;--np-padding:0px;--np-columns:4}}',
      ].join('\n'),
    )
    expect(result.items).toEqual([{ index: 0, style: {} }])
    expect(result.order).toEqual([0])
  })

  it('positions mosaic fractions with the gap and puts overflow only on the last tile', () => {
    const photos = Array.from({ length: 8 }, (_, index) => makePhoto({ id: `tile-${index}` }))
    const result = computeFrameLayout({ type: 'mosaic', photos, max: 1, containerName: 'album' })
    expect(result.items).toEqual([
      {
        index: 0,
        more: 7,
        style: {
          'inset-inline-start': 'calc((100% + var(--np-gap)) * 0)',
          top: 'calc((100% + var(--np-gap)) * 0)',
          width: 'calc((100% + var(--np-gap)) * 1 - var(--np-gap))',
          height: 'calc((100% + var(--np-gap)) * 1 - var(--np-gap))',
        },
      },
    ])
    const multiple = computeFrameLayout({ type: 'mosaic', photos, max: 5, containerName: 'album' })
    expect(multiple.items.map((item) => item.more)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      3,
    ])
    expect(multiple.order).toEqual([...multiple.items.map((item) => item.index), 5, 6, 7])
    expect([...multiple.order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('gives each accordion item growth for its own photo ratio', () => {
    const photos = [0.5, 1, 2].map((ratio, index) =>
      makePhoto({ id: String(index), width: ratio * 1000, height: 1000 }),
    )
    const result = computeFrameLayout({ type: 'accordion', photos, containerName: 'album' })
    expect(result.items).toEqual([
      { index: 0, style: { '--np-open': '1' } },
      { index: 1, style: { '--np-open': '2' } },
      { index: 2, style: { '--np-open': '3.2632' } },
    ])
    expect(result.order).toEqual([0, 1, 2])
    expect(result.css).toBe('@container album{.np-album__frame{--np-gap:8px;--np-padding:0px}}')
  })

  it.each([
    ['grid', '1'],
    ['mosaic', '1.33333'],
    ['bento', '1.33333'],
    ['accordion', '2'],
  ] as const)('normalizes invalid %s aspect ratios and handles empty albums', (type, ratio) => {
    for (const aspectRatio of [undefined, NaN, Infinity, 0, -1]) {
      const result = computeFrameLayout({ type, photos: [], containerName: 'album', aspectRatio })
      expect(result).toEqual({
        css: '',
        frameStyle: { '--np-aspect-ratio': ratio },
        items: [],
        order: [],
        widths: [],
      })
    }
  })

  // Image sizes come from these shares; a wrong share downloads too large or blurry files.
  it('reports the width share of every tile per container range', () => {
    const photos = Array.from({ length: 6 }, (_, index) => makePhoto({ id: `share-${index}` }))
    const grid = computeFrameLayout({
      type: 'grid',
      photos,
      containerName: 'album',
      columns: responsive({ 0: 2, 768: 4 }),
      breakpoints: [768],
    })
    expect(grid.widths).toEqual([
      { start: 0, shares: Array(6).fill(1 / 2) },
      { start: 768, shares: Array(6).fill(1 / 4) },
    ])

    const bento = computeFrameLayout({ type: 'bento', photos, containerName: 'album', columns: 4 })
    const [featured, ...rest] = bento.widths[0]!.shares
    expect(rest.every((share) => featured! > share)).toBe(true)
    expect(bento.widths[0]!.shares.every((share) => Number.isInteger(share * 4))).toBe(true)

    const mosaic = computeFrameLayout({ type: 'mosaic', photos, containerName: 'album', max: 3 })
    expect(mosaic.widths[0]!.shares).toHaveLength(3)
    expect(mosaic.widths[0]!.shares.every((share) => share > 0 && share <= 1)).toBe(true)

    const accordion = computeFrameLayout({ type: 'accordion', photos, containerName: 'album' })
    const open = accordion.widths[0]!.shares
    // The open slice is at least an equal share and at most 62 % of the strip.
    expect(open.every((share) => share >= 1 / 6 - 1e-4 && share <= 0.62 + 1e-4)).toBe(true)
  })
})

describe('bento frames', () => {
  const photos = Array.from({ length: 12 }, (_, index) =>
    makePhoto({ id: `bento-${index}`, width: [1600, 900, 1200][index % 3], height: 1000 }),
  )

  it('uses the largest count for order and keeps all narrower tiles within their columns', () => {
    const result = computeFrameLayout({
      type: 'bento',
      photos,
      containerName: 'album',
      columns: responsive({ 0: 2, 768: 4 }),
      breakpoints: [768],
    })
    expect(result.order).toEqual(
      computeBentoLayout({ photos, columns: 4 }).tiles.map((t) => t.index),
    )
    const blocks = result.css.split('\n')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toContain('@container album (width < 768px)')
    expect(blocks[1]).toContain('@container album (width >= 768px)')
    blocks.forEach((block, index) => {
      const columns = index === 0 ? 2 : 4
      expect(block).toContain(`--np-columns:${columns}`)
      const rules = [
        ...block.matchAll(
          /\.np-item-(\d+)\{grid-column:(\d+) \/ span (\d+);grid-row:(\d+) \/ span (\d+)\}/g,
        ),
      ]
      expect(rules).toHaveLength(12)
      rules.forEach((rule, position) => {
        expect(Number(rule[1])).toBe(position)
        expect(Number(rule[3])).toBeLessThanOrEqual(columns)
        expect(Number(rule[2]) + Number(rule[3]) - 1).toBeLessThanOrEqual(columns)
      })
    })
    expect(result.items).toEqual(
      result.order.map((index, position) => ({
        index,
        style: {},
        className: `np-item-${position}`,
      })),
    )
    const narrow = computeBentoLayout({
      photos: result.order.map((index) => photos[index]!),
      columns: 2,
      maxShift: 0,
      featured: (_, position) => result.order[position] === 0,
    })
    expect(narrow.tiles.map((tile) => tile.index)).toEqual(
      Array.from({ length: 12 }, (_, index) => index),
    )
  })

  it('features the original photo index and emits one bare container block for one count', () => {
    const featured = (photo: (typeof photos)[number], index: number) => {
      expect(photo).toBe(photos[index])
      return index === 5
    }
    const result = computeFrameLayout({
      type: 'bento',
      photos,
      containerName: 'album',
      columns: 4,
      featured,
    })
    expect(result.css.match(/@container/g)).toHaveLength(1)
    expect(result.css).toMatch(/^@container album\{/)
    const position = result.order.indexOf(5)
    const rule = result.css.match(
      new RegExp(
        `\\.np-item-${position}\\{grid-column:\\d+ / span (\\d+);grid-row:\\d+ / span (\\d+)`,
      ),
    )
    expect(rule).not.toBeNull()
    expect(Number(rule![1])).toBeGreaterThanOrEqual(2)
    expect(Number(rule![2])).toBeGreaterThanOrEqual(2)
    computeFrameLayout({
      type: 'bento',
      photos,
      containerName: 'album',
      columns: responsive({ 0: 2, 768: 4 }),
      breakpoints: [768],
      featured,
    })
  })
})
