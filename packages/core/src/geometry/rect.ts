import type { RectLike } from '../types'

export function isUsableRect(rect: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null): boolean {
  if (!rect) return false
  if (rect.width < 24 || rect.height < 24) return false
  if (rect.bottom < 0 || rect.right < 0) return false
  if (typeof window !== 'undefined') {
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false
  }
  return true
}

export function getLoopedIndex(index: number, length: number): number {
  return (index + length) % length
}

export function fitRect(container: RectLike, aspect: number): RectLike {
  let width = container.width
  let height = width / aspect

  if (height > container.height) {
    height = container.height
    width = height * aspect
  }

  return {
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
    width,
    height,
  }
}

export function flipTransform(from: RectLike, to: RectLike): string {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = from.width / to.width
  const sy = from.height / to.height
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

export function makeGhostBaseStyle(to: RectLike): Record<string, string> {
  return {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  }
}

export function rubberband(value: number, min: number, max: number): number {
  if (value < min) {
    return min + (value - min) * 0.2
  }

  if (value > max) {
    return max + (value - max) * 0.2
  }

  return value
}
