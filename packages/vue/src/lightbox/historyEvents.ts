type Handler = (event: PopStateEvent) => void
const handlers = new Set<Handler>()
let listening = false

/** Native Window events in Chromium use listener order, even with capture enabled. */
export function installLightboxHistoryListener() {
  if (typeof window === 'undefined' || listening) return
  window.addEventListener(
    'popstate',
    (event) => {
      for (const handler of handlers) handler(event)
    },
    true,
  )
  listening = true
}

export function listenLightboxHistory(handler: Handler) {
  installLightboxHistoryListener()
  handlers.add(handler)
  return () => handlers.delete(handler)
}

// Static Vue component imports also initialize the gate before app/router creation.
installLightboxHistoryListener()
