/** Return `true` when the current runtime is not in production mode. */
export function isDev(): boolean {
  return (
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
      ?.NODE_ENV !== 'production'
  )
}

/** Emit a namespaced warning only in development builds. */
export function devWarn(message: string, ...args: unknown[]) {
  if (!isDev()) return
  console.warn(`[nuxt-photo] ${message}`, ...args)
}
