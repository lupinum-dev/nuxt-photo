/** Build native-button activation bindings shared by photo recipes. */
export function createPhotoTriggerBindings(activate: () => void | Promise<void>, label: string) {
  return {
    type: 'button' as const,
    'aria-label': label,
    onClick: activate,
  }
}
