import type { PhotoItem } from '../../core/index'

/** Build native-button activation bindings shared by photo recipes. */
export function createPhotoTriggerBindings(
  photo: PhotoItem,
  index: number,
  activate: () => void | Promise<void>,
  label = photo.alt || `View photo ${index + 1}`,
) {
  return {
    type: 'button' as const,
    'aria-label': label,
    onClick: activate,
  }
}
