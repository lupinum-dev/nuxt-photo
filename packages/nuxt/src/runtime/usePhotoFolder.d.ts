import type { Ref } from 'vue'
import type { PhotoItem } from '@lupinum/vue-photo'
/** Read direct image files in public/<folder>; only this folder enters the Nuxt payload. */
export declare function usePhotoFolder(
  folder: string,
  options?: {
    /** Alt text keyed by filename without its extension. */
    alt?: Record<string, string>
    /** Captions keyed by filename without its extension. */
    caption?: Record<string, string>
    /** Filename order. @default 'name' */
    sort?: 'name' | 'name-desc'
  },
): Promise<Ref<PhotoItem[]>>
