import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Gesture lab, first version. Each scenario is one finger path, sent as real touch events.
// A recorder inside the page samples where the photo is drawn on every frame. From that trace
// the script computes how well the photo follows the finger and how the release continues.

/** `lift`: the finger leaves after the previous point, and this point is a new touch `dt` later. */
type Point = { x: number; y: number; dt: number; lift?: boolean }
/** `t` is the time stamp the browser gives; `at` is when page code ran for it. */
type Frame = {
  t: number
  at: number
  x: number | null
  y: number
  /** Every caption: the photo it belongs to, its box and the opacity it is drawn with. */
  captions?: CaptionBox[]
  /** Every mounted slide's photo frame. */
  slides?: (Box & { index: number })[]
  /** The media area, the part of the screen photos are drawn in. */
  media?: Box
  /** The backdrop's drawn opacity; null once the lightbox is gone. */
  backdrop?: number | null
}
type Box = { left: number; top: number; right: number; bottom: number }
/** `own` is the owner's photo frame, read just before and after the caption, and null when
 * the two reads differ: WebKit samples a running animation when it is read, so boxes read
 * apart can show two moments of one motion. */
type CaptionBox = Box & { owner: number; opacity: number; own: Box | null }
type Event = { type: string; t: number; at: number; x: number; y: number }
/**
 * Page marks: `animate` when the track or the stage gets a Web Animation, `first-frame` at the
 * first frame after it, `change` when the counter changes (the photo change), `block-end` when
 * the lab's main-thread block ends.
 */
type Mark = {
  type: string
  at: number
  frame: number
  framesSinceAnimate?: number | null
  /** `release-held`: the last frame time stamp; `release-sent`: the time aimed for. */
  target?: number
  /** `first-frame`: how much of its motion, in ms, the first frame that draws the settle shows. */
  shownMs?: number
  /** `animate`: the speed in px/ms the settle's keyframes start with. */
  startVx?: number
  startVy?: number
}
type Trace = {
  frames: Frame[]
  events: Event[]
  marks: Mark[]
}

/** Moves a pointer: real touches through CDP in Chromium, a mouse in WebKit. */
type Driver = {
  down: (point: Point) => Promise<void>
  move: (point: Point) => Promise<void>
  up: () => Promise<void>
}

const START_INDEX = 1
/** `GESTURE_ONLY=<regex>` runs only the scenarios whose name matches, for a quick look. */
const only = process.env.GESTURE_ONLY ? new RegExp(process.env.GESTURE_ONLY) : null
const out = resolve(process.env.GESTURE_OUT ?? 'test-results/gesture-trace')
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

function line(from: [number, number], to: [number, number], ms: number, stepMs = 8): Point[] {
  const steps = Math.max(1, Math.round(ms / stepMs))
  return Array.from({ length: steps }, (_, index) => ({
    x: from[0] + ((to[0] - from[0]) * (index + 1)) / steps,
    y: from[1] + ((to[1] - from[1]) * (index + 1)) / steps,
    dt: ms / steps,
  }))
}

type Scenario = {
  name: string
  axis: 'x' | 'y'
  path: (c: { x: number; y: number; w: number; h: number }) => Point[]
  /** The claims this scenario judges; all motion claims when absent. */
  judge?: readonly (keyof typeof limits | 'speedKept')[]
  /** Block the main thread this many ms when the counter changes: a slow photo change. */
  blockMs?: number
  /**
   * Hand the page the release this many ms after a frame callback's time stamp: the page holds
   * the real release and dispatches a copy then, in the same frame when it is still ahead, else
   * in the next one. Where in a frame a release lands decides what the first settle frame shows.
   */
  releaseAtMs?: number
}

/** The flick released at five places inside a frame. */
const phased = [0, 1, 6, 11, 15].map((releaseAtMs): Scenario => ({
  name: `flick, released ${releaseAtMs} ms into a frame`,
  axis: 'x',
  path: ({ x, y }) => line([x + 60, y], [x - 60, y], 80),
  releaseAtMs,
  judge: ['releaseLeapPx', 'firstShownMs', 'deadFramesAfterDelivery', 'speedKept'],
}))

const scenarios: Scenario[] = [
  {
    // Drag a third of the way, rest, let go: the photo returns.
    name: 'slow drag, settle back',
    axis: 'x',
    path: ({ x, y, w }) => [...line([x, y], [x - w * 0.3, y], 320), { x: x - w * 0.3, y, dt: 160 }],
  },
  {
    // Drag past the middle, rest, let go: the next photo arrives.
    name: 'slow drag, next photo',
    axis: 'x',
    path: ({ x, y, w }) => [
      ...line([x, y], [x - w * 0.62, y], 420),
      { x: x - w * 0.62, y, dt: 160 },
    ],
  },
  {
    // A short fast swipe: about 1.5 px/ms at release.
    name: 'flick, next photo',
    axis: 'x',
    path: ({ x, y }) => line([x + 60, y], [x - 60, y], 80),
  },
  {
    // Drag far slowly, then flick the rest: little distance left, high release speed.
    name: 'late flick, next photo',
    axis: 'x',
    path: ({ x, y, w }) => [
      ...line([x + w * 0.35, y], [x - w * 0.3, y], 450),
      ...line([x - w * 0.3, y], [x - w * 0.3 - 70, y], 40),
    ],
  },
  {
    // Drag down a little and let go: the photo returns (close drag, below the threshold).
    name: 'drag down, settle back',
    axis: 'y',
    path: ({ x, y }) => [...line([x, y], [x, y + 70], 300), { x, y: y + 70, dt: 160 }],
  },
  {
    // Drag almost a whole photo slowly, then flick: the spring caps the speed it cannot absorb,
    // so the photo arrives without passing its place. The start speed is capped by design.
    name: 'fast flick, little distance left',
    axis: 'x',
    path: ({ x, y, w }) => [
      ...line([x + w * 0.45, y], [x - w * 0.4, y], 500),
      ...line([x - w * 0.4, y], [x - w * 0.4 - 40, y], 16),
    ],
    judge: [
      'deadFramesAfterDelivery',
      'settledMs',
      'captionDriftPx',
      'captionOverlapPx',
      'captionLateMs',
      'captionGapFrames',
    ],
  },
  {
    // Flick to the next photo, then land a finger while it is still on its way and hold.
    name: 'catch a settling photo',
    axis: 'x',
    path: ({ x, y }) => [
      ...line([x + 60, y], [x - 60, y], 80),
      { x, y, dt: 90, lift: true },
      { x, y, dt: 120 },
    ],
    judge: [
      'catchJumpPx',
      'captionDriftPx',
      'captionOverlapPx',
      'captionLateMs',
      'captionGapFrames',
    ],
  },
  {
    // A swipe to the next photo on a phone that needs 40 ms of main thread for the photo
    // change (slides, counter, caption). The recorder blocks the main thread for 40 ms right
    // after the counter changes, wherever the lightbox does that work.
    name: 'swipe, slow photo change',
    axis: 'x',
    path: ({ x, y, w }) => line([x + w * 0.25, y], [x - w * 0.25, y], 250),
    blockMs: 40,
    judge: [
      'releaseLeapPx',
      'deadFramesAfterDelivery',
      'blockBeforeMotion',
      'captionDriftPx',
      'captionOverlapPx',
      'captionLateMs',
      'captionGapFrames',
    ],
  },
  ...phased,
]

function touchDriver(cdp: CDPSession): Driver {
  const send = async (type: 'touchStart' | 'touchMove' | 'touchEnd', point?: Point) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: point ? [{ x: point.x, y: point.y }] : [],
    })
  }
  return {
    down: (point) => send('touchStart', point),
    move: (point) => send('touchMove', point),
    up: () => send('touchEnd'),
  }
}

function mouseDriver(page: Page): Driver {
  return {
    down: async (point) => {
      await page.mouse.move(point.x, point.y)
      await page.mouse.down()
    },
    move: (point) => page.mouse.move(point.x, point.y),
    up: () => page.mouse.up(),
  }
}

/** Scroll a thumbnail low on the screen, below the nav: a flight from or to it covers a long way. */
const scrollLow = (item: Locator) =>
  item.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const nav = document.querySelector('.nav')!.getBoundingClientRect().bottom
    window.scrollBy(0, box.top - nav - Math.max(0, (innerHeight - nav - box.height) * 0.8))
  })

