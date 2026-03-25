import { easeInOutCubic } from './easing'

export async function animateNumber(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing = easeInOutCubic,
): Promise<void> {
  if (duration <= 0 || from === to) {
    onUpdate(to)
    return
  }

  const start = performance.now()

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      onUpdate(from + (to - from) * easing(progress))

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(tick)
  })
}
