import { describe, expect, it } from 'vitest'
import { computeColumnsLayout } from '../src/runtime/utils/columns'
import { computeMasonryLayout } from '../src/runtime/utils/masonry'
import { computeRowsLayout } from '../src/runtime/utils/rows'

const items = [
  { src: '/one.jpg', width: 1200, height: 800 },
  { src: '/two.jpg', width: 1200, height: 900 },
  { src: '/three.jpg', width: 1600, height: 900 },
  { src: '/four.jpg', width: 800, height: 1200 },
]

describe('layout utils', () => {
  it('computes rows layout', () => {
    const result = computeRowsLayout({
      items,
      layoutOptions: {
        containerWidth: 960,
        layout: 'rows',
        padding: 0,
        spacing: 16,
        targetRowHeight: 220,
      },
    })

    expect(result).toBeTruthy()
    expect(result?.[0]?.[0]?.layout.width).toBeGreaterThan(0)
  })

  it('computes columns layout', () => {
    const result = computeColumnsLayout({
      items,
      layoutOptions: {
        columns: 3,
        containerWidth: 960,
        layout: 'columns',
        padding: 0,
        spacing: 16,
      },
    })

    expect(result?.columnsModel).toHaveLength(3)
  })

  it('computes masonry layout', () => {
    const result = computeMasonryLayout({
      items,
      layoutOptions: {
        columns: 3,
        containerWidth: 960,
        layout: 'masonry',
        padding: 0,
        spacing: 16,
      },
    })

    expect(result).toHaveLength(3)
  })
})