/**
 * Open the lightbox on the album's second photo. A close flies home only to a thumbnail the nav
 * does not cover: `clearOfNav` puts it low on the screen first.
 */
async function open(page: Page, clearOfNav = false) {
  await page.goto('/', { waitUntil: 'load' })
  const item = page.locator('.np-album__item').nth(START_INDEX)
  if (clearOfNav) await scrollLow(item)
  await item.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('[data-np-transition-frame]')).toBeHidden()
  await expect(page.locator('[data-np-slide]')).toHaveCount(3)
  // A cold browser under load can still lay the frames out at zero size: wait for real ones.
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll<HTMLImageElement>('[data-np-slide] img')].every(
        (image) => image.complete && image.naturalWidth > 0,
      ) &&
      [...document.querySelectorAll('[data-np-slide-frame]')].every(
        (frame) => frame.getBoundingClientRect().width > 0,
      ),
  )
  await page.waitForTimeout(400)
  const box = (await page.locator('.np-lightbox__media').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, w: box.width, h: box.height }
}

async function tap(drive: Driver, point: { x: number; y: number }) {
  await drive.down({ ...point, dt: 0 })
  await sleep(40)
  await drive.up()
}

/**
 * Load the album and find where to tap a thumbnail: the second photo, scrolled low below the nav
 * so it flies a long way, or with `covered` the first, partly under the nav. `coveredAtTop` says
 * whether the nav really covers the thumbnail's top.
 */
async function aim(page: Page, covered = false) {
  await page.goto(covered ? '/?covered=1' : '/', { waitUntil: 'load' })
  const item = page.locator('.np-album__item').nth(covered ? 0 : START_INDEX)
  if (!covered) await scrollLow(item)
  await item
    .locator('img')
    .evaluate(
      (image: HTMLImageElement) =>
        image.complete ||
        new Promise((done) => image.addEventListener('load', done, { once: true })),
    )
  await page.waitForTimeout(300)
  // The visible part of the photo, below the nav.
  return item.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const nav = document.querySelector('.nav')!.getBoundingClientRect()
    const coveredAtTop = !element.contains(
      document.elementFromPoint(box.left + box.width / 2, box.top + 2),
    )
    return {
      x: box.left + box.width / 2,
      y: (Math.max(box.top, nav.bottom) + box.bottom) / 2,
      coveredAtTop,
    }
  })
}

async function openByTap(page: Page, drive: Driver, target: { x: number; y: number }) {
  await tap(drive, target)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('[data-np-transition-frame]')).toBeHidden()
  await page.waitForTimeout(700)
}

/** Reads the photo's place, the captions and the backdrop on every frame, and marks the settle. */
async function record(page: Page, blockMs = 0, releaseAtMs?: number) {
  await page.evaluate(
    ({ index, blockMs, releaseAtMs }) => {
      const media = document.querySelector('.np-lightbox__media')!
      const viewport = document.querySelector('[data-np-motion="viewport"]')
      const rec: Trace = { frames: [], events: [], marks: [] }
      let running = true
      let frame = 0
      if (releaseAtMs !== undefined) {
        // Hold the real release (and the capture loss it causes) and dispatch a copy at
        // `releaseAtMs` after a frame callback's time stamp. Registered first, so the recorder
        // and the lightbox see only the copy.
        let frameAt = 0
        const clock = (at: number) => {
          frameAt = at
          if (running) requestAnimationFrame(clock)
        }
        requestAnimationFrame(clock)
        let replaying = false
        /** Wait until `at`, then dispatch a copy of the held release. */
        const send = (held: PointerEvent, at: number) => {
          while (performance.now() < at) {
            // Wait for the exact place in the frame.
          }
          replaying = true
          rec.marks.push({ type: 'release-sent', at: performance.now(), frame, target: at })
          held.target!.dispatchEvent(
            new PointerEvent('pointerup', {
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerId: held.pointerId,
              pointerType: held.pointerType,
              isPrimary: held.isPrimary,
              clientX: held.clientX,
              clientY: held.clientY,
              screenX: held.screenX,
              screenY: held.screenY,
              width: held.width,
              height: held.height,
            }),
          )
          replaying = false
        }
        /** From a frame callback: yield in messages until close to `at`, then send. */
        const replay = (held: PointerEvent, at: number) => {
          const channel = new MessageChannel()
          channel.port1.onmessage = () =>
            performance.now() < at - 2 ? channel.port2.postMessage(0) : send(held, at)
          channel.port2.postMessage(0)
        }
        let heldId: number | null = null
        const hold = (event: PointerEvent) => {
          const pointer = event
          if (replaying || !pointer.isTrusted) return
          if (event.type === 'lostpointercapture' && pointer.pointerId === heldId) {
            event.stopImmediatePropagation()
            return
          }
          if (event.type !== 'pointerup') return
          event.stopImmediatePropagation()
          heldId = pointer.pointerId
          rec.marks.push({ type: 'release-held', at: performance.now(), frame, target: frameAt })
          // Still ahead in this frame: wait in this handler. Right after a real release Chromium
          // runs other tasks only after the next frame.
          const target = frameAt + releaseAtMs
          if (performance.now() < target - 0.5) send(pointer, target)
          // Next frame: from a message after its frame callbacks, never inside one.
          else requestAnimationFrame((at) => replay(pointer, at + releaseAtMs))
        }
        window.addEventListener('pointerup', hold, { capture: true })
        window.addEventListener('lostpointercapture', hold, { capture: true })
      }
      // The settle: the latest Web Animation of the track or the stage.
      let settle: { animation: Animation; element: Element; frame: number } | null = null
      // Read without binding: the wrapper calls it with the element as `this`.
      const original: Element['animate'] = Reflect.get(Element.prototype, 'animate')
      Element.prototype.animate = function (this: Element, ...args) {
        const animation = original.apply(this, args)
        const track = document.querySelector('[data-np-slide]')?.parentElement
        if (running && (this === track || this === viewport)) {
          settle = { animation, element: this, frame }
          // The speed the settle plans to start with, from its first five keyframes (sampled
          // spring, played linearly): a fourth-order difference, within 1% of the start speed;
          // the spring already speeds up within the first sample.
          const [keyframes, timing] = args as [Keyframe[], KeyframeAnimationOptions]
          const place = (index: number) =>
            new DOMMatrixReadOnly(String(keyframes[index]?.transform ?? 'none'))
          const spacing =
            Array.isArray(keyframes) && keyframes.length > 4 && typeof timing?.duration === 'number'
              ? timing.duration / (keyframes.length - 1)
              : 0
          const start = (axis: 'm41' | 'm42') =>
            [-25, 48, -36, 16, -3].reduce(
              (sum, weight, index) => sum + weight * place(index)[axis],
              0,
            ) /
            (12 * spacing)
          rec.marks.push({
            type: 'animate',
            at: performance.now(),
            frame,
            ...(spacing && { startVx: start('m41'), startVy: start('m42') }),
          })
        }
        return animation
      }

      // How much of its motion, in ms, the settle shows: where its sampled path passes the place
      // it is drawn at now.
      const shownMs = (current: NonNullable<typeof settle>) => {
        const effect = current.animation.effect as KeyframeEffect | null
        if (!effect) return undefined
        const keyframes = effect.getKeyframes()
        const read = (transform: unknown) => {
          const matrix = new DOMMatrixReadOnly(String(transform ?? 'none'))
          return [matrix.m41, matrix.m42] as const
        }
        const points = keyframes.map((keyframe) => read(keyframe.transform))
        const [first, last] = [points[0], points.at(-1)]
        if (!first || !last) return undefined
        const axis = Math.abs(last[0] - first[0]) >= Math.abs(last[1] - first[1]) ? 0 : 1
        const now = read(getComputedStyle(current.element).transform)[axis]
        const duration = Number(effect.getTiming().duration)
        for (let index = 1; index < points.length; index++) {
          const [from, to] = [points[index - 1]![axis], points[index]![axis]]
          if (from === to || (now - from) * (now - to) > 0) continue
          const start = keyframes[index - 1]!.computedOffset
          const end = keyframes[index]!.computedOffset
          return duration * (start + ((end - start) * (now - from)) / (to - from))
        }
        return undefined
      }
      // The first frame after the settle was created: how much of its motion it shows.
      const checkFirstFrame = () => {
        if (!settle || frame !== settle.frame + 1) return
        const mark: Mark = {
          type: 'first-frame',
          at: performance.now(),
          frame,
          shownMs: shownMs(settle),
        }
        // Read again after a later frame callback of the page: keep the last reading.
        const last = rec.marks.at(-1)
        if (last?.type === 'first-frame' && last.frame === frame)
          rec.marks[rec.marks.length - 1] = mark
        else rec.marks.push(mark)
      }
      const counter = document.querySelector('.np-lightbox__counter')
      if (counter)
        new MutationObserver(() => {
          if (!running) return
          rec.marks.push({
            type: 'change',
            at: performance.now(),
            frame,
            framesSinceAnimate: settle ? frame - settle.frame : null,
          })
          if (!blockMs) return
          const until = performance.now() + blockMs
          while (performance.now() < until) {
            // The slow photo change.
          }
          rec.marks.push({ type: 'block-end', at: performance.now(), frame })
        }).observe(counter, { childList: true, characterData: true, subtree: true })
      const box = (element: Element) => {
        const { left, top, right, bottom } = element.getBoundingClientRect()
        return { left, top, right, bottom }
      }
      // The opacity a caption is drawn with: its own times its ancestors', and its text's.
      const drawnOpacity = (element: Element) => {
        let opacity = 1
        let node: Element | null = element.firstElementChild ?? element
        while (node && node !== document.body) {
          const style = getComputedStyle(node)
          if (style.visibility === 'hidden' || style.display === 'none') return 0
          opacity *= Number(style.opacity)
          node = node.parentElement
        }
        return opacity
      }
      const activeIndex = () =>
        Number(
          document.querySelector('[data-np-slide][data-np-active]')?.getAttribute('data-np-slide'),
        )
      // A caption inside a slide belongs to that slide's photo. A caption outside the slides
      // shows the active photo's text: it belongs to the photo active when that text appeared.
      const owners = new Map<string, number>()
      const ownerOf = (element: Element) => {
        const slide = element.closest('[data-np-slide]')
        if (slide) return Number(slide.getAttribute('data-np-slide'))
        const text = element.textContent?.trim() ?? ''
        if (!owners.has(text)) owners.set(text, activeIndex())
        return owners.get(text)!
      }
      // The recorder reads a frame after the page's own frame callbacks: a page callback that
      // runs after the recorder's (asked for later) makes it read that frame again.
      const nativeFrame = window.requestAnimationFrame.bind(window)
      let tickAt = -1
      window.requestAnimationFrame = (callback) =>
        nativeFrame((t) => {
          callback(t)
          if (running && t === tickAt) read(t)
        })
      const tick = (t: number) => {
        if (!running) return
        frame++
        tickAt = t
        read(t)
        nativeFrame(tick)
      }
      const push = (entry: Frame) => {
        if (rec.frames.at(-1)?.t === entry.t) rec.frames[rec.frames.length - 1] = entry
        else rec.frames.push(entry)
      }
      const read = (t: number) => {
        checkFirstFrame()
        const slide = document.querySelector(`[data-np-slide="${index}"]`)
        const base = media.getBoundingClientRect().left
        const drawn = viewport ? new DOMMatrixReadOnly(getComputedStyle(viewport).transform).m42 : 0
        const backdrop = document.querySelector('[data-np-motion="backdrop"]')
        push({
          t,
          at: performance.now(),
          x: slide ? slide.getBoundingClientRect().left - base : null,
          y: drawn,
          captions: [...document.querySelectorAll('[data-np-motion="caption"]')].map((caption) => {
            const owner = ownerOf(caption)
            const frame = document.querySelector(`[data-np-slide="${owner}"] [data-np-slide-frame]`)
            // The frame is read before and after the caption; a sample counts only when
            // both reads agree, so all three show one moment of the motion.
            let drawn = box(caption)
            let own: Box | null = null
            for (let tries = 0; frame && !own && tries < 3; tries++) {
              const before = box(frame)
              drawn = box(caption)
              const after = box(frame)
              const still =
                Math.abs(before.left - after.left) < 0.05 &&
                Math.abs(before.bottom - after.bottom) < 0.05
              if (still) own = after
            }
            return { owner, ...drawn, own, opacity: drawnOpacity(caption) }
          }),
          slides: [...document.querySelectorAll('[data-np-slide]')].flatMap((slide) => {
            const frame = slide.querySelector('[data-np-slide-frame]')
            return frame
              ? [{ index: Number(slide.getAttribute('data-np-slide')), ...box(frame) }]
              : []
          }),
          media: media.isConnected ? box(media) : undefined,
          backdrop: backdrop ? Number(getComputedStyle(backdrop).opacity) : null,
        })
      }
      nativeFrame(tick)
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
        window.addEventListener(
          type,
          (event) => {
            const pointer = event as PointerEvent
            rec.events.push({
              type,
              t: pointer.timeStamp,
              at: performance.now(),
              x: pointer.clientX,
              y: pointer.clientY,
            })
          },
          { capture: true, passive: true },
        )
      const scope = window as unknown as { __stop: () => Trace }
      scope.__stop = () => {
        running = false
        Element.prototype.animate = original
        window.requestAnimationFrame = nativeFrame
        return rec
      }
    },
    { index: START_INDEX, blockMs, releaseAtMs },
  )
}

