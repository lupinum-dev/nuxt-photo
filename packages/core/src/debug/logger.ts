import type { DebugChannel } from '../types'

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
  geometry: '#f87171',
  rects: '#fb923c',
}

/** Create a channel-aware debug logger whose output can be toggled at runtime. */
export function createDebug(): DebugLogger {
  const flags: DebugFlags = {
    transitions: false,
    gestures: false,
    zoom: false,
    slides: false,
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
