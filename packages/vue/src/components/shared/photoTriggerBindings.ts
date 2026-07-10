import type { PhotoItem } from '../../core/index'

/** Build the keyboard-accessible activation contract shared by photo recipes. */
export function createPhotoTriggerBindings(
  photo: PhotoItem,
  index: number,
  activate: () => void,
  label = photo.alt || `View photo ${index + 1}`,
) {
  return {
    role: 'button' as const,
    tabindex: 0,
    'aria-label': label,
    onClick: activate,
    onKeydown(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      activate()
    },
  }
}