/** Send a finger path: touch down, then each point after its `dt`, then lift. */
async function perform(drive: Driver, points: Point[]) {
  await drive.down(points[0]!)
  for (const point of points.slice(1)) {
    if (point.lift) await drive.up()
    await sleep(point.dt)
    await (point.lift ? drive.down(point) : drive.move(point))
  }
  await drive.up()
}

async function play(page: Page, drive: Driver, points: Point[]) {
  await perform(drive, points)
  await page.waitForTimeout(900)
  return page.evaluate(() => (window as unknown as { __stop: () => Trace }).__stop())
}

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits

function analyse(trace: Trace, axis: 'x' | 'y') {
  const down = trace.events.find((event) => event.type === 'pointerdown')!
  const up = trace.events.findLast(
    (event) => event.type === 'pointerup' || event.type === 'pointercancel',
  )!
  const moves = trace.events.filter((event) => event.type === 'pointermove')
  // After a blocked main thread Chromium runs the frame callbacks it owes back to back with old
  // time stamps; only the last of such a burst can have been shown.
  const frames = trace.frames
    .filter((frame) => frame[axis] !== null)
    .filter((frame, index, all) => !(all[index + 1] && all[index + 1]!.at - frame.at < 4))
  const before = frames.findLast((frame) => frame.t < down.t) ?? frames[0]!
  const rest = before[axis]!
  const drawn = (frame: Frame) => frame[axis]! - rest
  const finger = (t: number) => {
    const last = [down, ...moves].findLast((event) => event.t <= t) ?? down
    return last[axis] - down[axis]
  }

  // While the finger is down.
  const dragFrames = frames.filter((frame) => frame.t > down.t && frame.t <= up.t)
  const firstMoving = dragFrames.find((frame) => Math.abs(drawn(frame)) > 0.5)
  const following = dragFrames.filter((frame) => firstMoving && frame.t >= firstMoving.t)
  const beforeMoving = firstMoving ? dragFrames[dragFrames.indexOf(firstMoving) - 1] : undefined
  // A frame shows the newest finger event handled before it, or, when that event arrived while
  // the frame was being made, the one before it. Both count, and the smaller value wins.
  const touches = [down, ...moves]
  const fingerAt = (t: number, back: 0 | 1) => {
    const newest = touches.findLastIndex((event) => event.t <= t)
    const event = touches[Math.max(0, newest - back)] ?? down
    return event[axis] - down[axis]
  }
  const backs = [0, 1] as const
  // The drag starts where its direction locked, so the photo trails the finger by that slop by
  // design. Claim 1: in its first moving frame the photo moves no farther than the finger did.
  // The frame before may also have shown the event before its newest (WebKit draws late).
  const startJumps = backs.flatMap((back) =>
    backs.map((backBefore) => {
      if (!firstMoving) return 0
      const fingerStep =
        fingerAt(firstMoving.t, back) - fingerAt(beforeMoving?.t ?? down.t, backBefore)
      return Math.max(0, Math.abs(drawn(firstMoving)) - Math.abs(fingerStep))
    }),
  )
  // Claim 2: after that frame, the distance between photo and finger does not change. The first
  // frame's distance depends on which event it showed; the reading that stays steadier counts.
  const gapsFrom = (offset: number) =>
    following.map((frame) =>
      Math.min(...backs.map((back) => Math.abs(drawn(frame) - fingerAt(frame.t, back) - offset))),
    )
  const { gaps, offset } = firstMoving
    ? backs
        .map((back) => {
          const offset = drawn(firstMoving) - fingerAt(firstMoving.t, back)
          return { gaps: gapsFrom(offset), offset }
        })
        .reduce((best, next) =>
          Math.max(0, ...next.gaps) < Math.max(0, ...best.gaps) ? next : best,
        )
    : { gaps: [], offset: 0 }

  // After the finger left. The first frame may still draw the last finger move.
  const after = frames.filter((frame) => frame.t > up.t)
  const lastDown = dragFrames.at(-1) ?? before
  const end = drawn(after.at(-1)!)
  const sequence = [lastDown, ...after]
  const steps = after.map((frame, index) => ({
    frame,
    px: drawn(frame) - drawn(sequence[index]!),
    ms: frame.t - sequence[index]!.t,
    previousAt: sequence[index]!.at,
  }))
  const resting = (frame: Frame) => Math.abs(drawn(frame) - end) < 0.5
  // Dead frames: the photo stands still although it has not arrived.
  const early = steps.filter((step) => step.frame.t - up.t <= 120 && !resting(step.frame))
  const dead = early.filter((step) => Math.abs(step.px) < 0.5)
  const travel = end - drawn(lastDown)
  const lastMove = moves.at(-1) ?? down
  // The finger's speed over its last 50 ms of moves, counted back from its last move: counted
  // from the release, a pause before lifting left one uneven move gap in the window.
  const window50 = moves.findLast((event) => event.t <= lastMove.t - 50) ?? down
  const resting50 = up.t - lastMove.t > 50
  const fingerSpeed =
    !resting50 && lastMove.t > window50.t
      ? (lastMove[axis] - window50[axis]) / (lastMove.t - window50.t)
      : 0
  const reach = (share: number) => {
    const frame = after.find(
      (frame) => Math.abs(drawn(frame) - drawn(lastDown)) >= Math.abs(travel) * share,
    )
    return frame ? frame.t - up.t : null
  }
  const settled = after.find((frame) =>
    after.filter((later) => later.t >= frame.t).every((later) => resting(later)),
  )
  // Finger travel the last drag frame had not drawn yet (WebKit draws mouse moves late) is the
  // finger's, not the settle's.
  const undrawn = Math.abs(finger(up.t) - (drawn(lastDown) - offset))
  const marks = trace.marks.filter((mark) => mark.at >= up.at)
  const animated = marks.find((mark) => mark.type === 'animate')
  const plannedSpeed = axis === 'x' ? animated?.startVx : animated?.startVy
  const firstFrame = marks.find((mark) => mark.type === 'first-frame')
  const change = marks.find((mark) => mark.type === 'change')
  const blockEnd = marks.find((mark) => mark.type === 'block-end')
  // The block landed before any frame showed the settle: the photo stood still through it.
  const blockBeforeMotion = blockEnd
    ? change && (change.framesSinceAnimate ?? 0) >= 1
      ? 0
      : 1
    : null
  // A leap: a step in the first 150 ms after the release that covers more than the speed on
  // either side of it would in that step's time: the finger's speed before the first step, the
  // neighbouring steps' speeds otherwise. Speeds, because headless WebKit draws frames at uneven
  // intervals. Finger travel the last drag frame had not drawn yet counts for the first step.
  // A step across the lab's main-thread block is not seen by this recorder when a frame had
  // shown the settle before the block: the compositor drew those frames. Without such a frame
  // the screen stood still through the block, so that step is allowed one frame of travel.
  const early150 = steps.filter((step) => step.frame.t - up.t <= 150 && step.ms > 0)
  const rate = (step: (typeof steps)[number] | undefined) =>
    step ? Math.abs(step.px) / step.ms : 0
  const fingerRate = Math.abs(fingerSpeed)
  const leaps = early150.map((step, index) => {
    const across = blockEnd && step.previousAt < blockEnd.at && step.frame.at >= blockEnd.at
    if (across && blockBeforeMotion === 0) return 0
    // Other missed frames are frame pacing, not a leap; what the compositor drew in them is not
    // visible to this recorder.
    if (!across && step.ms > 25) return 0
    const previous = index ? rate(early150[index - 1]) : fingerRate
    // Through a block with nothing on the compositor the screen stood still: one frame of travel.
    const span = across ? 1000 / 60 : step.ms
    const allowed =
      Math.max(previous, rate(early150[index + 1]), fingerRate) * span + (index ? 0 : undrawn)
    return Math.max(0, Math.abs(step.px) - allowed)
  })

  return {
    // How much farther than the finger the photo moved in its first moving frame.
    startJumpPx: firstMoving ? round(Math.min(...startJumps)) : null,
    followGapMaxPx: round(Math.max(0, ...gaps)),
    deadFramesAfterDelivery: dead.filter((step) => step.frame.at > up.at).length,
    // Claim 4 compares the speed the settle's keyframes start with, not the first drawn step:
    // that may still be the finger's last move drawn late (Chromium), and a spring pulled toward
    // a photo far away is faster on average over its first frame than at its start.
    // Claim 27: the first frame that draws the settle shows at most one frame of its motion.
    firstShownMs: firstFrame?.shownMs === undefined ? null : round(firstFrame.shownMs),
    speedKept:
      Math.abs(fingerSpeed) > 0.1 && plannedSpeed !== undefined
        ? round(plannedSpeed / fingerSpeed, 2)
        : null,
    halfWayMs: reach(0.5) === null ? null : round(reach(0.5)!),
    ninetyMs: reach(0.9) === null ? null : round(reach(0.9)!),
    settledMs: settled ? round(settled.t - up.t) : null,
    releaseLeapPx: early150.length ? round(Math.max(...leaps)) : null,
    blockBeforeMotion,
  }
}

