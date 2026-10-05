import type { ResolvedPhotoItem as PhotoItem } from '../types'
import { normalizeColumnCount, validatePhotoDimensions } from './types'

export type BentoTile = {
  index: number
  column: number
  row: number
  columnSpan: number
  rowSpan: number
}
export type BentoLayout = { tiles: BentoTile[]; rows: number }
export type BentoLayoutOptions<TMeta extends object = Readonly<Record<string, unknown>>> = {
  photos: readonly PhotoItem<TMeta>[]
  columns: number
  aspectRatio?: number
  featured?: (photo: PhotoItem<TMeta>, index: number) => boolean
  maxShift?: number
}

type Photo = { index: number; ar: number; featured: boolean }
type CellTile = { photo: Photo; r: number; c: number; w: number; h: number; key: string }
type Avoid = { step: number; key: string }
const SMALL = [
  [1, 1],
  [2, 1],
  [1, 2],
] as const
const BIG = [
  [2, 2],
  [3, 2],
  [2, 3],
] as const
const BIG_EVERY = 7

function cropOf(photoAr: number, tileAr: number) {
  return 1 - Math.min(photoAr / tileAr, tileAr / photoAr)
}

function makeGrid(columns: number) {
  const cells = new Map<number, number>()
  return {
    owner: (r: number, c: number) => cells.get(r * columns + c),
    free(r: number, c: number, w: number, h: number) {
      if (c < 0 || c + w > columns || r < 0) return false
      for (let y = r; y < r + h; y++)
        for (let x = c; x < c + w; x++) if (cells.has(y * columns + x)) return false
      return true
    },
    mark(r: number, c: number, w: number, h: number, id: number) {
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) cells.set(y * columns + x, id)
    },
    has: (i: number) => cells.has(i),
  }
}

function packBento(
  photos: Photo[],
  columns: number,
  aspectRatio: number,
  maxShift: number,
  avoid?: Avoid,
  allowBig = true,
) {
  const small = SMALL.filter(([w]) => w <= columns)
  const big = BIG.filter(([w]) => allowBig && w <= columns && columns >= 3)
  const tileAr = (w: number, h: number) => (w * aspectRatio) / h
  const grid = makeGrid(columns)
  const remaining = photos.slice()
  const cellTiles: CellTile[] = []
  let cursor = 0
  let bigCredit = 0
  while (remaining.length) {
    while (grid.has(cursor)) cursor++
    const r = Math.floor(cursor / columns)
    const c = cursor % columns
    const head = remaining[0]!
    const step = cellTiles.length
    const forced = step - head.index >= maxShift
    const window = forced ? [head] : remaining.slice(0, maxShift + 1)
    let best: { cost: number; photo: Photo; w: number; h: number; skip: number } | undefined
    window.forEach((photo, skip) => {
      // The queue window alone does not bound forward moves after earlier skips.
      if (Math.abs(photo.index - step) > maxShift) return
      for (const [w, h] of [...small, ...big]) {
        if (!grid.free(r, c, w, h)) continue
        if (avoid?.step === step && avoid.key === `${photo.index}:${w}x${h}`) continue
        const isBig = w * h >= 4
        let cost = cropOf(photo.ar, tileAr(w, h)) + 0.06 * skip
        if (isBig) cost += photo.featured ? -0.6 : bigCredit >= 1 ? -0.12 : 0.5
        else if (photo.featured && big.length) cost += 0.6
        else if (w * h === 2) cost += 0.03
        if (!best || cost < best.cost) best = { cost, photo, w, h, skip }
      }
    })
    if (!best) return undefined
    grid.mark(r, c, best.w, best.h, step)
    cellTiles.push({
      photo: best.photo,
      r,
      c,
      w: best.w,
      h: best.h,
      key: `${best.photo.index}:${best.w}x${best.h}`,
    })
    remaining.splice(best.skip, 1)
    bigCredit = best.w * best.h >= 4 ? 0 : bigCredit + 1 / BIG_EVERY
  }

  const rows = cellTiles.reduce((m, t) => Math.max(m, t.r + t.h), 0)
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < rows * columns; i++) {
      if (grid.has(i)) continue
      const r = Math.floor(i / columns)
      const c = i % columns
      const options: {
        t: CellTile
        id: number
        r: number
        c: number
        w: number
        h: number
        mark: [number, number, number, number]
      }[] = []
      const add = (id: number | undefined, side: 'left' | 'up' | 'right' | 'down') => {
        if (id === undefined) return
        const t = cellTiles[id]!
        let nr = t.r,
          nc = t.c,
          w = t.w,
          h = t.h
        let mark: [number, number, number, number]
        if (side === 'left') {
          if (t.c + t.w !== c) return
          w++
          mark = [t.r, c, 1, t.h]
        } else if (side === 'up') {
          if (t.r + t.h !== r) return
          h++
          mark = [r, t.c, t.w, 1]
        } else if (side === 'right') {
          if (t.c !== c + 1) return
          nc--
          w++
          mark = [t.r, c, 1, t.h]
        } else {
          if (t.r !== r + 1) return
          nr--
          h++
          mark = [r, t.c, t.w, 1]
        }
        if (nr + h <= rows && grid.free(...mark)) options.push({ t, id, r: nr, c: nc, w, h, mark })
      }
      add(c > 0 ? grid.owner(r, c - 1) : undefined, 'left')
      add(r > 0 ? grid.owner(r - 1, c) : undefined, 'up')
      // Preserve the prototype's preference; use these only if left/up cannot grow.
      if (!options.length) {
        add(c + 1 < columns ? grid.owner(r, c + 1) : undefined, 'right')
        add(r + 1 < rows ? grid.owner(r + 1, c) : undefined, 'down')
      }
      options.sort(
        (a, b) => cropOf(a.t.photo.ar, tileAr(a.w, a.h)) - cropOf(b.t.photo.ar, tileAr(b.w, b.h)),
      )
      const o = options[0]
      if (!o) continue
      Object.assign(o.t, { r: o.r, c: o.c, w: o.w, h: o.h })
      grid.mark(...o.mark, o.id)
      changed = true
    }
  }
  const used = cellTiles.reduce((s, t) => s + t.w * t.h, 0)
  const choices = cellTiles.map((t) => t.key)
  cellTiles.sort((a, b) => a.r - b.r || a.c - b.c)
  if (
    used !== rows * columns ||
    cellTiles.some((t, pos) => Math.abs(pos - t.photo.index) > maxShift)
  )
    return undefined
  const crops = cellTiles.map((t) => cropOf(t.photo.ar, tileAr(t.w, t.h)))
  const score = crops.reduce((s, v) => s + v, 0) / crops.length + 0.5 * Math.max(...crops)
  return { cellTiles, rows, score, choices }
}

