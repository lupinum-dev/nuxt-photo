import type { ResolvedPhotoItem as PhotoItem } from '../types'
import { validatePhotoDimensions } from './types'

export type MosaicTile = { index: number; x: number; y: number; width: number; height: number }
export type MosaicLayout = { tiles: MosaicTile[]; hidden: number }
export type MosaicLayoutOptions<TMeta extends object = Readonly<Record<string, unknown>>> = {
  photos: readonly PhotoItem<TMeta>[]
  aspectRatio?: number
  max?: number
}

type Item = { index: number; ar: number }
type Node = { photo: Item; a: number } | { side: boolean; first: Node; second: Node; a: number }

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function computeMosaicLayout<TMeta extends object>(
  options: MosaicLayoutOptions<TMeta>,
): MosaicLayout {
  const photos = validatePhotoDimensions(options.photos)
  if (!photos.length) return { tiles: [], hidden: 0 }
  const aspectRatio =
    Number.isFinite(options.aspectRatio) && options.aspectRatio! > 0 ? options.aspectRatio! : 4 / 3
  const max = Number.isFinite(options.max) ? Math.max(1, Math.floor(options.max!)) : 5
  const shown = photos.slice(0, max)
  const hidden = photos.length - shown.length
  if (shown.length === 1) return { tiles: [{ index: 0, x: 0, y: 0, width: 1, height: 1 }], hidden }
  const set = shown.map((photo, index) => ({ index, ar: photo.width / photo.height }))
  let seed = 0x811c9dc5
  const ids = shown.map((photo) => photo.id).join('\u0000')
  for (let i = 0; i < ids.length; i++) seed = Math.imul(seed ^ ids.charCodeAt(i), 0x01000193) >>> 0
  const rnd = mulberry32(seed)
  const build = (items: Item[]): Node => {
    if (items.length === 1) return { photo: items[0]!, a: items[0]!.ar }
    const k = 1 + Math.floor(rnd() * (items.length - 1))
    const first = build(items.slice(0, k))
    const second = build(items.slice(k))
    const side = rnd() < 0.5
    const a = side ? first.a + second.a : 1 / (1 / first.a + 1 / second.a)
    return { side, first, second, a }
  }
  const place = (node: Node, x: number, y: number, w: number, h: number, out: MosaicTile[]) => {
    if ('photo' in node) {
      out.push({
        index: node.photo.index,
        x: x / aspectRatio,
        y,
        width: w / aspectRatio,
        height: h,
      })
    } else if (node.side) {
      const w1 = (w * node.first.a) / node.a
      place(node.first, x, y, w1, h, out)
      place(node.second, x + w1, y, w - w1, h, out)
    } else {
      const h1 = (h * node.a) / node.first.a
      place(node.first, x, y, w, h1, out)
      place(node.second, x, y + h1, w, h - h1, out)
    }
  }
  let best: { score: number; tiles: MosaicTile[] } | undefined
  for (let t = 0; t < 600; t++) {
    const items = set.slice()
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[items[i], items[j]] = [items[j]!, items[i]!]
    }
    const tiles: MosaicTile[] = []
    place(build(items), 0, 0, aspectRatio, 1, tiles)
    if (tiles.some((tile) => tile.width < 0.12 || tile.height < 0.12)) continue
    const crops = tiles.map((tile) => {
      const photoAr = set[tile.index]!.ar
      const tileAr = (tile.width * aspectRatio) / tile.height
      return 1 - Math.min(photoAr / tileAr, tileAr / photoAr)
    })
    const areas = tiles.map((tile) => tile.width * tile.height)
    const lead = tiles.find((tile) => tile.index === 0)!
    let score = crops.reduce((sum, crop) => sum + crop, 0) / crops.length + 0.5 * Math.max(...crops)
    // The prototype's one-pixel area tolerance becomes rounding tolerance in fractions.
    if (lead.width * lead.height < Math.max(...areas) - 1e-9) score += 0.3
    if (tiles[0]!.index !== 0) score += 0.1
    if (!best || score < best.score) best = { score, tiles }
  }
  const tiles = best?.tiles ?? []
  if (!best) place(build(set.slice()), 0, 0, aspectRatio, 1, tiles)
  tiles.sort((a, b) => a.y - b.y || a.x - b.x)
  return { tiles, hidden }
}