/**
 * Claim 9: a finger that lands on a settling photo holds it. The frame after the touch may
 * still show one step of the settle, no larger than the step before it; then the photo rests.
 */
function caught(trace: Trace, axis: 'x' | 'y') {
  const second = trace.events.filter((event) => event.type === 'pointerdown')[1]
  const frames = trace.frames.filter((frame) => frame[axis] !== null)
  if (!second) return { catchJumpPx: null }
  const beforeIndex = frames.findLastIndex((frame) => frame.t < second.t)
  const [earlier, before] = [frames[beforeIndex - 1]!, frames[beforeIndex]!]
  const after = frames.filter((frame) => frame.t > second.t && frame.t < second.t + 100)
  if (!after[0]) return { catchJumpPx: null }
  const step = Math.abs(before[axis]! - earlier[axis]!)
  const landing = Math.max(0, Math.abs(after[0][axis]! - before[axis]!) - step)
  const held = Math.max(0, ...after.map((frame) => Math.abs(frame[axis]! - after[0]![axis]!)))
  return { catchJumpPx: round(Math.max(landing, held)) }
}

/**
 * The caption claims, in slide mode: each caption keeps its place under its own photo on every
 * frame, never lies over another photo, and after a photo change the new caption is fully shown
 * once the settle ends, with a caption on screen on every frame in between.
 */
