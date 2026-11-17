import type { ResolvedPhotoItem } from '../../core/index'

/**
 * Build the keyboard-accessible activation contract shared by photo recipes. The
 * `data-np-photo-id` mark lets the lightbox find the thumbnail by photo ID.
 */
export function createPhotoTriggerBindings(
  photo: ResolvedPhotoItem,
  index: number,
  activate: (source: HTMLElement | null) => void | Promise<void>,
  label = photo.alt || `View photo ${index + 1}`,
) {
  // The flight uses the marked element at or inside the one the visitor activated, so a
  // trigger may mark an inner box when its own box includes spacing.
  const source = (event: Event) =>
    findPhotoTrigger(event.currentTarget as HTMLElement | null, photo.id)
  return {
    role: 'button' as const,
    tabindex: 0,
    'aria-label': label,
    'data-np-photo-id': photo.id,
    onClick: (event: MouseEvent) => activate(source(event)),
    onKeydown(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      return activate(source(event))
    },
  }
}

/**
 * Find the first connected trigger for a photo at or inside `root`. Comparing the attribute
 * value instead of building a selector needs no escaping for IDs with quotes or brackets.
 */
export function findPhotoTrigger(root: HTMLElement | null | undefined, id: string) {
  if (!root?.isConnected) return null
  if (root.dataset.npPhotoId === id) return root
  for (const element of root.querySelectorAll<HTMLElement>('[data-np-photo-id]')) {
    if (element.dataset.npPhotoId === id) return element
  }
  return null
}
