import { inject, type InjectionKey } from 'vue'

/** Inject a required dependency and throw when a consumer is mis-nested. */
export function requireInjection<T>(
  key: InjectionKey<T>,
  componentName: string,
  providerDescription: string,
): T {
  const context = inject(key, null)
  if (context == null) {
    throw new Error(
      `[nuxt-photo] \`${componentName}\` requires ${providerDescription}.`,
    )
  }

  return context
}