function captionClaims(trace: Trace, settledMs: number | null | undefined) {
  const down = trace.events.find((event) => event.type === 'pointerdown')!
  const up = trace.events.findLast((event) => event.type === 'pointerup')!
  const frames = trace.frames.filter((frame) => frame.captions && frame.slides && frame.media)
  const shown = (caption: CaptionBox) => caption.opacity > 0.05
  // Where each photo's caption sits against its photo frame, on every frame it is shown.
  const offsets = new Map<number, { dx: number[]; dy: number[] }>()
  let overlap = 0
  for (const frame of frames) {
    for (const caption of frame.captions!.filter(shown)) {
      const own = caption.own
      if (own) {
        const entry = offsets.get(caption.owner) ?? { dx: [], dy: [] }
        entry.dx.push(caption.left - own.left)
        entry.dy.push(caption.top - own.bottom)
        offsets.set(caption.owner, entry)
      }
      for (const other of frame.slides!.filter((slide) => slide.index !== caption.owner)) {
        const width = Math.min(caption.right, other.right) - Math.max(caption.left, other.left)
        const height = Math.min(caption.bottom, other.bottom) - Math.max(caption.top, other.top)
        if (width > 0.5 && height > 0.5) overlap = Math.max(overlap, Math.min(width, height))
      }
    }
  }
  const range = (values: number[]) => Math.max(...values) - Math.min(...values)
  const drift = Math.max(
    0,
    ...[...offsets.values()].map(({ dx, dy }) => Math.max(range(dx), range(dy))),
  )
  // On screen: shown, and at least partly inside the media area.
  const onScreen = (caption: CaptionBox, media: Box) =>
    shown(caption) && caption.right > media.left + 1 && caption.left < media.right - 1
  const gapFrames = frames.filter(
    (frame) =>
      frame.t > down.t && !frame.captions!.some((caption) => onScreen(caption, frame.media!)),
  ).length
  const startActive = frames[0]?.captions?.find(shown)?.owner
  const last = frames.at(-1)
  // The photo shown at the end: its frame lies inside the media area.
  const endOwner = last?.slides?.find(
    (slide) => slide.left >= last.media!.left - 1 && slide.right <= last.media!.right + 1,
  )?.index
  let late: number | null = null
  if (startActive != null && endOwner != null && endOwner !== startActive && settledMs != null) {
    const full = frames.find(
      (frame) =>
        frame.t > up.t &&
        frame.captions!.some(
          (caption) =>
            caption.owner === endOwner &&
            caption.opacity >= 0.99 &&
            caption.left >= frame.media!.left - 1 &&
            caption.right <= frame.media!.right + 1,
        ),
    )
    late = full ? Math.max(0, round(full.t - (up.t + settledMs))) : 999
  }
  return {
    captionDriftPx: round(drift),
    captionOverlapPx: round(overlap),
    captionLateMs: late,
    captionGapFrames: gapFrames,
  }
}

/** The bar for "smooth". Each line is one claim of internals/mobile-feel.md. */
const limits = {
  captionDriftPx: 1,
  captionOverlapPx: 0,
  captionLateMs: 0,
  captionGapFrames: 0,
  // The backdrop over a whole open or close, per frame.
  backdropStepMax: 0.12,
  catchJumpPx: 1,
  // One frame of a 60 Hz screen, 16.7 ms, read back from the drawn place.
  firstShownMs: 17,
  releaseLeapPx: 6,
  blockBeforeMotion: 0,
  startJumpPx: 2,
  followGapMaxPx: 1,
  // Counted from when the page received the release: a frame the browser drew before that
  // shows the finger at rest, and no page code can move it.
  deadFramesAfterDelivery: 0,
  halfWayMs: 100,
  ninetyMs: 250,
  settledMs: 400,
  // Opens and closes: the first frame that moves the photo shows little of the way; the backdrop
  // follows the flight's progress, so it changes as little.
  flightFirstShare: 0.1,
  chromeStepMax: 0.34,
  flightBlockBeforeMotion: 0,
  // A partly covered thumbnail fades: no ghost flies over the page's chrome.
  ghostShownFrames: 0,
  // The ambient glow. During a swipe and its settle the incoming photo's glow weighs what the
  // track shows of that photo, within this much, on every frame.
  glowFollowMax: 0.06,
  // It starts changing in the frame the photo starts moving, and ends at most a frame after it.
  glowStartLagFrames: 0,
  glowEndLagFrames: 1,
  // No frame changes the glow by more than this beyond the track's own step.
  glowExtraStepMax: 0.12,
  // Opens: the glow is whole at the flight's first frame.
  glowMissingAtStart: 0.01,
  // A main thread blocked after a release: a running opacity animation moves the glow through
  // the block (1 = none).
  glowStillInBlock: 0,
} as const

function verdicts(
  shape: Record<string, number | null | undefined>,
  judge?: Scenario['judge'],
  judgeSpeed = true,
) {
  const failed: string[] = []
  for (const name of Object.keys(limits) as (keyof typeof limits)[]) {
    const value = shape[name]
    if ((!judge || judge.includes(name)) && value != null && value > limits[name])
      failed.push(`${name} ${value} > ${limits[name]}`)
  }
  const kept = shape.speedKept
  if (
    judgeSpeed &&
    (!judge || judge.includes('speedKept')) &&
    kept != null &&
    (kept < 0.8 || kept > 1.25)
  )
    failed.push(`speedKept ${kept} outside 0.8 to 1.25`)
  return failed
}

/** Write the claim rows and raw traces of one test, and fail on any claim that does not hold. */
async function finish(
  browserName: string,
  files: { claims: string; traces: string },
  results: Record<string, unknown>[],
  traces: Record<string, unknown>,
) {
  const folder = resolve(out, browserName)
  await mkdir(folder, { recursive: true })
  await writeFile(resolve(folder, files.claims), JSON.stringify(results, null, 2))
  await writeFile(resolve(folder, files.traces), JSON.stringify(traces))
  console.log(JSON.stringify(results, null, 2))
  const failures = results.flatMap((row) =>
    (row.failed as string[]).map((failure) => `${String(row.scenario)}: ${failure}`),
  )
  expect(failures, 'claims of internals/mobile-feel.md that do not hold').toEqual([])
}

test('gesture traces', async ({ page, browserName }) => {
  // Chromium: touch through CDP. WebKit: a mouse at full speed.
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null
  const drive = cdp ? touchDriver(cdp) : mouseDriver(page)
  const results: Record<string, unknown>[] = []
  const traces: Record<string, Trace> = {}

  for (const scenario of scenarios.filter((item) => !only || only.test(item.name))) {
    const centre = await open(page)
    await record(page, scenario.blockMs, scenario.releaseAtMs)
    const trace = await play(page, drive, scenario.path(centre))
    traces[scenario.name] = trace
    const moved = scenario.judge?.includes('catchJumpPx')
      ? caught(trace, scenario.axis)
      : analyse(trace, scenario.axis)
    const claims = {
      ...moved,
      ...captionClaims(
        trace,
        'settledMs' in moved && typeof moved.settledMs === 'number' ? moved.settledMs : null,
      ),
    }
    // Playwright's WebKit mouse moves arrive about 11 ms apart and are drawn a move or two
    // late, so the finger speed the lab reads there is not the speed the photo saw: the speed
    // claim is judged in Chromium only.
    results.push({
      scenario: scenario.name,
      ...claims,
      failed: verdicts(claims, scenario.judge, !!cdp),
    })
  }

  await finish(browserName, { claims: 'summary.json', traces: 'traces.json' }, results, traces)
})

// Opens and closes. A second recorder reads, on every frame, the ghost's drawn box, the
// backdrop and every control layer and caption. It also keeps the flight animation's keyframes
// and timing, so the script can compute where the plan puts the ghost at its start and its end.

type TransitionFrame = {
  t: number
  /** The ghost's drawn box; null while it is not displayed. */
  ghost: Box | null
  backdrop: number | null
  /** The drawn opacity of every control layer and caption, by element. */
  chrome: Record<string, number>
  /** The chrome elements outside the viewport, such as a neighbour slide's caption. */
  away: string[]
  /** The flight's start time on this frame; null while it has none. */
  start: number | null
}
/** The ghost's transform animation: keyframes, timing and the box it moves. */
type Flight = {
  keyframes: { computedOffset: number; easing: string; transform: string }[]
  duration: number
  delay: number
  easing: string
  layout: { left: number; top: number; width: number; height: number }
  origin: [number, number]
}
type TransitionTrace = {
  frames: TransitionFrame[]
  flight: Flight | null
  /** When the finger left, or the mouse button went up: the tap or the drag's release. */
  upAt: number | null
  marks: { type: string; at: number }[]
  /** What each chrome id is: its tag, classes and slide. */
  chromeNames: Record<string, string>
}

/**
 * `blockAfterStartMs` blocks the main thread in the first frame callback after the flight's
 * clock started; `blockBeforeStartMs` in the first frame callback after the tap.
 */
