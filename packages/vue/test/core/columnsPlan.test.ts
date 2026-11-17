import { describe, expect, it } from 'vite-plus/test'
import {
  computeColumnsLayout,
  computeColumnsPlan,
  computeMasonryLayout,
  computeMasonryPlan,
  responsive,
  type AlbumPlan,
  type ResolvedPhotoItem as PhotoItem,
} from '../../src/core/index'

const photos: PhotoItem[] = [
  [1600, 900],
  [900, 1600],
  [1000, 1000],
  [1500, 1000],
  [800, 1200],
  [2400, 800],
  [1200, 900],
].map(([width, height], index) => ({ id: `p${index}`, src: `/p${index}.jpg`, width, height }))

const options = {
  photos,
  containerName: 'album',
  breakpoints: [400, 800],
  spacing: 8,
  padding: 2,
  columns: responsive({ 0: 2, 800: 3 }),
}

type Box = { left: number; top: number; width: number }

/** Evaluate `calc(Acqi + Bpx)` at an album width. */
function length(value: string, width: number) {
  const match = value.match(/^calc\((-?[\d.]+)cqi \+ (-?[\d.]+)px\)$/)!
  return (Number(match[1]) / 100) * width + Number(match[2])
}

function declarations(body: string) {
  return Object.fromEntries(
    body.split(';').map((declaration) => {
      const at = declaration.indexOf(':')
      return [declaration.slice(0, at), declaration.slice(at + 1)]
    }),
  )
}

/** The span of the plan's CSS that applies at `width`, split into selector and declarations. */
function spanAt(plan: AlbumPlan, width: number) {
  const index = plan.widths.filter((entry) => entry.start <= width).length - 1
  const rule = plan.css.split('\n')[index]!
  const body = rule.slice(rule.indexOf('{') + 1, -1)
  return [...body.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, values]) => ({
    selector: selector!,
    values: declarations(values!),
  }))
}

/** Item boxes as the static CSS in `album.css` computes them from the plan's values. */
function columnsBoxes(plan: AlbumPlan, width: number): Box[] {
  const rules = spanAt(plan, width)
  const frame = rules[0]!.values
  const step = 2 * parseFloat(frame['--np-padding']!) + parseFloat(frame['--np-gap']!)
  return plan.items.map((item) => {
    const rule = rules.slice(1).find(({ selector }) => {
      const from = Number(selector.match(/nth-child\(n\+(\d+)\)/)?.[1] ?? 1) - 1
      const to = Number(selector.match(/nth-child\(-n\+(\d+)\)/)?.[1] ?? Infinity)
      return item.index >= from && item.index < to
    })!.values
    const columnWidth = length(rule['--np-w']!, width)
    return {
      left: length(rule['--np-x']!, width),
      width: columnWidth,
      top:
        columnWidth * (Number(item.style['--np-p']) - Number(rule['--np-p0'])) +
        (Number(item.style['--np-i']) - Number(rule['--np-i0'])) * step,
    }
  })
}

function masonryBoxes(plan: AlbumPlan, width: number): Box[] {
  const rules = spanAt(plan, width)
  const frame = rules[0]!.values
  const step = 2 * parseFloat(frame['--np-padding']!) + parseFloat(frame['--np-gap']!)
  const columnWidth = length(frame['--np-w']!, width)
  return plan.items.map((item) => {
    const values = {
      ...rules.find(({ selector }) => selector === `.${item.className}`)?.values,
      ...item.style,
    }
    const number = (name: string) => Number(values[name] ?? 0)
    return {
      left: number('--np-c') * (columnWidth + step),
      width: columnWidth,
      top: columnWidth * number('--np-q') + number('--np-k') * step,
    }
  })
}

