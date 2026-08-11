let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

/** Reference-counted body scroll ownership shared by every provider. */
export function lockBodyScroll(locked: boolean): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (locked) {
    lockCount++
    if (lockCount !== 1) return

    savedOverflow = document.body.style.overflow
    savedPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${padding + scrollbarWidth}px`
    return
  }

  lockCount = Math.max(0, lockCount - 1)
  if (lockCount !== 0) return
  document.body.style.overflow = savedOverflow
  document.body.style.paddingRight = savedPaddingRight
}