async function recordTransition(
  page: Page,
  options: { blockAfterStartMs?: number; blockBeforeStartMs?: number } = {},
) {
  await page.evaluate(({ blockAfterStartMs = 0, blockBeforeStartMs = 0 }) => {
    const rec: TransitionTrace = {
      frames: [],
      flight: null,
      upAt: null,
      marks: [],
      chromeNames: {},
    }
    let running = true
    let frame = 0
    let flight: Animation | null = null
    // The frame on which the flight's clock was first seen running.
    let startedFrame = -1
    let blockBefore = false
    let blockedAfter = false
    const original: Element['animate'] = Reflect.get(Element.prototype, 'animate')
    Element.prototype.animate = function (this: Element, ...args) {
      const animation = original.apply(this, args)
      if (running && this.matches('[data-np-transition-frame]')) {
        const effect = animation.effect as KeyframeEffect
        const keyframes = effect.getKeyframes()
        if (keyframes.some((keyframe) => keyframe.transform != null)) {
          const style = getComputedStyle(this)
          const timing = effect.getTiming()
          const [x, y] = style.transformOrigin.split(' ').map(Number.parseFloat)
          flight = animation
          startedFrame = -1
          rec.flight = {
            keyframes: keyframes.map((keyframe) => ({
              computedOffset: keyframe.computedOffset,
              easing: keyframe.easing ?? 'linear',
              transform: String(keyframe.transform ?? 'none'),
            })),
            duration: Number(timing.duration),
            delay: Number(timing.delay ?? 0),
            easing: String(timing.easing ?? 'linear'),
            layout: {
              left: Number.parseFloat(style.left),
              top: Number.parseFloat(style.top),
              width: Number.parseFloat(style.width),
              height: Number.parseFloat(style.height),
            },
            origin: [x ?? 0, y ?? 0],
          }
        }
      }
      return animation
    }
    window.addEventListener(
      'pointerup',
      (event) => {
        rec.upAt = event.timeStamp
        blockBefore = blockBeforeStartMs > 0
      },
      { capture: true, passive: true },
    )
    const ids = new WeakMap<Element, string>()
    let nextId = 0
    const idOf = (element: Element) => {
      if (!ids.has(element)) {
        const id = String(nextId++)
        ids.set(element, id)
        const slide = element.closest('[data-np-slide]')?.getAttribute('data-np-slide')
        rec.chromeNames[id] =
          `${element.tagName.toLowerCase()}.${element.className}` +
          (slide == null ? '' : ` in slide ${slide}`)
      }
      return ids.get(element)!
    }
    const drawn = (element: Element) => {
      let opacity = 1
      for (let node: Element | null = element; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return 0
        opacity *= Number(style.opacity)
      }
      return opacity
    }
    const box = (element: Element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect()
      return { left, top, right, bottom }
    }
    const read = (t: number) => {
      const ghost = document.querySelector('[data-np-transition-frame]')
      const image = ghost?.querySelector('img')
      const shown =
        !!ghost && !!image && getComputedStyle(ghost).display !== 'none' && drawn(image) > 0
      if (flight && startedFrame < 0 && flight.playState === 'running') startedFrame = frame
      const backdrop = document.querySelector('[data-np-motion="backdrop"]')
      const chrome: Record<string, number> = {}
      const away: string[] = []
      for (const element of document.querySelectorAll(
        '[data-np-motion="controls"], [data-np-motion="caption"]',
      )) {
        const id = idOf(element)
        chrome[id] = drawn(element)
        const { left, top, right, bottom } = element.getBoundingClientRect()
        if (right <= 0 || bottom <= 0 || left >= innerWidth || top >= innerHeight) away.push(id)
      }
      const entry: TransitionFrame = {
        t,
        ghost: shown ? box(ghost) : null,
        backdrop: backdrop ? drawn(backdrop) : null,
        chrome,
        away,
        start: flight?.startTime == null ? null : Number(flight.startTime),
      }
      if (rec.frames.at(-1)?.t === t) rec.frames[rec.frames.length - 1] = entry
      else rec.frames.push(entry)
    }
    const block = (ms: number, type: string) => {
      rec.marks.push({ type: `${type}-start`, at: performance.now() })
      const until = performance.now() + ms
      while (performance.now() < until) {
        // The slow frame.
      }
    }
    const nativeFrame = window.requestAnimationFrame.bind(window)
    let tickAt = -1
    // Read a frame after the page's own frame callbacks, as the gesture recorder does.
    window.requestAnimationFrame = (callback) =>
      nativeFrame((t) => {
        callback(t)
        if (running && t === tickAt) read(t)
      })
    const tick = (t: number) => {
      if (!running) return
      frame++
      tickAt = t
      read(t)
      if (blockBefore && startedFrame < 0) {
        blockBefore = false
        block(blockBeforeStartMs, 'block-before')
      } else if (blockAfterStartMs && !blockedAfter && startedFrame >= 0 && frame > startedFrame) {
        blockedAfter = true
        block(blockAfterStartMs, 'block-after')
      }
      nativeFrame(tick)
    }
    nativeFrame(tick)
    ;(window as unknown as { __stopTransition: () => TransitionTrace }).__stopTransition = () => {
      running = false
      Element.prototype.animate = original
      window.requestAnimationFrame = nativeFrame
      return rec
    }
  }, options)
}

const stopTransition = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __stopTransition: () => TransitionTrace }).__stopTransition(),
  )

type Pose = { tx: number; ty: number; s: number }
function parsePose(transform: string): Pose {
  if (!transform || transform === 'none') return { tx: 0, ty: 0, s: 1 }
  const matrix = /^matrix\(([^)]+)\)/.exec(transform)
  if (matrix) {
    const [a, , , , e, f] = matrix[1]!.split(',').map(Number)
    return { tx: e!, ty: f!, s: a! }
  }
  const translate = /translate\(\s*(-?[\d.e+-]+)px,\s*(-?[\d.e+-]+)px\s*\)/.exec(transform)
  const scale = /scale\(\s*(-?[\d.e+-]+)\s*\)/.exec(transform)
  return {
    tx: translate ? Number(translate[1]) : 0,
    ty: translate ? Number(translate[2]) : 0,
    s: scale ? Number(scale[1]) : 1,
  }
}

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
}
function eased(easing: string, x: number) {
  if (easing === 'linear') return x
  const bezier = /cubic-bezier\(([^)]+)\)/.exec(easing)
  const [x1, y1, x2, y2] = bezier
    ? (bezier[1]!.split(',').map(Number) as [number, number, number, number])
    : (NAMED_EASINGS[easing] ?? [0, 0, 1, 1])
  const curve = (u: number, a: number, b: number) =>
    3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3
  let [low, high] = [0, 1]
  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2
    if (curve(middle, x1, x2) < x) low = middle
    else high = middle
  }
  return curve((low + high) / 2, y1, y2)
}

/** Where the plan puts the ghost `tau` ms after its start. */
function plannedBox(flight: Flight, tau: number): Box {
  const x = Math.min(1, Math.max(0, (tau - flight.delay) / flight.duration))
  const progress = eased(flight.easing, x)
  const frames = flight.keyframes
  let index = 0
  while (index < frames.length - 2 && progress > frames[index + 1]!.computedOffset) index++
  const [from, to] = [frames[index]!, frames[index + 1] ?? frames[index]!]
  const span = to.computedOffset - from.computedOffset
  const local = eased(from.easing, span > 0 ? (progress - from.computedOffset) / span : 1)
  const [a, b] = [parsePose(from.transform), parsePose(to.transform)]
  const pose = {
    tx: a.tx + (b.tx - a.tx) * local,
    ty: a.ty + (b.ty - a.ty) * local,
    s: a.s + (b.s - a.s) * local,
  }
  const { left, top, width, height } = flight.layout
  const [ox, oy] = flight.origin
  const x0 = left + pose.tx + ox * (1 - pose.s)
  const y0 = top + pose.ty + oy * (1 - pose.s)
  return { left: x0, top: y0, right: x0 + width * pose.s, bottom: y0 + height * pose.s }
}

const EDGES = ['left', 'top', 'right', 'bottom'] as const
const distance = (a: Box, b: Box) => Math.max(...EDGES.map((edge) => Math.abs(a[edge] - b[edge])))

/** A per-frame change, scaled to one 60 Hz frame when the gap was longer than 25 ms. */
const paced = (change: number, ms: number) => (ms > 25 ? (change * (1000 / 60)) / ms : change)

