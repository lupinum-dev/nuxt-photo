import { inject, type InjectionKey } from 'vue'

export function requireInjection<T>(
  key: InjectionKey<T>,
  componentName: string,
  providerDescription: string,
): T {
  const context = inject(key, null)
  if (context == null) {
    const error = new Error(`[nuxt-photo] \`${componentName}\` requires ${providerDescription}.`)

    return new Proxy({}, {
      get() {
        throw error
      },
      set() {
        throw error
      },
    }) as T
  }

  return context
}
