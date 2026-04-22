export function isDev(): boolean {
  return (
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
      ?.NODE_ENV !== 'production'
  )
}

export function devWarn(message: string, ...args: unknown[]) {
  if (!isDev()) return
  console.warn(`[nuxt-photo] ${message}`, ...args)
}