/** The ghost's flight, the backdrop and the chrome, from the tap or the release to the end. */
function transitionClaims(trace: TransitionTrace) {
  const from = trace.upAt ?? -Infinity
  const frames = trace.frames.filter((frame) => frame.t >= from)
  const backdrops = frames.filter((frame) => frame.backdrop != null)
  const backdropStepMax = Math.max(
    0,
    ...backdrops
      .slice(1)
      .map((frame, index) =>
        paced(
          Math.abs(frame.backdrop! - backdrops[index]!.backdrop!),
          frame.t - backdrops[index]!.t,
        ),
      ),
  )
  // A control or caption that appears or disappears on screen, drawn, counts as a step from or
  // to 0; a neighbour slide's caption mounting outside the viewport does not.
  let chromeStepMax = 0
  for (const [index, frame] of frames.entries()) {
    const before = frames[index - 1]
    if (!before) continue
    for (const id of new Set([...Object.keys(before.chrome), ...Object.keys(frame.chrome)])) {
      const [was, is] = [before.chrome[id], frame.chrome[id]]
      const seen = is == null ? !before.away.includes(id) : was != null || !frame.away.includes(id)
      if (!seen) continue
      const change = Math.abs((is ?? 0) - (was ?? 0))
      chromeStepMax = Math.max(chromeStepMax, paced(change, frame.t - before.t))
    }
  }
  const shown = frames.filter((frame) => frame.ghost)
  const base = {
    backdropStepMax: round(backdropStepMax, 3),
    chromeStepMax: round(chromeStepMax, 3),
    ghostShownFrames: shown.length,
  }
  const { flight } = trace
  const start = trace.frames.findLast((frame) => frame.start != null)?.start
  if (!flight || start == null || !shown.length) return base
  const end = flight.delay + flight.duration
  const pose0 = plannedBox(flight, 0)
  const travel = distance(pose0, plannedBox(flight, end))
  const firstMove = shown.findIndex((frame) => distance(frame.ghost!, pose0) > 0.5)
  if (firstMove < 0 || travel < 1) return base
  const moving = shown[firstMove]!
  const blockStart = trace.marks.find((mark) => mark.type === 'block-after-start')
  return {
    ...base,
    flightFirstShare: round(distance(moving.ghost!, pose0) / travel, 3),
    flightBlockBeforeMotion: blockStart ? (moving.t < blockStart.at ? 0 : 1) : null,
  }
}

const FLIGHT_CLAIMS = ['flightFirstShare', 'backdropStepMax', 'chromeStepMax'] as const
/** A blocked main thread: the ghost must not stand still through the block. */
const BLOCKED_AFTER_START_CLAIMS = [...FLIGHT_CLAIMS, 'flightBlockBeforeMotion'] as const

type TransitionScenario = {
  name: string
  kind: 'open' | 'close'
  /** A close by a drag down this path; by the close button when absent. */
  drag?: Scenario['path']
  blockAfterStartMs?: number
  blockBeforeStartMs?: number
  /** Open the first photo, scrolled partly under the sticky nav. */
  covered?: boolean
  judge: readonly (keyof typeof limits)[]
}

const transitions: TransitionScenario[] = [
  { name: 'open by tap', kind: 'open', judge: FLIGHT_CLAIMS },
  { name: 'close by tap', kind: 'close', judge: FLIGHT_CLAIMS },
  {
    name: 'close by drag down',
    kind: 'close',
    drag: ({ x, y }) => line([x, y], [x, y + 220], 180),
    judge: FLIGHT_CLAIMS,
  },
  {
    name: 'close by drag down far',
    kind: 'close',
    drag: ({ x, y, h }) => line([x, y - h * 0.25], [x, y + h * 0.35], 300),
    judge: FLIGHT_CLAIMS,
  },
  {
    name: 'open, blocked after the start',
    kind: 'open',
    blockAfterStartMs: 60,
    judge: BLOCKED_AFTER_START_CLAIMS,
  },
  {
    name: 'close by tap, blocked after the start',
    kind: 'close',
    blockAfterStartMs: 60,
    judge: BLOCKED_AFTER_START_CLAIMS,
  },
  {
    name: 'open, blocked between the tap and the start',
    kind: 'open',
    blockBeforeStartMs: 60,
    judge: FLIGHT_CLAIMS,
  },
  {
    name: 'open a thumbnail partly under the nav',
    kind: 'open',
    covered: true,
    judge: ['ghostShownFrames', 'backdropStepMax', 'chromeStepMax'],
  },
]

test('transition traces', async ({ page, browserName }) => {
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null
  const drive = cdp ? touchDriver(cdp) : mouseDriver(page)
  const results: Record<string, unknown>[] = []
  const traces: Record<string, TransitionTrace> = {}
  for (const scenario of transitions.filter((item) => !only || only.test(item.name))) {
    const block = {
      blockAfterStartMs: scenario.blockAfterStartMs,
      blockBeforeStartMs: scenario.blockBeforeStartMs,
    }
    if (scenario.kind === 'open') {
      const target = await aim(page, scenario.covered)
      expect(target.coveredAtTop, 'the thumbnail is partly under the nav').toBe(!!scenario.covered)
      await recordTransition(page, block)
      await openByTap(page, drive, target)
    } else {
      const centre = await open(page, true)
      await page.waitForTimeout(300)
      await recordTransition(page, block)
      if (scenario.drag) await perform(drive, scenario.drag(centre))
      else {
        const button = (await page.getByRole('button', { name: /close/i }).boundingBox())!
        await tap(drive, { x: button.x + button.width / 2, y: button.y + button.height / 2 })
      }
      await expect(page.getByRole('dialog')).toBeHidden()
      await page.waitForTimeout(300)
    }
    const trace = await stopTransition(page)
    traces[scenario.name] = trace
    const shape = transitionClaims(trace)
    const failed: string[] = []
    for (const name of scenario.judge) {
      const value = (shape as Record<string, number | null | undefined>)[name]
      if (value === undefined && name.startsWith('flight') && !scenario.covered)
        failed.push(`${name} not measured: no flight`)
      else if (value != null && value > limits[name])
        failed.push(`${name} ${value} > ${limits[name]}`)
    }
    results.push({ scenario: scenario.name, ...shape, failed })
  }
  await finish(
    browserName,
    { claims: 'transitions.json', traces: 'transition-traces.json' },
    results,
    traces,
  )
})

// The ambient glow behind the photo. A third recorder reads, on every frame, the drawn opacity
// of the backdrop, every glow layer (`data-np-glow` names its photo) and where each slide's
// photo is drawn. A glow layer's weight is what it adds to the mix: its opacity times what the
// layers above it leave through.

type GlowFrame = {
  t: number
  backdrop: number | null
  /** Weight of each photo's glow in the mix, by photo index; `alpha` is the whole glow's. */
  weights: Record<string, number>
  alpha: number
  /** Each slide's photo centre, by index, and the media area's centre. */
  centres: Record<string, number>
  middle: number
}
type GlowTrace = {
  frames: GlowFrame[]
  /** The main-thread block after a release: is the incoming glow on a running opacity
   * animation, and how far its clock moved from the block's frame to the next. */
  block: { animated: boolean; advancedMs: number } | null
  blockFrom: number | null
  blockTo: number | null
}

