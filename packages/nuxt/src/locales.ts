import templates from '../../vue/src/provide/photoLocaleTemplates'
import { findPhotoLocale, type PHOTO_LOCALES } from '../../vue/src/provide/labelTypes'
import type { NuxtPhotoOptions } from './options'

/** Serialize only languages reachable through this app's label config and i18n declarations. */
export function generatePhotoLocales(labels: NuxtPhotoOptions['labels'], i18nLocales?: unknown) {
  const locales = new Set<(typeof PHOTO_LOCALES)[number]>(['en'])
  if (typeof labels === 'string') locales.add(findPhotoLocale(labels) ?? 'en')
  else if (Array.isArray(i18nLocales)) {
    const declarations: readonly unknown[] = i18nLocales
    for (const locale of declarations) {
      const code =
        typeof locale === 'string'
          ? locale
          : locale && typeof locale === 'object' && 'code' in locale
            ? locale.code
            : undefined
      if (typeof code !== 'string') continue
      const supported = findPhotoLocale(code)
      if (supported) locales.add(supported)
    }
  }
  return `export default ${JSON.stringify(Object.fromEntries([...locales].map((locale) => [locale, templates[locale]])))}`
}
