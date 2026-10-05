import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { ImageTiming, LabTiming } from './timing'
import type { PhotoItem } from '@lupinum/nuxt-photo/app'

export interface LabSummary {
  waitP50Ms: number
  waitP95Ms: number
  waitMaxMs: number
  blankTotalMs: number
  imageTimings: ImageTiming[]
  cls: number | null
  preloaded: boolean
  images: number
  inRangePercent: number
  floor: number
  median: number
  min: number
  max: number
  transferredKB: number
  formats: string[]
  lcpMs: number
  lcpLoading: string
  provider: string
  ladder: number[]
  dpr: number
  pending: number
}
declare global {
  interface Window {
    __lab?: { summary(): LabSummary }
  }
}
interface Reading {
  url: string
  needed: number
  got: number
  ratio: number
  floor: boolean
  reused: boolean
  inRange: boolean
  srcset: string
  kb: number
  format: string
  loading: string
  high: boolean
  width: number
  left: number
  top: number
}

// Decode currentSrc alone: srcset's density correction must not shrink the file pixel count.
const pixels = new Map<string, Promise<number>>()
const formats = new Map<string, Promise<string>>()
function fileWidth(url: string) {
  if (!pixels.has(url)) {
    const file = new Image()
    file.src = url
    pixels.set(
      url,
      file.decode().then(() => file.naturalWidth),
    )
  }
  return pixels.get(url)!
}
function fileFormat(url: string) {
  if (!formats.has(url))
    formats.set(
      url,
      fetch(url, {
        method: 'HEAD',
        headers: { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
      }).then((response) =>
        (response.headers.get('content-type') ?? '').split(';')[0]!.replace(/^image\//, ''),
      ),
    )
  return formats.get(url)!
}
function bytes(url: string) {
  const entries = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[]
  return Math.max(
    0,
    ...entries
      .filter((entry) => entry.initiatorType === 'img')
      .map((entry) => entry.transferSize || entry.encodedBodySize),
  )
}
function visible(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect()
  let left = Math.max(0, rect.left),
    right = Math.min(innerWidth, rect.right)
  let top = Math.max(0, rect.top),
    bottom = Math.min(innerHeight, rect.bottom)
  if (right <= left || bottom <= top) return false
  for (let node: HTMLElement | null = image; node; node = node.parentElement) {
    const style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)
      return false
    if (node === image) continue
    const bounds = node.getBoundingClientRect()
    if (/(hidden|clip|scroll|auto)/.test(style.overflowX)) {
      left = Math.max(left, bounds.left)
      right = Math.min(right, bounds.right)
    }
    if (/(hidden|clip|scroll|auto)/.test(style.overflowY)) {
      top = Math.max(top, bounds.top)
      bottom = Math.min(bottom, bounds.bottom)
    }
  }
  return right > left && bottom > top
}

export function timingMetrics(timing: LabTiming) {
  const waits = timing.images.map((image) => image.waitMs).sort((a, b) => a - b)
  const percentile = (p: number) => waits[Math.max(0, Math.ceil(waits.length * p) - 1)] ?? 0
  return {
    imageTimings: timing.images.map((image) => ({ ...image })),
    cls: timing.cls,
    waitP50Ms: percentile(0.5),
    waitP95Ms: percentile(0.95),
    waitMaxMs: waits.at(-1) ?? 0,
    blankTotalMs: timing.images.reduce((sum, image) => sum + image.blankMs, 0),
  }
}

export function useLabMeasurement(
  photos: () => readonly PhotoItem[],
  provider: string,
  ladder: number[],
  active: () => string | null | undefined,
  bar: Ref<HTMLElement | null>,
) {
  const readings = ref<Reading[]>([])
  const pending = ref(0)
  const dpr = ref(1)
  const lcpMs = ref(0)
  const lcpLoading = ref('unknown')
  const preloaded = ref(false)
  const timing = ref<LabTiming>({ images: [], cls: null })
  const slideRequests = ref<string[]>([])
  // Keep the original file owner across measurements, including offscreen slides.
  // Diagnostic decode probes must not become owners of the files they inspect.
  const fileOwners = new Map<string, HTMLImageElement>()
  let openedAt = Infinity
  watch(active, (id, previous) => {
    if (id && !previous) openedAt = performance.now()
  })
  const summary = computed<LabSummary>(() => {
    const ratios = readings.value.map((reading) => reading.ratio).sort((a, b) => a - b)
    const middle = Math.floor(ratios.length / 2)
    const unique = new Map(readings.value.map((reading) => [reading.url, reading.kb]))
    return {
      ...timingMetrics(timing.value),
      preloaded: preloaded.value,
      images: ratios.length,
      inRangePercent: ratios.length
        ? (100 * readings.value.filter((reading) => reading.inRange).length) / ratios.length
        : 0,
      floor: readings.value.filter((reading) => reading.floor).length,
      median: ratios.length
        ? (ratios[middle]! + ratios[Math.floor((ratios.length - 1) / 2)]!) / 2
        : 0,
      min: ratios[0] ?? 0,
      max: ratios.at(-1) ?? 0,
      transferredKB: [...unique.values()].reduce((sum, kb) => sum + kb, 0),
      formats: [...new Set(readings.value.map((reading) => reading.format))].sort(),
      lcpMs: lcpMs.value,
      lcpLoading: lcpLoading.value,
      provider,
      ladder,
      dpr: dpr.value,
      pending: pending.value,
    }
  })
  // The visual bar updates during pending loads too; the public API snapshots live clocks.
  let clock: ReturnType<typeof setInterval> | undefined
  let frame = 0
  let revision = 0
  let later: ReturnType<typeof setTimeout> | undefined
  let mutation: MutationObserver | undefined
  let paint: PerformanceObserver | undefined
  const schedule = () => {
    if (!frame)
      frame = requestAnimationFrame(() => {
        frame = 0
        void measure()
      })
  }
  async function measure() {
    const version = ++revision
    timing.value = window.__labTiming?.snapshot() ?? timing.value
    const dialog = document.querySelector('[role="dialog"]')
    for (const image of document.querySelectorAll<HTMLImageElement>(
      '.lab-content img, [role="dialog"] img',
    )) {
      if (image.complete && image.naturalWidth && !fileOwners.has(image.currentSrc))
        fileOwners.set(image.currentSrc, image)
    }
    const candidates = [
      ...document.querySelectorAll<HTMLImageElement>(
        dialog ? '[role="dialog"] [data-np-active] img[data-np-slide-img]' : '.lab-content img',
      ),
    ].filter(visible)
    const byAlt = new Map(photos().map((photo) => [photo.alt, photo]))
    const waiting = candidates.filter((image) => !image.complete || !image.naturalWidth).length
    pending.value = candidates.length
    dpr.value = devicePixelRatio
    const rows = await Promise.all(
      candidates
        .filter((image) => image.complete && image.naturalWidth)
        .map(async (image) => {
          const photo = byAlt.get(image.alt)
          if (!photo?.width) throw new Error(`Lab image has no source width: ${image.alt}`)
          const rect = image.getBoundingClientRect()
          const url = image.currentSrc
          const reused = fileOwners.get(url) !== image
          const [got, format] = await Promise.all([fileWidth(url), fileFormat(url)])
          const needed = Math.min(rect.width * devicePixelRatio, photo.width)
          // Source capping can put this image's floor below the global provider ladder.
          const srcset = image.srcset
          const widths = srcset
            .split(',')
            .map((candidate) => Number(candidate.trim().match(/\s(\d+)w$/)?.[1]))
            .filter((width) => width > 0)
          const smallest = Math.min(...widths)
          const floor = got === smallest && got >= needed * 0.9
          const ratio = got / needed
          return {
            url,
            needed,
            got,
            ratio,
            floor,
            reused,
            inRange: (ratio >= 0.9 && ratio <= 2) || floor || reused,
            srcset,
            kb: bytes(url) / 1024,
            format,
            loading: image.getAttribute('loading') ?? 'eager',
            high: image.getAttribute('fetchpriority') === 'high',
            width: rect.width,
            left: rect.left,
            top: Math.max(rect.top, bar.value?.getBoundingClientRect().bottom ?? 0),
          }
        }),
    )
    if (version !== revision) return
    readings.value = rows
    pending.value = waiting
    if (dialog) {
      const urls = new Set(
        [...dialog.querySelectorAll<HTMLImageElement>('img[data-np-slide-img]')].flatMap(
          (image) => [
            image.src,
            image.currentSrc,
            ...(image.srcset
              ?.split(',')
              .map((candidate) => new URL(candidate.trim().split(' ')[0]!, location.href).href) ??
              []),
          ],
        ),
      )
      slideRequests.value = [
        ...new Set(
          (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
            .filter(
              (entry) =>
                entry.initiatorType === 'img' &&
                entry.startTime >= openedAt &&
                urls.has(entry.name),
            )
            .map((entry) => entry.name),
        ),
      ]
    }
  }
  function interaction() {
    schedule()
    clearTimeout(later)
    later = setTimeout(schedule, 600)
  }
  let api: Window['__lab']
  onMounted(() => {
    api = {
      summary: () =>
        structuredClone({
          ...summary.value,
          ...timingMetrics(window.__labTiming?.snapshot() ?? timing.value),
        }),
    }
    window.__lab = api
    clock = setInterval(() => {
      timing.value = window.__labTiming?.snapshot() ?? timing.value
    }, 100)
    document.addEventListener('load', schedule, true)
    document.addEventListener('transitionend', schedule, true)
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    document.addEventListener('click', interaction)
    document.addEventListener('keydown', interaction)
    mutation = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            (record.type === 'attributes' &&
              (!['style', 'class'].includes(record.attributeName ?? '') ||
                (record.target instanceof Element &&
                  record.target.closest('.lab-content, [role="dialog"]') &&
                  (record.target.matches('img') || record.target.querySelector('img'))))) ||
            [...record.addedNodes, ...record.removedNodes].some(
              (node) =>
                node instanceof Element && (node.matches('img') || node.querySelector('img')),
            ),
        )
      )
        schedule()
    })
    mutation.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      // A late flight reveal changes opacity without changing the source or active id.
      // Scope style/class observations to galleries so our own badges cannot cause a loop.
      attributeFilter: ['src', 'srcset', 'sizes', 'data-np-active', 'style', 'class'],
    })
    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      paint = new PerformanceObserver((list) => {
        const entry = list.getEntries().at(-1) as PerformanceEntry & { element?: Element }
        if (entry) {
          lcpMs.value = entry.startTime
          lcpLoading.value = entry.element?.getAttribute('loading') ?? 'unknown'
          const url = entry.element instanceof HTMLImageElement ? entry.element.currentSrc : ''
          preloaded.value =
            !!url &&
            [...document.querySelectorAll<HTMLLinkElement>('link[rel=preload][as=image]')].some(
              (link) =>
                link.href === url ||
                link.imageSrcset
                  .split(',')
                  .some(
                    (candidate) =>
                      new URL(candidate.trim().split(' ')[0]!, location.href).href === url,
                  ),
            )
        }
      })
      paint.observe({ type: 'largest-contentful-paint', buffered: true })
    }
    schedule()
  })
  onBeforeUnmount(() => {
    revision++
    cancelAnimationFrame(frame)
    clearTimeout(later)
    clearInterval(clock)
    mutation?.disconnect()
    paint?.disconnect()
    document.removeEventListener('load', schedule, true)
    document.removeEventListener('transitionend', schedule, true)
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)
    document.removeEventListener('click', interaction)
    document.removeEventListener('keydown', interaction)
    if (window.__lab === api) delete window.__lab
  })
  return { readings, summary, slideRequests }
}
