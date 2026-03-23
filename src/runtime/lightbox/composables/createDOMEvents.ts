import type { DOMEventsInstance } from '../types'

export function createDOMEvents(): DOMEventsInstance {
  const pool: Array<{
    target: EventTarget
    type: string
    listener: EventListenerOrEventListenerObject
    passive?: boolean
  }> = []

  return {
    add(target, type, listener, passive) {
      if (!target) return
      target.addEventListener(type, listener, passive ? { passive: true } : undefined)
      pool.push({ target, type, listener, passive })
    },

    remove(target, type, listener) {
      if (!target) return
      target.removeEventListener(type, listener)
      const idx = pool.findIndex(
        e => e.target === target && e.type === type && e.listener === listener,
      )
      if (idx > -1) pool.splice(idx, 1)
    },

    removeAll() {
      pool.forEach(({ target, type, listener }) => {
        target.removeEventListener(type, listener)
      })
      pool.length = 0
    },
  }
}
