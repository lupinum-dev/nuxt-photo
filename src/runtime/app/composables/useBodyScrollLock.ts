import { onBeforeUnmount } from 'vue'

let activeLocks = 0
let originalOverflow = ''
let originalPaddingRight = ''

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getScrollbarGap(): number {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

export function useBodyScrollLock() {
  let isLocked = false

  function lock() {
    if (!isClient() || isLocked) {
      return
    }

    const { body } = document
    if (!body) {
      return
    }

    if (activeLocks === 0) {
      originalOverflow = body.style.overflow
      originalPaddingRight = body.style.paddingRight

      const scrollbarGap = getScrollbarGap()
      const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0

      body.style.overflow = 'hidden'

      if (scrollbarGap > 0) {
        body.style.paddingRight = `${computedPaddingRight + scrollbarGap}px`
      }
    }

    activeLocks += 1
    isLocked = true
  }

  function unlock() {
    if (!isClient() || !isLocked) {
      return
    }

    isLocked = false
    activeLocks = Math.max(0, activeLocks - 1)

    if (activeLocks > 0) {
      return
    }

    const { body } = document
    if (!body) {
      return
    }

    body.style.overflow = originalOverflow
    body.style.paddingRight = originalPaddingRight
    originalOverflow = ''
    originalPaddingRight = ''
  }

  function setLocked(locked: boolean) {
    if (locked) {
      lock()
      return
    }

    unlock()
  }

  onBeforeUnmount(() => {
    unlock()
  })

  return {
    setLocked,
  }
}