/** Boxes of photo indexes stacked in columns of the given widths, with padding and spacing. */
function stackedBoxes(
  picks: readonly (readonly number[])[],
  columnWidths: number[],
  padding: number,
  spacing: number,
) {
  const boxes: Box[] = []
  let left = 0
  for (const [column, indexes] of picks.entries()) {
    const width = columnWidths[column]!
    let top = 0
    for (const index of indexes) {
      boxes[index] = { left, top, width }
      top += (width * photos[index]!.height) / photos[index]!.width + 2 * padding + spacing
    }
    left += width + 2 * padding + spacing
  }
  return boxes
}

// Masonry picks each photo's column at the first planned width of a run with one
// column count; at 500 and 1200px the solver alone would pick differently.
const masonryOptions = { ...options, spacing: 32 }
const masonryTwo = [
  [0, 2, 4],
  [1, 3, 5, 6],
]
const masonryThree = [
  [0, 3, 5],
  [1, 6],
  [2, 4],
]

describe.each([
  {
    layout: 'columns',
    plan: computeColumnsPlan,
    solver: computeColumnsLayout,
    boxes: columnsBoxes,
    options,
    // Per album width: the width the solver is asked at, and its photo indexes per column.
    expected: {
      320: {
        at: 320,
        columns: 2,
        picks: [
          [0, 1, 2],
          [3, 4, 5, 6],
        ],
      },
      400: {
        at: 400,
        columns: 2,
        picks: [
          [0, 1, 2],
          [3, 4, 5, 6],
        ],
      },
      800: {
        at: 800,
        columns: 3,
        picks: [
          [0, 1],
          [2, 3],
          [4, 5, 6],
        ],
      },
    },
  },
  {
    layout: 'masonry',
    plan: computeMasonryPlan,
    solver: computeMasonryLayout,
    boxes: masonryBoxes,
    options: masonryOptions,
    expected: {
      320: { at: 320, columns: 2, picks: masonryTwo },
      500: { at: 320, columns: 2, picks: masonryTwo },
      800: { at: 800, columns: 3, picks: masonryThree },
      1200: { at: 800, columns: 3, picks: masonryThree },
    },
  },
  {
    layout: 'masonry with one column count',
    plan: computeMasonryPlan,
    solver: computeMasonryLayout,
    boxes: masonryBoxes,
    options: { ...masonryOptions, columns: 3 },
    expected: {
      320: { at: 320, columns: 3, picks: masonryThree },
      1200: { at: 320, columns: 3, picks: masonryThree },
    },
  },
] as const)('$layout plan', ({ plan, solver, boxes, options, expected }) => {
  const result = plan(options)

  it.each(Object.entries(expected))('places photos like the solver at %spx', (key, solved) => {
    const solve = (containerWidth: number) =>
      solver({
        photos,
        containerWidth,
        spacing: options.spacing,
        padding: 2,
        columns: solved.columns,
      })
    const picks = solve(solved.at).map((group) => group.entries.map((entry) => entry.index))
    expect(picks).toEqual(solved.picks)
    const width = Number(key)
    const columnWidths = solve(width).map((group) => group.entries[0]!.width)
    const actual = boxes(result, width)
    for (const [index, box] of stackedBoxes(picks, columnWidths, 2, options.spacing).entries()) {
      for (const name of ['left', 'top', 'width'] as const)
        expect(Math.abs(actual[index]![name] - box[name]), `photo ${index} ${name}`).toBeLessThan(
          0.01,
        )
    }
  })

  it('keeps photos order in the DOM and for navigation', () => {
    expect(result.items.map((item) => item.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(result.order).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

it('keeps masonry photos in place when photos are appended', () => {
  const plan = (count: number) =>
    computeMasonryPlan({ ...masonryOptions, photos: photos.slice(0, count) })
  for (const width of [500, 1200])
    expect(masonryBoxes(plan(7), width).slice(0, 5)).toEqual(masonryBoxes(plan(5), width))
})

it('writes masonry values inline when one column count covers every width', () => {
  const plan = computeMasonryPlan({ ...masonryOptions, columns: 3 })
  expect(plan.css).not.toContain('np-item')
  expect(plan.items[4]).toEqual({
    index: 4,
    style: { '--np-c': '2', '--np-q': '1', '--np-k': '1' },
  })
})
