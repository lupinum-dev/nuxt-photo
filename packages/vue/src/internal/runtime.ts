/* eslint-disable no-console */

type DebugChannel =
  | 'transitions'
  | 'gestures'
  | 'zoom'
  | 'slides'
  | 'images'
  | 'geometry'
  | 'rects'

export type DebugFlags = Record<DebugChannel, boolean> & { all: boolean }

export type DebugLogger = {
  flags: DebugFlags
  log: (channel: DebugChannel, ...args: unknown[]) => void
  warn: (channel: DebugChannel, ...args: unknown[]) => void
  table: (channel: DebugChannel, data: Record<string, unknown>) => void
  group: (channel: DebugChannel, label: string) => void
  groupEnd: (channel: DebugChannel) => void
}

const CHANNEL_COLORS: Record<DebugChannel, string> = {
  transitions: '#a78bfa',
  gestures: '#34d399',
  zoom: '#fbbf24',
  slides: '#60a5fa',
  images: '#2dd4bf',
  geometry: '#f87171',
  rects: '#fb923c',
}

export function createDebug(): DebugLogger {
  const flags: DebugFlags = {
    transitions: false,
    gestures: false,
    zoom: false,
    slides: false,
    images: false,
    geometry: false,
    rects: false,
    all: false,
  }

  function isEnabled(channel: DebugChannel): boolean {
    return flags.all || flags[channel]
  }

  function prefix(channel: DebugChannel): string[] {
    const color = CHANNEL_COLORS[channel]
    return [`%c[lightbox:${channel}]`, `color: ${color}; font-weight: bold`]
  }

  function log(channel: DebugChannel, ...args: unknown[]) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.log(fmt, style, ...args)
  }

  function warn(channel: DebugChannel, ...args: unknown[]) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.warn(fmt, style, ...args)
  }

  function table(channel: DebugChannel, data: Record<string, unknown>) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.log(fmt, style)
    console.table(data)
  }

  function group(channel: DebugChannel, label: string) {
    if (!isEnabled(channel)) return
    const [fmt, style] = prefix(channel)
    console.groupCollapsed(`${fmt} ${label}`, style)
  }

  function groupEnd(channel: DebugChannel) {
    if (!isEnabled(channel)) return
    console.groupEnd()
  }

  return { flags, log, warn, table, group, groupEnd }
}

export function devWarn(message: string, ...args: unknown[]) {
  const isProduction =
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
      ?.NODE_ENV === 'production'
  if (isProduction) return
  console.warn(`[nuxt-photo] ${message}`, ...args)
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function lockBodyScroll(locked: boolean): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (locked) {
    bodyScrollLockCount++
    if (bodyScrollLockCount === 1) {
      savedBodyOverflow = document.body.style.overflow
      savedBodyPaddingRight = document.body.style.paddingRight

      const scrollbarWidth = Math.max(
        0,
        window.innerWidth - document.documentElement.clientWidth,
      )
      const currentPaddingRight =
        Number.parseFloat(
          window.getComputedStyle(document.body).paddingRight,
        ) || 0

      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    }
    return
  }

  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow
    document.body.style.paddingRight = savedBodyPaddingRight
  }
}

let bodyScrollLockCount = 0
let savedBodyOverflow = ''
let savedBodyPaddingRight = ''

export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2
}

export async function animateNumber(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  easing = easeInOutCubic,
): Promise<void> {
  if (durationMs <= 0) {
    onUpdate(to)
    return
  }

  await new Promise<void>((resolve) => {
    const start = performance.now()

    function frame(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      onUpdate(from + (to - from) * easing(progress))

      if (progress < 1) {
        requestAnimationFrame(frame)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(frame)
  })
}

export class VelocityTracker {
  private readonly buffer: (VelocitySample | undefined)[] = new Array(32)
  private head = 0
  private count = 0

  constructor(private readonly windowMs = 120) {}

  reset() {
    this.head = 0
    this.count = 0
  }

  addSample(x: number, y: number, time: number) {
    this.buffer[this.head] = { time, x, y }
    this.head = (this.head + 1) % this.buffer.length
    if (this.count < this.buffer.length) this.count++
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.count < 2) return { vx: 0, vy: 0 }

    const newestSlot = (this.head - 1 + this.buffer.length) % this.buffer.length
    const newest = this.buffer[newestSlot]!
    const cutoff = newest.time - this.windowMs
    const startSlot =
      (this.head - this.count + this.buffer.length) % this.buffer.length
    let oldest = newest

    for (let i = 0; i < this.count; i++) {
      const slot = (startSlot + i) % this.buffer.length
      const sample = this.buffer[slot]!
      if (sample.time >= cutoff) {
        oldest = sample
        break
      }
    }

    const elapsed = newest.time - oldest.time
    if (elapsed < 1) return { vx: 0, vy: 0 }

    return {
      vx: (newest.x - oldest.x) / elapsed,
      vy: (newest.y - oldest.y) / elapsed,
    }
  }
}

type VelocitySample = { x: number; y: number; time: number }
