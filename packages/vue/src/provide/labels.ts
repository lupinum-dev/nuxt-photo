import { computed } from 'vue'
import { usePhotoConfig } from '../config'
// A named seam of the exports map: the Nuxt module points it at a catalog of the app's languages.
import templates from '@lupinum/vue-photo/locales/photo'
import {
  EAGER_LABEL_KEYS,
  findPhotoLocale,
  PHOTO_LABEL_FUNCTION_KEYS,
  type PhotoLabels,
  type PHOTO_LOCALES,
} from './labelTypes'
export { PHOTO_LOCALES, type PhotoLabels, type PhotoLocale } from './labelTypes'

type Locale = (typeof PHOTO_LOCALES)[number]
type Catalog = Readonly<Partial<Record<Locale, readonly string[]>>> & { en: readonly string[] }

/**
 * Build a resolver for one part of the labels. Each part has its own catalog module, so the
 * viewer's labels load with the viewer chunk. Resolves synchronously on use; unused locales need
 * no label objects or template closures.
 */
export function labelResolver<Key extends keyof PhotoLabels>(
  keys: readonly Key[],
  catalog: Catalog,
): (language?: string) => Readonly<Pick<PhotoLabels, Key>> {
  return (language) => {
    const values = catalog[detectPhotoLocale(language)] ?? catalog.en
    // Object.fromEntries cannot retain the per-key types.
    return Object.freeze(
      Object.fromEntries(
        keys.map((key, position) => {
          const template = values[position]!
          return [
            key,
            !PHOTO_LABEL_FUNCTION_KEYS.includes(key)
              ? template
              : (index: number, count?: number) =>
                  template
                    .replaceAll('{index}', String(index))
                    .replaceAll('{count}', String(count)),
          ]
        }),
      ),
    ) as Pick<PhotoLabels, Key>
  }
}

/** The labels a closed album or carousel shows. */
export const resolveEagerLabels = labelResolver(EAGER_LABEL_KEYS, templates)

/** Read each label lazily, retaining the reactive locale and per-key overrides. */
export function useLabels<Labels extends Partial<PhotoLabels>>(
  resolve: (language?: string) => Labels,
): Labels {
  const config = usePhotoConfig()
  const defaults = computed(() => resolve(config.value.labelLocale))
  return new Proxy(
    { ...defaults.value, ...config.value.labels },
    {
      get: (_target, key: keyof Labels & keyof PhotoLabels) => {
        const override = config.value.labels[key]
        return override === undefined ? defaults.value[key] : override
      },
    },
  )
}

/** Labels for code outside the viewer chunk, without the viewer's labels. */
export function useEagerLabels() {
  return useLabels(resolveEagerLabels)
}

export function detectPhotoLocale(language?: string) {
  return (
    findPhotoLocale(
      language ?? (typeof document === 'undefined' ? 'en' : document.documentElement.lang),
    ) ?? 'en'
  )
}
