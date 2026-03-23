import { useEventListener } from '@vueuse/core'
import type { KeyboardInstance, LightboxInstance } from '../types'
import { specialKeyUsed } from '../utils/dom'

type KeydownAction = 'close' | 'next' | 'prev' | 'toggleZoom'

const KEYBOARD_ACTIONS: Record<KeydownAction, (lb: LightboxInstance) => void> = {
  close: lb => lb.close(),
  next: lb => lb.next(),
  prev: lb => lb.prev(),
  toggleZoom: lb => lb.toggleZoom(),
}

export function useKeyboard(lightbox: LightboxInstance): KeyboardInstance {
  let wasFocused = false
  const lastActiveElement = document.activeElement as HTMLElement | null

  function focusRoot(): void {
    if (!wasFocused && lightbox.element) {
      lightbox.element.focus()
      wasFocused = true
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (lightbox.isDestroying) return
    if (lightbox.dispatch('keydown', { originalEvent: e }).defaultPrevented) return
    if (specialKeyUsed(e)) return

    let keydownAction: KeydownAction | undefined
    let axis: 'x' | 'y' | undefined
    let isForward = false

    switch (e.key) {
      case 'Escape':
        if (lightbox.options.escKey) keydownAction = 'close'
        break
      case 'z':
        keydownAction = 'toggleZoom'
        break
      case 'ArrowLeft':
        axis = 'x'
        break
      case 'ArrowUp':
        axis = 'y'
        break
      case 'ArrowRight':
        axis = 'x'
        isForward = true
        break
      case 'ArrowDown':
        axis = 'y'
        isForward = true
        break
      case 'Tab':
        focusRoot()
        break
    }

    if (axis) {
      e.preventDefault()
      const { currSlide } = lightbox

      if (lightbox.options.arrowKeys && axis === 'x' && lightbox.getNumItems() > 1) {
        keydownAction = isForward ? 'next' : 'prev'
      }
      else if (currSlide && currSlide.currZoomLevel > currSlide.zoomLevels.fit) {
        currSlide.pan[axis] += isForward ? -80 : 80
        currSlide.panTo(currSlide.pan.x, currSlide.pan.y)
      }
    }

    if (keydownAction) {
      e.preventDefault()
      KEYBOARD_ACTIONS[keydownAction](lightbox)
    }
  }

  function onFocusIn(e: FocusEvent): void {
    if (lightbox.isDestroying) return
    const { template } = lightbox
    if (template && document !== e.target && template !== e.target && !template.contains(e.target as Node)) {
      template.focus()
    }
  }

  lightbox.on('bindEvents', () => {
    if (lightbox.options.trapFocus) {
      if (!lightbox.options.initialPointerPos) {
        focusRoot()
      }
      useEventListener(document, 'focusin', onFocusIn as EventListener)
    }
    useEventListener(document, 'keydown', onKeyDown as EventListener)
  })

  lightbox.on('destroy', () => {
    if (lightbox.options.returnFocus && lastActiveElement && wasFocused) {
      lastActiveElement.focus()
    }
  })

  return {}
}
