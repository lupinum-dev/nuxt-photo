import type { ViewerState } from '../types'

export type ViewerAction =
  | { type: 'open'; activeId: string | number }
  | { type: 'opened' }
  | { type: 'close' }
  | { type: 'closed' }
  | { type: 'setActive'; activeId: string | number }

/**
 * Pure state machine for the viewer lifecycle.
 * Returns the next state given a current state and action.
 */
export function viewerTransition(
  state: ViewerState,
  action: ViewerAction,
): ViewerState {
  switch (action.type) {
    case 'open':
      if (state.status === 'closed') {
        return { status: 'opening', activeId: action.activeId }
      }
      // Allow re-open if already open (switch to different item)
      if (state.status === 'open') {
        return { status: 'open', activeId: action.activeId }
      }
      return state

    case 'opened':
      if (state.status === 'opening') {
        return { status: 'open', activeId: state.activeId }
      }
      return state

    case 'close':
      if (state.status === 'open' || state.status === 'opening') {
        return { status: 'closing', activeId: state.activeId }
      }
      return state

    case 'closed':
      if (state.status === 'closing') {
        return { status: 'closed' }
      }
      return state

    case 'setActive':
      if (state.status === 'open') {
        return { status: 'open', activeId: action.activeId }
      }
      return state

    default:
      return state
  }
}

export function createViewerState(): ViewerState {
  return { status: 'closed' }
}

export function isViewerOpen(state: ViewerState): boolean {
  return state.status === 'open' || state.status === 'opening'
}

export function getActiveId(state: ViewerState): (string | number) | undefined {
  if ('activeId' in state) return state.activeId
  return undefined
}
