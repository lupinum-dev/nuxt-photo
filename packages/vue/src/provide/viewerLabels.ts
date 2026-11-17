// A named seam of the exports map: the Nuxt module points it at a catalog of the app's languages.
import templates from '@lupinum/vue-photo/locales/viewer'
import { EAGER_LABEL_KEYS, PHOTO_LABEL_KEYS, type PhotoLabels } from './labelTypes'
import { labelResolver, resolveEagerLabels } from './labels'

/** Labels only the viewer shows; the order maps `viewerLocaleTemplates`. */
const VIEWER_LABEL_KEYS = [
  'photoViewer',
  'previous',
  'next',
  'zoom',
  'fit',
  'close',
  'loadFailed',
  'download',
  'share',
  'fullscreen',
  'exitFullscreen',
] as const satisfies readonly (keyof PhotoLabels)[]

// Every label belongs to the eager part or the viewer part; a missing key fails the type check.
type Covered<Uncovered extends never> = Uncovered
export type AllLabelsCovered = Covered<
  Exclude<keyof PhotoLabels, (typeof EAGER_LABEL_KEYS)[number] | (typeof VIEWER_LABEL_KEYS)[number]>
>

const resolveViewerLabels = labelResolver(VIEWER_LABEL_KEYS, templates)

/** All labels in the public order. Only the viewer and `usePhotoLabels()` import this module. */
export function resolvePhotoLabels(language?: string): Readonly<PhotoLabels> {
  const parts: PhotoLabels = { ...resolveEagerLabels(language), ...resolveViewerLabels(language) }
  return Object.freeze(
    Object.fromEntries(PHOTO_LABEL_KEYS.map((key) => [key, parts[key]])),
  ) as unknown as PhotoLabels
}
