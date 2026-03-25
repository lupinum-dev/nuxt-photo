let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

export function lockBodyScroll(locked: boolean): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (locked) {
    previousBodyOverflow = document.body.style.overflow
    previousBodyPaddingRight = document.body.style.paddingRight

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    return
  }

  document.body.style.overflow = previousBodyOverflow
  document.body.style.paddingRight = previousBodyPaddingRight
}