async function recordGlow(page: Page, incoming: number, blockAfterReleaseMs = 0) {
  await page.evaluate(
    ({ incoming, blockAfterReleaseMs }) => {
      const rec: GlowTrace = { frames: [], block: null, blockFrom: null, blockTo: null }
      let running = true
      let released = false
      let blocked = false
      let afterBlock: { animation: Animation; from: number } | null = null
      window.addEventListener('pointerup', () => (released = true), { capture: true })
      const drawn = (element: Element) => {
        let opacity = 1
        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node)
          if (style.display === 'none' || style.visibility === 'hidden') return 0
          opacity *= Number(style.opacity)
        }
        return opacity
      }
      const layers = () =>
        [...document.querySelectorAll<HTMLElement>('[data-np-ambient] canvas')]
          .map((canvas, order) => ({
            canvas,
            order,
            z: Number.parseInt(getComputedStyle(canvas).zIndex) || 0,
          }))
          .sort((a, b) => a.z - b.z || a.order - b.order)
      const glowAnimation = () => {
        const canvas = document.querySelector(
          `[data-np-ambient] canvas[data-np-glow="${incoming}"]`,
        )
        return canvas
          ?.getAnimations()
          .find(
            (animation) =>
              animation.playState === 'running' &&
              (animation.effect as KeyframeEffect)
                .getKeyframes()
                .some((key) => key.opacity != null),
          )
      }
      const read = (t: number) => {
        const backdrop = document.querySelector('[data-np-motion="backdrop"]')
        const weights: Record<string, number> = {}
        let through = 1
        for (const { canvas } of layers().reverse()) {
          const opacity = Number(getComputedStyle(canvas).opacity)
          const id = canvas.getAttribute('data-np-glow') ?? '?'
          weights[id] = (weights[id] ?? 0) + opacity * through
          through *= 1 - opacity
        }
        const centres: Record<string, number> = {}
        for (const slide of document.querySelectorAll('[data-np-slide]')) {
          const frame = slide.querySelector('[data-np-slide-frame]')
          if (!frame) continue
          const box = frame.getBoundingClientRect()
          centres[slide.getAttribute('data-np-slide')!] = (box.left + box.right) / 2
        }
        const media = document.querySelector('.np-lightbox__media')?.getBoundingClientRect()
        const entry: GlowFrame = {
          t,
          backdrop: backdrop ? drawn(backdrop) : null,
          weights,
          alpha: 1 - through,
          centres,
          middle: media ? (media.left + media.right) / 2 : 0,
        }
        if (rec.frames.at(-1)?.t === t) rec.frames[rec.frames.length - 1] = entry
        else rec.frames.push(entry)
      }
      const nativeFrame = window.requestAnimationFrame.bind(window)
      let tickAt = -1
      window.requestAnimationFrame = (callback) =>
        nativeFrame((t) => {
          callback(t)
          if (running && t === tickAt) read(t)
        })
      const track = () => document.querySelector('[data-np-slide]')?.parentElement
      const tick = (t: number) => {
        if (!running) return
        tickAt = t
        read(t)
        // Block once the settle's clock runs: in the frame after its first.
        const settling = track()
          ?.getAnimations()
          .some((animation) => animation.playState === 'running' && animation.startTime != null)
        if (blockAfterReleaseMs && released && !blocked && settling) {
          blocked = true
          const animation = glowAnimation()
          const from = Number(animation?.currentTime ?? 0)
          rec.blockFrom = performance.now()
          const until = performance.now() + blockAfterReleaseMs
          while (performance.now() < until) {
            // The slow frame.
          }
          rec.blockTo = performance.now()
          rec.block = {
            animated: !!animation && animation.playState === 'running',
            advancedMs: 0,
          }
          // A page's clock does not move inside a task; the next frame shows how far it ran.
          if (animation) afterBlock = { animation, from }
        } else if (afterBlock && rec.block) {
          rec.block.advancedMs = Number(afterBlock.animation.currentTime ?? 0) - afterBlock.from
          afterBlock = null
        }
        nativeFrame(tick)
      }
      nativeFrame(tick)
      ;(window as unknown as { __stopGlow: () => GlowTrace }).__stopGlow = () => {
        running = false
        window.requestAnimationFrame = nativeFrame
        return rec
      }
    },
    { incoming, blockAfterReleaseMs },
  )
}

const stopGlow = (page: Page) =>
  page.evaluate(() => (window as unknown as { __stopGlow: () => GlowTrace }).__stopGlow())

/**
 * A swipe or a key: the incoming photo's glow weight against the share of the way the track
 * shows that photo, 0 one photo away and 1 at its place.
 */
function glowFollowClaims(trace: GlowTrace, incoming: number, from: number) {
  const key = String(incoming)
  const frames = trace.frames.filter(
    (frame) => frame.centres[key] !== undefined && frame.centres[String(from)] !== undefined,
  )
  const first = frames[0]
  if (!first) return { glowFollowMax: null }
  // One photo's travel: the distance between the two photos' centres.
  const travel = Math.abs(first.centres[key]! - first.centres[String(from)]!) || 1
  const share = (frame: GlowFrame) =>
    Math.min(1, Math.max(0, 1 - Math.abs(frame.centres[key]! - frame.middle) / travel))
  const weight = (frame: GlowFrame) => frame.weights[key] ?? 0
  // Both in shares of the way: the photo moved, the glow changed, by more than 0.1%.
  const moved = (index: number) =>
    index > 0 && Math.abs(share(frames[index]!) - share(frames[index - 1]!)) > 0.001
  const firstMove = frames.findIndex((_, index) => moved(index))
  const lastMove = frames.findLastIndex((_, index) => moved(index))
  const changed = (index: number) =>
    index > 0 && Math.abs(weight(frames[index]!) - weight(frames[index - 1]!)) > 0.001
  const firstChange = frames.findIndex((_, index) => changed(index))
  const lastChange = frames.findLastIndex((_, index) => changed(index))
  let followMax = 0
  let extraStep = 0
  for (let index = Math.max(1, firstMove); index < frames.length; index++) {
    const frame = frames[index]!
    const before = frames[index - 1]!
    if (index <= lastMove + 1)
      followMax = Math.max(followMax, Math.abs(weight(frame) - share(frame)))
    extraStep = Math.max(
      extraStep,
      Math.abs(weight(frame) - weight(before) - (share(frame) - share(before))),
    )
  }
  return {
    glowFollowMax: firstMove < 0 ? null : round(followMax, 3),
    glowStartLagFrames: firstMove < 0 || firstChange < 0 ? null : Math.abs(firstChange - firstMove),
    glowEndLagFrames: lastMove < 0 || lastChange < 0 ? null : Math.max(0, lastChange - lastMove),
    glowExtraStepMax: round(extraStep, 3),
    ...(trace.block && {
      glowStillInBlock: trace.block.animated && trace.block.advancedMs > 40 ? 0 : 1,
    }),
  }
}

/** Opens: the glow is whole in the first frame the backdrop shows. */
function glowShowClaims(trace: GlowTrace) {
  const lit = trace.frames.find((frame) => (frame.backdrop ?? 0) > 0.001)
  return { glowMissingAtStart: lit ? round(1 - lit.alpha, 3) : null }
}

const FOLLOW_CLAIMS = [
  'glowFollowMax',
  'glowStartLagFrames',
  'glowEndLagFrames',
  'glowExtraStepMax',
] as const

type GlowScenario = {
  name: string
  kind: 'swipe' | 'key' | 'open'
  path?: Scenario['path']
  /** The photo whose glow comes in, as an offset from the start photo. */
  incoming?: number
  blockAfterReleaseMs?: number
  judge: readonly (keyof typeof limits)[]
}

const glowScenarios: GlowScenario[] = [
  {
    name: 'glow: slow drag, next photo',
    kind: 'swipe',
    path: scenarios[1]!.path,
    incoming: 1,
    judge: FOLLOW_CLAIMS,
  },
  {
    name: 'glow: flick, next photo',
    kind: 'swipe',
    path: scenarios[2]!.path,
    incoming: 1,
    judge: FOLLOW_CLAIMS,
  },
  {
    name: 'glow: slow drag, settle back',
    kind: 'swipe',
    path: scenarios[0]!.path,
    incoming: 1,
    judge: FOLLOW_CLAIMS,
  },
  { name: 'glow: key, next photo', kind: 'key', incoming: 1, judge: FOLLOW_CLAIMS },
  {
    name: 'glow: swipe, blocked after the release',
    kind: 'swipe',
    path: ({ x, y, w }) => line([x + w * 0.25, y], [x - w * 0.25, y], 250),
    incoming: 1,
    blockAfterReleaseMs: 60,
    judge: [...FOLLOW_CLAIMS, 'glowStillInBlock'],
  },
  { name: 'glow: open by tap', kind: 'open', judge: ['glowMissingAtStart'] },
]

test('glow traces', async ({ page, browserName }) => {
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null
  const drive = cdp ? touchDriver(cdp) : mouseDriver(page)
  const results: Record<string, unknown>[] = []
  const traces: Record<string, GlowTrace> = {}
  for (const scenario of glowScenarios.filter((item) => !only || only.test(item.name))) {
    const incoming = START_INDEX + (scenario.incoming ?? 0)
    if (scenario.kind === 'open') {
      const target = await aim(page)
      await recordGlow(page, incoming)
      await openByTap(page, drive, target)
    } else {
      const centre = await open(page)
      await page.waitForTimeout(300)
      await recordGlow(page, incoming, scenario.blockAfterReleaseMs)
      if (scenario.kind === 'key') await page.keyboard.press('ArrowRight')
      else await perform(drive, scenario.path!(centre))
      await page.waitForTimeout(900)
    }
    const trace = await stopGlow(page)
    traces[scenario.name] = trace
    const shape: Record<string, number | null | undefined> =
      scenario.kind === 'open'
        ? glowShowClaims(trace)
        : glowFollowClaims(trace, incoming, START_INDEX)
    const failed: string[] = []
    for (const name of scenario.judge) {
      const value = shape[name]
      if (value == null) failed.push(`${name} not measured`)
      else if (value > limits[name]) failed.push(`${name} ${value} > ${limits[name]}`)
    }
    results.push({ scenario: scenario.name, ...shape, failed })
  }
  await finish(browserName, { claims: 'glow.json', traces: 'glow-traces.json' }, results, traces)
})
