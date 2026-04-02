import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { computed, provide, inject, ref, watch, onUnmounted } from 'vue'

// ── Photo type (simplified for explorer) ──

export interface ExplorerPhoto {
  id: number
  label: string
  width: number
  height: number
}

// ── Algorithm helpers (duplicated from core to keep docs self-contained) ──

function ratio(p: ExplorerPhoto) {
  return p.width / p.height
}

function getCommonHeight(
  row: ExplorerPhoto[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAR = row.reduce((a, p) => a + ratio(p), 0)
  return rowWidth / totalAR
}

function rowCost(
  photos: ExplorerPhoto[],
  start: number,
  end: number,
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const row = photos.slice(start, end)
  const h = getCommonHeight(row, containerWidth, spacing, padding)
  if (h <= 0) return undefined
  return (h - targetRowHeight) ** 2 * row.length
}

function findIdealNodeSearch(
  photos: ExplorerPhoto[],
  targetRowHeight: number,
  containerWidth: number,
) {
  const minRatio = photos.reduce((a, p) => Math.min(a, ratio(p)), Number.MAX_VALUE)
  return Math.round(containerWidth / targetRowHeight / minRatio) + 2
}

// ── Step types ──

export type AlgorithmId = 'knuth-plass' | 'greedy' | 'dijkstra'

export interface StepInit {
  type: 'init'
  algo: AlgorithmId
  pseudoLine: number
}

export interface StepScanStart {
  type: 'scan-start'
  algo: AlgorithmId
  i: number
  searchRange: [number, number]
  minCost: number[]
  pointers: number[]
  pseudoLine: number
}

export interface StepEvaluateRow {
  type: 'evaluate-row'
  algo: AlgorithmId
  i: number
  j: number
  start: number
  end: number
  cost: number | undefined
  commonHeight: number
  totalCost: number
  improved: boolean
  minCost: number[]
  pointers: number[]
  rowPhotos: ExplorerPhoto[]
  pseudoLine: number
}

export interface StepBestFound {
  type: 'best-found'
  algo: AlgorithmId
  i: number
  bestJ: number
  bestCost: number
  minCost: number[]
  pointers: number[]
  pseudoLine: number
}

// Greedy-specific steps
export interface StepGreedyEval {
  type: 'greedy-eval'
  algo: 'greedy'
  start: number
  end: number
  commonHeight: number
  diff: number
  isNewBest: boolean
  bestEnd: number
  bestDiff: number
  rowPhotos: ExplorerPhoto[]
  rows: Array<{ start: number; end: number }>
  pseudoLine: number
}

export interface StepGreedyCut {
  type: 'greedy-cut'
  algo: 'greedy'
  start: number
  end: number
  commonHeight: number
  rows: Array<{ start: number; end: number }>
  rowPhotos: ExplorerPhoto[]
  pseudoLine: number
}

// Dijkstra-specific steps
export interface StepDijkstraVisit {
  type: 'dijkstra-visit'
  algo: 'dijkstra'
  node: number
  cost: number
  dist: number[]
  prev: number[]
  heapSize: number
  pseudoLine: number
}

export interface StepDijkstraRelax {
  type: 'dijkstra-relax'
  algo: 'dijkstra'
  from: number
  to: number
  edgeCost: number
  newDist: number
  updated: boolean
  commonHeight: number
  rowPhotos: ExplorerPhoto[]
  dist: number[]
  prev: number[]
  heapSize: number
  pseudoLine: number
}

export interface StepDone {
  type: 'done'
  algo: AlgorithmId
  path: number[]
  totalCost: number
  rows: Array<{ start: number; end: number; height: number; cost: number }>
}

export type AlgoStep =
  | StepInit
  | StepScanStart
  | StepEvaluateRow
  | StepBestFound
  | StepGreedyEval
  | StepGreedyCut
  | StepDijkstraVisit
  | StepDijkstraRelax
  | StepDone

// ── Generator functions ──

function* knuthPlassGenerator(
  photos: ExplorerPhoto[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): Generator<AlgoStep> {
  const N = photos.length
  const limitNodeSearch = findIdealNodeSearch(photos, targetRowHeight, containerWidth)
  const minCost = new Array(N + 1).fill(Infinity) as number[]
  const pointers = new Array(N + 1).fill(0) as number[]
  minCost[0] = 0

  yield { type: 'init', algo: 'knuth-plass', pseudoLine: 0 }

  for (let i = 1; i <= N; i++) {
    const start = Math.max(0, i - limitNodeSearch)

    yield {
      type: 'scan-start', algo: 'knuth-plass', i,
      searchRange: [start, i - 1],
      minCost: [...minCost], pointers: [...pointers],
      pseudoLine: 1,
    }

    for (let j = i - 1; j >= start; j--) {
      const c = rowCost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
      const row = photos.slice(j, i)
      const h = getCommonHeight(row, containerWidth, spacing, padding)
      const total = c !== undefined ? minCost[j]! + c : Infinity
      const improved = c !== undefined && total < minCost[i]!

      if (improved) {
        minCost[i] = total
        pointers[i] = j
      }

      yield {
        type: 'evaluate-row', algo: 'knuth-plass',
        i, j, start: j, end: i,
        cost: c, commonHeight: h, totalCost: total, improved,
        minCost: [...minCost], pointers: [...pointers],
        rowPhotos: row,
        pseudoLine: improved ? 4 : 3,
      }
    }

    yield {
      type: 'best-found', algo: 'knuth-plass', i,
      bestJ: pointers[i]!, bestCost: minCost[i]!,
      minCost: [...minCost], pointers: [...pointers],
      pseudoLine: 5,
    }
  }

  // Reconstruct path
  const path: number[] = []
  let curr = N
  while (curr > 0) { path.push(curr); curr = pointers[curr]! }
  path.push(0)
  path.reverse()

  const rows = []
  for (let k = 1; k < path.length; k++) {
    const s = path[k - 1]!
    const e = path[k]!
    const row = photos.slice(s, e)
    const h = getCommonHeight(row, containerWidth, spacing, padding)
    const c = rowCost(photos, s, e, containerWidth, targetRowHeight, spacing, padding) ?? 0
    rows.push({ start: s, end: e, height: h, cost: c })
  }

  yield { type: 'done', algo: 'knuth-plass', path, totalCost: minCost[N]!, rows }
}

function* greedyGenerator(
  photos: ExplorerPhoto[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): Generator<AlgoStep> {
  const N = photos.length
  const rows: Array<{ start: number; end: number }> = []
  let start = 0

  yield { type: 'init', algo: 'greedy', pseudoLine: 0 }

  while (start < N) {
    let bestEnd = start + 1
    let bestDiff = Infinity

    for (let end = start + 1; end <= N; end++) {
      const row = photos.slice(start, end)
      const h = getCommonHeight(row, containerWidth, spacing, padding)
      if (h <= 0) continue

      const diff = Math.abs(h - targetRowHeight)
      const isNewBest = diff < bestDiff

      if (isNewBest) {
        bestDiff = diff
        bestEnd = end
      }

      yield {
        type: 'greedy-eval', algo: 'greedy',
        start, end, commonHeight: h, diff, isNewBest,
        bestEnd, bestDiff,
        rowPhotos: row, rows: [...rows],
        pseudoLine: isNewBest ? 3 : 2,
      }

      if (h < targetRowHeight * 0.65) break
    }

    rows.push({ start, end: bestEnd })
    const cutRow = photos.slice(start, bestEnd)
    const cutH = getCommonHeight(cutRow, containerWidth, spacing, padding)

    yield {
      type: 'greedy-cut', algo: 'greedy',
      start, end: bestEnd, commonHeight: cutH,
      rows: [...rows], rowPhotos: cutRow,
      pseudoLine: 5,
    }

    start = bestEnd
  }

  const path = [0, ...rows.map(r => r.end)]
  let totalCost = 0
  const finalRows = rows.map(r => {
    const row = photos.slice(r.start, r.end)
    const h = getCommonHeight(row, containerWidth, spacing, padding)
    const c = rowCost(photos, r.start, r.end, containerWidth, targetRowHeight, spacing, padding) ?? 0
    totalCost += c
    return { start: r.start, end: r.end, height: h, cost: c }
  })

  yield { type: 'done', algo: 'greedy', path, totalCost, rows: finalRows }
}

function* dijkstraGenerator(
  photos: ExplorerPhoto[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): Generator<AlgoStep> {
  const N = photos.length

  // Simple min-heap
  const heap: Array<{ node: number; cost: number }> = []
  function heapPush(item: { node: number; cost: number }) {
    heap.push(item)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p]!.cost <= heap[i]!.cost) break
      ;[heap[p], heap[i]] = [heap[i]!, heap[p]!]
      i = p
    }
  }
  function heapPop() {
    const top = heap[0]!
    const last = heap.pop()!
    if (heap.length > 0) {
      heap[0] = last
      let i = 0
      while (true) {
        let s = i
        const l = 2 * i + 1
        const r = 2 * i + 2
        if (l < heap.length && heap[l]!.cost < heap[s]!.cost) s = l
        if (r < heap.length && heap[r]!.cost < heap[s]!.cost) s = r
        if (s === i) break
        ;[heap[s], heap[i]] = [heap[i]!, heap[s]!]
        i = s
      }
    }
    return top
  }

  const dist = new Array(N + 1).fill(Infinity) as number[]
  const prev = new Array(N + 1).fill(-1) as number[]
  const visited = new Array(N + 1).fill(false) as boolean[]
  dist[0] = 0
  heapPush({ node: 0, cost: 0 })

  yield { type: 'init', algo: 'dijkstra', pseudoLine: 0 }

  while (heap.length > 0) {
    const { node: u, cost: uCost } = heapPop()

    if (visited[u]) continue
    visited[u] = true

    yield {
      type: 'dijkstra-visit', algo: 'dijkstra',
      node: u, cost: uCost,
      dist: [...dist], prev: [...prev], heapSize: heap.length,
      pseudoLine: 2,
    }

    if (u === N) break

    for (let v = u + 1; v <= N; v++) {
      if (visited[v]) continue
      const c = rowCost(photos, u, v, containerWidth, targetRowHeight, spacing, padding)
      if (c === undefined) continue

      const row = photos.slice(u, v)
      const h = getCommonHeight(row, containerWidth, spacing, padding)
      const newDist = dist[u]! + c
      const updated = newDist < dist[v]!

      if (updated) {
        dist[v] = newDist
        prev[v] = u
        heapPush({ node: v, cost: newDist })
      }

      yield {
        type: 'dijkstra-relax', algo: 'dijkstra',
        from: u, to: v, edgeCost: c, newDist, updated,
        commonHeight: h, rowPhotos: row,
        dist: [...dist], prev: [...prev], heapSize: heap.length,
        pseudoLine: updated ? 4 : 3,
      }

      if (h < targetRowHeight * 0.35) break
    }
  }

  // Reconstruct
  const path: number[] = []
  let c = N
  while (c >= 0) { path.push(c); c = prev[c]! }
  path.reverse()

  const rows = []
  for (let k = 1; k < path.length; k++) {
    const s = path[k - 1]!
    const e = path[k]!
    const row = photos.slice(s, e)
    const h = getCommonHeight(row, containerWidth, spacing, padding)
    const rc = rowCost(photos, s, e, containerWidth, targetRowHeight, spacing, padding) ?? 0
    rows.push({ start: s, end: e, height: h, cost: rc })
  }

  yield { type: 'done', algo: 'dijkstra', path, totalCost: dist[N]!, rows }
}

// ── Demo photos ──

export const DEMO_PHOTOS: ExplorerPhoto[] = [
  { id: 0, label: 'A', width: 1600, height: 900 },
  { id: 1, label: 'B', width: 900, height: 1200 },
  { id: 2, label: 'C', width: 1400, height: 900 },
  { id: 3, label: 'D', width: 1000, height: 1000 },
  { id: 4, label: 'E', width: 800, height: 1100 },
  { id: 5, label: 'F', width: 1600, height: 1000 },
  { id: 6, label: 'G', width: 900, height: 900 },
  { id: 7, label: 'H', width: 1800, height: 1000 },
]

export const CONTAINER_WIDTH = 800
export const TARGET_ROW_HEIGHT = 220
export const SPACING = 6
export const PADDING = 0

// ── Algorithm metadata ──

export interface AlgoMeta {
  name: string
  description: string
  time: string
  space: string
  optimality: string
  approach: string
  pseudocode: string[]
}

export const ALGO_META: Record<AlgorithmId, AlgoMeta> = {
  'knuth-plass': {
    name: 'Knuth-Plass DP',
    description: 'Classic dynamic programming. For each position i, try every possible row start j and keep the cheapest. Guarantees global optimum in O(N\u00B7K) where K is max items per row.',
    time: 'O(N\u00B7K)',
    space: 'O(N)',
    optimality: 'Globally optimal',
    approach: 'Bottom-up DP',
    pseudocode: [
      'let minCost[0..N] = \u221E, minCost[0] = 0',
      'for i = 1 to N:',
      '  for j = i-1 down to max(0, i-K):',
      '    total = minCost[j] + rowCost(j, i)',
      '    if total < minCost[i]:',
      '      minCost[i] = total; ptr[i] = j',
      'reconstruct path from ptrs',
    ],
  },
  greedy: {
    name: 'Greedy',
    description: 'Scan left-to-right, picking the row endpoint closest to target height. No backtracking. Fast at O(N) but can produce suboptimal layouts.',
    time: 'O(N)',
    space: 'O(1)',
    optimality: 'Approximate',
    approach: 'Left-to-right scan',
    pseudocode: [
      'let start = 0',
      'while start < N:',
      '  for end = start+1 to N:',
      '    if |height - target| < bestDiff:',
      '      bestEnd = end',
      '  cutRow(start, bestEnd)',
      '  start = bestEnd',
    ],
  },
  dijkstra: {
    name: 'Dijkstra + Min-Heap',
    description: 'Model as a shortest-path graph. Nodes are cut-points, edges are rows. Min-heap processes cheapest node first. Same optimal result as DP but with O(N\u00B7K\u00B7log N) due to heap ops.',
    time: 'O(N\u00B7K\u00B7log N)',
    space: 'O(N + heap)',
    optimality: 'Globally optimal',
    approach: 'Shortest path',
    pseudocode: [
      'let dist[0..N] = \u221E, dist[0] = 0, heap = {(0,0)}',
      'while heap not empty:',
      '  u = heap.pop()  // cheapest node',
      '  for each edge u\u2192v (row u..v-1):',
      '    if dist[u]+cost < dist[v]:  // relax',
      '      dist[v] = dist[u]+cost; heap.push(v)',
      'reconstruct path from prev[]',
    ],
  },
}

// ── Context type + injection key ──

export interface AlgoExplorerContext {
  photos: ExplorerPhoto[]
  containerWidth: number
  targetRowHeight: number
  spacing: number
  padding: number

  currentAlgorithm: Ref<AlgorithmId>
  steps: Ref<AlgoStep[]>
  currentStepIndex: Ref<number>
  currentStep: ComputedRef<AlgoStep | null>
  totalSteps: ComputedRef<number>
  isPlaying: Ref<boolean>
  playbackSpeed: Ref<number>
  isComplete: ComputedRef<boolean>
  results: Ref<Partial<Record<AlgorithmId, { path: number[]; totalCost: number }>>>

  play: () => void
  pause: () => void
  stepForward: () => void
  reset: () => void
  setAlgorithm: (id: AlgorithmId) => void
}

export const ALGO_EXPLORER_KEY: InjectionKey<AlgoExplorerContext> = Symbol('algo-explorer')

// ── Provider composable (called in AlgoExplorer.vue) ──

export function provideAlgoExplorer() {
  const photos = DEMO_PHOTOS
  const containerWidth = CONTAINER_WIDTH
  const targetRowHeight = TARGET_ROW_HEIGHT
  const spacing = SPACING
  const padding = PADDING

  const currentAlgorithm = ref<AlgorithmId>('knuth-plass')
  const steps = ref<AlgoStep[]>([])
  const currentStepIndex = ref(-1)
  const isPlaying = ref(false)
  const playbackSpeed = ref(800) // ms per step
  const results = ref<Partial<Record<AlgorithmId, { path: number[]; totalCost: number }>>>({})

  let generator: Generator<AlgoStep> | null = null
  let generatorExhausted = false
  let playInterval: ReturnType<typeof setInterval> | null = null

  function createGenerator(algo: AlgorithmId) {
    switch (algo) {
      case 'knuth-plass':
        return knuthPlassGenerator(photos, containerWidth, targetRowHeight, spacing, padding)
      case 'greedy':
        return greedyGenerator(photos, containerWidth, targetRowHeight, spacing, padding)
      case 'dijkstra':
        return dijkstraGenerator(photos, containerWidth, targetRowHeight, spacing, padding)
    }
  }

  const currentStep = computed(() => {
    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.value.length) return null
    return steps.value[currentStepIndex.value]!
  })

  const totalSteps = computed(() => steps.value.length)

  const isComplete = computed(() => {
    const last = steps.value[steps.value.length - 1]
    return last?.type === 'done'
  })

  function stepForward() {
    // If we have future steps already generated (backward scrub case), just advance index
    if (currentStepIndex.value < steps.value.length - 1) {
      currentStepIndex.value++
      return
    }

    if (!generator || generatorExhausted) return

    const next = generator.next()
    if (next.done) {
      generatorExhausted = true
      stopPlay()
      return
    }

    const step = next.value
    steps.value.push(step)
    currentStepIndex.value = steps.value.length - 1

    if (step.type === 'done') {
      results.value = {
        ...results.value,
        [step.algo]: { path: step.path, totalCost: step.totalCost },
      }
      stopPlay()
    }
  }

  function stopPlay() {
    isPlaying.value = false
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
  }

  function play() {
    if (generatorExhausted && currentStepIndex.value >= steps.value.length - 1) return
    isPlaying.value = true
    playInterval = setInterval(() => {
      stepForward()
      if (generatorExhausted || isComplete.value) stopPlay()
    }, playbackSpeed.value)
  }

  function pause() {
    stopPlay()
  }

  function reset() {
    stopPlay()
    generator = createGenerator(currentAlgorithm.value)
    generatorExhausted = false
    steps.value = []
    currentStepIndex.value = -1
  }

  function setAlgorithm(id: AlgorithmId) {
    if (id === currentAlgorithm.value) return
    currentAlgorithm.value = id
    reset()
  }

  // Restart play interval when speed changes
  watch(playbackSpeed, () => {
    if (isPlaying.value) {
      if (playInterval) clearInterval(playInterval)
      playInterval = setInterval(() => {
        stepForward()
        if (generatorExhausted || isComplete.value) stopPlay()
      }, playbackSpeed.value)
    }
  })

  // Initialize generator
  generator = createGenerator(currentAlgorithm.value)

  onUnmounted(() => {
    stopPlay()
  })

  const context: AlgoExplorerContext = {
    photos,
    containerWidth,
    targetRowHeight,
    spacing,
    padding,
    currentAlgorithm,
    steps,
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    playbackSpeed,
    isComplete,
    results,
    play,
    pause,
    stepForward,
    reset,
    setAlgorithm,
  }

  provide(ALGO_EXPLORER_KEY, context)

  return context
}

// ── Inject composable (called in child components) ──

export function useAlgoExplorer() {
  const context = inject(ALGO_EXPLORER_KEY)
  if (!context) throw new Error('useAlgoExplorer() must be used inside AlgoExplorer')
  return context
}

// ── Utility exports ──

export { ratio, getCommonHeight }
