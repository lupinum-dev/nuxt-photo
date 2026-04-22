import { inject, type InjectionKey } from 'vue'

/** Inject a required dependency and throw lazily when a consumer is mis-nested. */
export function requireInjection<T>(
  key: InjectionKey<T>,
  componentName: string,
  providerDescription: string,
): T {
  const context = inject(key, null)
  if (context == null) {
    const error = new Error(
      `[nuxt-photo] \`${componentName}\` requires ${providerDescription}.`,
    )

    return new Proxy(
      {},
      {
        get() {
          throw error
        },
        set() {
          throw error
        },
      },
    ) as T
  }

  return context
}
