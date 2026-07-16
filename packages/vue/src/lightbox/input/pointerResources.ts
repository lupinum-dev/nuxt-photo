import type { Ref } from 'vue'
import type { TrackedPointer } from './types'

/** Own active pointer records and browser pointer-capture resources. */
export function createPointerResources(mediaAreaRef: Ref<HTMLElement | null>) {
  const activePointers = new Map<number, TrackedPointer>()
  const capturedPointers = new Set<number>()

  function getPointerPair() {
    const pointers = Array.from(activePointers.values())
    if (pointers.length < 2) return null
    return [pointers[0]!, pointers[1]!] as const
  }

  function capture(id: number) {
    try {
      mediaAreaRef.value?.setPointerCapture(id)
      capturedPointers.add(id)
    } catch {
      // Pointer capture is best-effort; Safari can throw during cancelled sequences.
    }
  }

  function release(id: number) {
    try {
      mediaAreaRef.value?.releasePointerCapture(id)
    } catch {
      // Release is best-effort after the browser has already cancelled capture.
    } finally {
      capturedPointers.delete(id)
    }
  }

  function releaseAll() {
    for (const id of capturedPointers) release(id)
  }

  return {
    activePointers,
    capturedPointers,
    getPointerPair,
    capture,
    release,
    releaseAll,
  }
}

export function getPointerPairGeometry(pair: readonly [TrackedPointer, TrackedPointer]) {
  const [a, b] = pair
  const dx = b.clientX - a.clientX
  const dy = b.clientY - a.clientY
  return {
    distance: Math.hypot(dx, dy),
    center: {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    },
  }
}
