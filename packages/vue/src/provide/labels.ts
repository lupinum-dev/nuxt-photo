import templates, { type PhotoLabelTemplates } from './photoLocaleTemplates'
import {
  PHOTO_LOCALES,
  PHOTO_LABEL_KEYS,
  PHOTO_LABEL_FUNCTION_KEYS,
  type PhotoLabels,
  type PhotoLocale,
} from './labelTypes'
export { PHOTO_LOCALES, type PhotoLabels, type PhotoLocale } from './labelTypes'

/** Resolve synchronously on use; unused locales need no label objects or template closures. */
export function resolvePhotoLabels(language?: string): Readonly<PhotoLabels> {
  const catalog: Readonly<Partial<Record<PhotoLocale, PhotoLabelTemplates>>> & {
    en: PhotoLabelTemplates
  } = templates
  const values = catalog[detectPhotoLocale(language)] ?? catalog.en
  // The exhaustive metadata and the 18-value tuple share the public label order.
  // Object.fromEntries cannot retain those per-key types.
  return Object.freeze(
    Object.fromEntries(
      PHOTO_LABEL_KEYS.map((key, position) => {
        const template = values[position]!
        return [
          key,
          !PHOTO_LABEL_FUNCTION_KEYS.includes(key)
            ? template
            : (index: number, count?: number) =>
                template.replaceAll('{index}', String(index)).replaceAll('{count}', String(count)),
        ]
      }),
    ) as unknown as PhotoLabels,
  )
}

export function detectPhotoLocale(language?: string): PhotoLocale {
  const code = (
    language ?? (typeof document === 'undefined' ? 'en' : document.documentElement.lang)
  )
    .toLowerCase()
    .split('-')[0]
  return PHOTO_LOCALES.find((locale) => locale === code) ?? 'en'
}
