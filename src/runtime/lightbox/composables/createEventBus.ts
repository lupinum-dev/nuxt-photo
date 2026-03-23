import { LightboxEvent } from '../types'

type EventCallback<T extends string = string> = (event: LightboxEvent<T>) => void

export function createEventBus() {
  const listeners = new Map<string, EventCallback[]>()

  function on<T extends string>(name: T, fn: EventCallback<T>): void {
    if (!listeners.has(name)) {
      listeners.set(name, [])
    }
    listeners.get(name)!.push(fn as EventCallback)
  }

  function off<T extends string>(name: T, fn: EventCallback<T>): void {
    const fns = listeners.get(name)
    if (fns) {
      listeners.set(name, fns.filter(f => f !== fn))
    }
  }

  function dispatch<T extends string>(
    name: T,
    details?: Record<string, unknown>,
  ): LightboxEvent<T> {
    const event = new LightboxEvent(name, details)
    dispatchEvent(event)
    return event
  }

  function dispatchEvent<T extends string>(event: LightboxEvent<T>): LightboxEvent<T> {
    listeners.get(event.type)?.forEach(fn => fn(event as LightboxEvent))
    return event
  }

  function removeAll(): void {
    listeners.clear()
  }

  function getListenerCount(name?: string): number {
    if (name) {
      return listeners.get(name)?.length || 0
    }

    let total = 0
    listeners.forEach((fns) => {
      total += fns.length
    })
    return total
  }

  function getListenerSummary(): Record<string, number> {
    const summary: Record<string, number> = {}
    listeners.forEach((fns, name) => {
      if (fns.length) {
        summary[name] = fns.length
      }
    })
    return summary
  }

  return { on, off, dispatch, dispatchEvent, removeAll, getListenerCount, getListenerSummary }
}

export type EventBus = ReturnType<typeof createEventBus>
