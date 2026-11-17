import type { LightboxOptions } from '../config'
import { listenLightboxHistory } from './historyEvents'
import { photoParam } from '../gallery/deepLink'

const MARKER = '__nuxtPhoto'
let sequence = 0
let traversal: Promise<void> = Promise.resolve()

export function photoURL(url: string, param: string, id: string | null) {
  const target = new URL(url)
  if (id === null) target.searchParams.delete(param)
  else target.searchParams.set(param, id)
  return target.href
}

/** A marked, same-router-entry detour. Browser input requests a close; it never writes gallery state. */
export function createLightboxHistory(options: {
  config: () => LightboxOptions
  ownsScreen: () => boolean
  requestClose: () => void
}) {
  let token: string | null = null
  let baseURL = ''
  let entryURL = ''
  let basePosition: unknown
  let baseMarker: unknown
  let pendingBack: (() => void) | null = null
  let stopListening: (() => void) | null = null
  let disposing = false

  /** No window to act on, or another lightbox owns the screen. */
  const inactive = () => typeof window === 'undefined' || !options.ownsScreen()

  function onPop(event: PopStateEvent) {
    if (!token || (!options.ownsScreen() && !pendingBack)) return
    // Only swallow our detour's return. A real route/page traversal belongs to the router.
    if (
      event.state?.[MARKER]?.token !== baseMarker ||
      event.state?.position !== basePosition ||
      window.location.href !== baseURL
    ) {
      // A concurrent page traversal must settle cleanup without swallowing router input.
      if (pendingBack) {
        token = null
        pendingBack()
        pendingBack = null
      }
      return
    }
    event.stopImmediatePropagation()
    token = null
    if (!disposing && !pendingBack) options.requestClose()
    pendingBack?.()
    pendingBack = null
  }

  function attach() {
    if (typeof window === 'undefined' || stopListening) return
    stopListening = listenLightboxHistory(onPop)
  }

  async function enter(id: string, fromInitialLink: boolean) {
    await traversal
    if (inactive()) return
    attach()
    if (!fromInitialLink && options.config().history !== false && !token) {
      token = `${Date.now()}-${++sequence}`
      baseURL = window.location.href
      basePosition = window.history.state?.position
      baseMarker = window.history.state?.[MARKER]?.token
      window.history.pushState({ ...window.history.state, [MARKER]: { token } }, '', baseURL)
    }
    navigate(id)
  }

  /** Put the photo `id` in the entry's address, or take it out with null. */
  function rewrite(id: string | null) {
    const param = photoParam(options.config().deepLink)
    if (param)
      window.history.replaceState(
        window.history.state,
        '',
        photoURL(window.location.href, param, id),
      )
    return param
  }

  function navigate(id: string) {
    if (inactive()) return
    rewrite(id)
    entryURL = window.location.href
  }

  function leave(): Promise<void> {
    if (inactive()) return Promise.resolve()
    if (pendingBack)
      return new Promise((resolve) => {
        const previous = pendingBack!
        pendingBack = () => {
          previous()
          resolve()
        }
      })
    if (
      token &&
      window.history.state?.[MARKER]?.token === token &&
      window.history.state?.position === basePosition &&
      window.location.href === entryURL
    ) {
      traversal = new Promise((resolve) => {
        pendingBack = resolve
        window.history.back()
      })
      return traversal
    }
    const hadEntry = token !== null
    token = null
    if (!hadEntry && window.location.href === entryURL) rewrite(null)
    return Promise.resolve()
  }

  function dispose() {
    disposing = true
    void leave().finally(() => {
      stopListening?.()
      stopListening = null
    })
  }
  return { enter, navigate, leave, dispose }
}
