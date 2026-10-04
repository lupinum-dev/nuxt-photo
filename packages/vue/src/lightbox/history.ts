import type { LightboxOptions } from '../config'
import { listenLightboxHistory } from './historyEvents'

const MARKER = '__nuxtPhoto'
let sequence = 0
let traversal: Promise<void> = Promise.resolve()

export function photoParam(option: LightboxOptions['deepLink']) {
  return option === true ? 'photo' : typeof option === 'string' ? option : null
}

export function initialPhotoId(url: string | undefined, option: LightboxOptions['deepLink']) {
  const param = photoParam(option)
  return url && param ? new URL(url, 'http://nuxt-photo.local').searchParams.get(param) : null
}

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
    if (typeof window === 'undefined' || !options.ownsScreen()) return
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

  function navigate(id: string) {
    if (typeof window === 'undefined' || !options.ownsScreen()) return
    const param = photoParam(options.config().deepLink)
    if (param)
      window.history.replaceState(
        window.history.state,
        '',
        photoURL(window.location.href, param, id),
      )
    entryURL = window.location.href
  }

  function leave(): Promise<void> {
    if (typeof window === 'undefined' || !options.ownsScreen()) return Promise.resolve()
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
    const param = photoParam(options.config().deepLink)
    if (!hadEntry && param && window.location.href === entryURL)
      window.history.replaceState(
        window.history.state,
        '',
        photoURL(window.location.href, param, null),
      )
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
