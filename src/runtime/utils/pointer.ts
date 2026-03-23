import type { PhotoPoint } from '../types'

export function getInitialPointerPos(event?: MouseEvent): PhotoPoint | null {
  if (!event || (!event.clientX && !event.clientY)) {
    return null
  }
  return { x: event.clientX, y: event.clientY }
}