export function computeBentoLayout<TMeta extends object>(
  options: BentoLayoutOptions<TMeta>,
): BentoLayout {
  const input = validatePhotoDimensions(options.photos)
  if (!input.length) return { tiles: [], rows: 0 }
  const columns = normalizeColumnCount(options.columns)
  const aspectRatio =
    Number.isFinite(options.aspectRatio) && options.aspectRatio! > 0 ? options.aspectRatio! : 4 / 3
  const maxShift = Number.isFinite(options.maxShift)
    ? Math.max(0, Math.floor(options.maxShift!))
    : 4
  const photos = input.map((photo, index) => ({
    index,
    ar: photo.width / photo.height,
    featured: options.featured ? options.featured(photo, index) : index === 0,
  }))
  // Retry only the offending run without big shapes when rectangular growth stalls.
  const run = (avoid?: Avoid) =>
    packBento(photos, columns, aspectRatio, maxShift, avoid) ??
    packBento(photos, columns, aspectRatio, maxShift, avoid, false)
  let best = run()
  if (best) {
    const choices = best.choices
    for (let step = Math.max(0, choices.length - 14); step < choices.length; step++) {
      const variant = run({ step, key: choices[step]! })
      if (variant && variant.score < best.score) best = variant
    }
    return {
      rows: best.rows,
      tiles: best.cellTiles.map((t) => ({
        index: t.photo.index,
        column: t.c,
        row: t.r,
        columnSpan: t.w,
        rowSpan: t.h,
      })),
    }
  }
  // Full-width strips are a deterministic last resort for an unfillable suffix.
  let row = 0
  const tiles = photos.map((photo) => {
    const rowSpan = photo.featured && columns >= 3 ? 2 : 1
    const tile = { index: photo.index, column: 0, row, columnSpan: columns, rowSpan }
    row += rowSpan
    return tile
  })
  return { tiles, rows: row }
}
