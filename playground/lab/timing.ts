export interface ImageTiming {
  url: string
  firstVisibleMs: number
  loadedMs: number | null
  waitMs: number
  blankMs: number
  pending: boolean
}
export interface LabTiming {
  images: ImageTiming[]
  cls: number | null
}
declare global {
  interface Window {
    __labTiming?: { snapshot(): LabTiming }
  }
}

/** Serialized into the document head: initial SSR loads must not wait for hydration.
 * Paint is approximated by successful decode followed by an animation frame.
 * A CSS background counts only after its image decoded, never just because a URL exists.
 */
export function startLabTiming() {
  const browser = globalThis as Window & typeof globalThis
  const {
    document,
    performance,
    PerformanceObserver,
    Image,
    IntersectionObserver,
    MutationObserver,
    Element,
    HTMLImageElement,
  } = browser
  const getComputedStyle = (element: Element) => browser.getComputedStyle(element)
  const requestAnimationFrame = (callback: FrameRequestCallback) =>
    browser.requestAnimationFrame(callback)
  if (browser.__labTiming) return
  performance.setResourceTimingBufferSize(10000)
  type State = {
    image: HTMLImageElement
    first: number | null
    loaded: number | null
    painted: boolean
    placeholder: boolean
    colour: boolean
    background: string
    intersecting: boolean
    blankStart: number | null
    blank: number
  }
  const states = new Map<HTMLImageElement, State>()
  let cls: number | null = null
  let session = 0,
    sessionStart = 0,
    lastShift = 0
  if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
    cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number
        hadRecentInput: boolean
      })[]) {
        if (entry.hadRecentInput) continue
        if (
          session === 0 ||
          entry.startTime - lastShift > 1000 ||
          entry.startTime - sessionStart > 5000
        ) {
          session = 0
          sessionStart = entry.startTime
        }
        lastShift = entry.startTime
        session += entry.value
        cls = Math.max(cls ?? 0, session)
      }
    }).observe({ type: 'layout-shift', buffered: true })
  }
  function update(state: State, time = performance.now()) {
    let shown = state.intersecting && state.image.isConnected
    for (let node: HTMLElement | null = state.image; shown && node; node = node.parentElement) {
      const style = getComputedStyle(node)
      shown =
        style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
    }
    if (shown && state.first === null) state.first = time
    const blank = shown && !state.painted && !state.placeholder && !state.colour
    if (blank && state.blankStart === null) state.blankStart = time
    if (!blank && state.blankStart !== null) {
      state.blank += Math.max(0, time - state.blankStart)
      state.blankStart = null
    }
  }
  function loaded(state: State) {
    if (!state.image.naturalWidth) return
    state.loaded ??= performance.now()
    void state.image
      .decode()
      .then(() =>
        requestAnimationFrame(() => {
          state.painted = true
          update(state)
        }),
      )
      .catch(() => {
        /* Failed decoding remains blank; do not hide it. */
      })
  }
  function placeholder(state: State) {
    const style = getComputedStyle(state.image)
    state.colour =
      style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
    const background = style.backgroundImage
    if (background === state.background) return
    state.background = background
    state.placeholder = false
    const url = background.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
    if (!url) return
    const preview = new Image()
    preview.src = url
    void preview
      .decode()
      .then(() =>
        requestAnimationFrame(() => {
          if (state.background !== background) return
          state.placeholder = true
          update(state)
        }),
      )
      .catch(() => {
        /* A failed placeholder is not painted. */
      })
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const state = states.get(entry.target as HTMLImageElement)!
      state.intersecting =
        entry.isIntersecting &&
        entry.intersectionRect.width > 0 &&
        entry.intersectionRect.height > 0
      update(state, entry.time)
    }
  })
  function scan(root: ParentNode) {
    const images =
      root instanceof HTMLImageElement
        ? [root]
        : [...root.querySelectorAll<HTMLImageElement>('img')]
    for (const image of images) {
      if (!image.closest('.lab-content, [role="dialog"]')) continue
      let state = states.get(image)
      if (!state) {
        state = {
          image,
          first: null,
          loaded: null,
          painted: false,
          placeholder: false,
          colour: false,
          background: '',
          intersecting: false,
          blankStart: null,
          blank: 0,
        }
        states.set(image, state)
        observer.observe(image)
        if (image.complete && image.naturalWidth) loaded(state)
      }
      placeholder(state)
      update(state)
    }
  }
  document.addEventListener(
    'load',
    (event) => {
      if (!(event.target instanceof HTMLImageElement)) return
      scan(event.target)
      const state = states.get(event.target)
      if (state) loaded(state)
    },
    true,
  )
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        if (
          record.target instanceof Element &&
          record.target.closest('.lab-content, [role="dialog"]')
        )
          scan(record.target)
      } else for (const node of record.addedNodes) if (node instanceof Element) scan(node)
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'src', 'srcset'],
  })
  browser.__labTiming = {
    snapshot() {
      const now = performance.now()
      const images: ImageTiming[] = []
      for (const state of states.values()) {
        update(state, now)
        if (state.first === null) continue
        images.push({
          url: state.image.currentSrc || state.image.src,
          firstVisibleMs: state.first,
          loadedMs: state.loaded,
          waitMs: Math.max(0, (state.loaded ?? now) - state.first),
          blankMs:
            state.blank + (state.blankStart === null ? 0 : Math.max(0, now - state.blankStart)),
          pending: state.loaded === null,
        })
      }
      return { images, cls }
    },
  }
  scan(document)
}
