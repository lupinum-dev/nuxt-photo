<template>
  <div ref="rootRef" style="display: contents" :class="ui?.root" v-bind="$attrs">
    <slot :photos="canonicalPhotos" :controller="controller" />
  </div>
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { provide, ref } from 'vue'
import { useGalleryModel } from '../gallery/model'
import type { LightboxProviderController } from '../provide/keys'
import type { InvalidPhotoPolicy, InvalidPhotosEvent, PhotoItem } from '../core/index'
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import { PhotoGroupContextKey } from './photo-group/context'
import { usePhotoGroup } from './photo-group/usePhotoGroup'
import type { PhotoUi } from '../types/ui'
import { useRecipePhotos } from './shared/useRecipePhotos'

defineOptions({ inheritAttrs: false })

defineSlots<{
  default?: (props: {
    photos: readonly PhotoItem<TMeta>[]
    controller: LightboxProviderController<TMeta>
  }) => unknown
}>()

const props = withDefaults(
  defineProps<{
    /**
     * All photos of the group in navigation order. Every descendant `Photo` or `PhotoAlbum` must
     * use photos from this list.
     */
    photos: readonly PhotoItem<TMeta>[]
    /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
    active?: string | null
    ui?: PhotoUi<'PhotoGroup'>
    /**
     * What to do with invalid photos: `'throw'` stops with an error, `'drop'` skips them and emits
     * `invalidPhotos`.
     * @default 'throw'
     */
    validation?: InvalidPhotoPolicy
    /** Image provider object, or a Nuxt Image provider name. Wins over inherited config. */
    provider?: PhotoProvider | string
    /**
     * `true` opens the built-in lightbox; `false` turns it off. Use `lightbox.component` to replace the viewer. Read once
     * at mount; change the component `key` to remount.
     * @default true
     */
    lightbox?: boolean | LightboxOptions
  }>(),
  { lightbox: undefined },
)

const emit = defineEmits<{
  'update:active': [id: string | null]
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

providePhotoConfig(() => ({
  provider: props.provider,
  lightbox: typeof props.lightbox === 'object' ? props.lightbox : undefined,
  validation: props.validation,
}))

const canonicalPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoGroup',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)
const rootRef = ref<HTMLElement | null>(null)
const { context, lightboxComponent, open, controller } = usePhotoGroup<TMeta>({
  owner: 'PhotoGroup',
  photos: canonicalPhotos,
  root: () => rootRef.value,
  lightbox: () => props.lightbox,
  defaultEnabled: true,
})
provide(PhotoGroupContextKey, context)

const { activeId, activePhoto } = useGalleryModel(
  'PhotoGroup',
  () => props.active,
  () => canonicalPhotos.value,
  context,
  (id) => emit('update:active', id),
)
const { openById, close, isOpen } = context

defineExpose({ open, openById, close, isOpen, activeId, activePhoto })
</script>
