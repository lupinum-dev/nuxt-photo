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
      `[nuxt-photo] \`${componentName}\` requires ${providerDescription}. ` +
        'Render it inside <LightboxProvider>, or inside a lightbox component passed to a ready-made component. ' +
        'See https://nuxt-photo.lupinum.com/docs/reference/primitives',
    )
  }

  return context
}
