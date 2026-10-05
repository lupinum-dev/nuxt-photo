import { useAsyncData, useRequestFetch, useRuntimeConfig } from '#app'
import type { Ref } from 'vue'
import type { PhotoItem } from '@lupinum/vue-photo'

import type { usePhotoFolder as PublicUsePhotoFolder } from './usePhotoFolder.d'
import { trimFolderSlashes } from './trimFolderSlashes'

type FolderOptions = NonNullable<Parameters<typeof PublicUsePhotoFolder>[1]>
const warned = new Set<string>()
// Locale-independent ordering keeps payload keys and photo order equal in SSR and browsers.
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Only this folder travels through the payload; the full public manifest stays on the server. */
export async function usePhotoFolder(
  folder: string,
  options: FolderOptions = {},
): Promise<Ref<PhotoItem[]>> {
  const normalized = trimFolderSlashes(folder)
  const maps = (value?: Record<string, string>) =>
    Object.entries(value ?? {}).sort(([a], [b]) => compare(a, b))
  const key =
    'nuxt-photo:folder:' +
    JSON.stringify([normalized, options.sort ?? 'name', maps(options.alt), maps(options.caption)])
  const fetch = useRequestFetch()
  const baseURL = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  const { data } = await useAsyncData(
    key,
    async () => {
      const records = await fetch<PhotoItem[]>(baseURL + '/__nuxt_photo/folder', {
        query: { folder: normalized },
      })
      const photos = records
        .map((photo) => {
          const name = photo.id.split('/').at(-1)!
          return {
            ...photo,
            ...(options.alt && Object.hasOwn(options.alt, name) ? { alt: options.alt[name] } : {}),
            ...(options.caption && Object.hasOwn(options.caption, name)
              ? { caption: options.caption[name] }
              : {}),
          }
        })
        .sort((a, b) => compare(a.id, b.id) * (options.sort === 'name-desc' ? -1 : 1))
      if (
        import.meta.dev &&
        !warned.has(normalized) &&
        (!photos.length || photos.some((photo) => !photo.alt))
      ) {
        warned.add(normalized)
        console.warn(
          photos.length
            ? `[nuxt-photo] usePhotoFolder("${normalized}") contains photos without alt.`
            : `[nuxt-photo] usePhotoFolder("${normalized}") is empty or unknown.`,
        )
      }
      return photos
    },
    // A public mutable Ref must update recipes when callers append to its array.
    { default: () => [], deep: true },
  )
  return data
}
