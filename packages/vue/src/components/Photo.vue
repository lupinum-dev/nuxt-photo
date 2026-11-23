<template>
  <figure
    v-if="resolvedPhoto"
    ref="thumbRef"
    class="np-photo"
    :class="ui?.root"
    v-bind="mergeProps(interactiveAttrs, $attrs)"
    :style="figureStyle"
  >
    <PhotoImage
      :photo="resolvedPhoto"
      context="thumb"
      :priority="priority"
      :sizes="imageSizes"
      class="np-photo__img"
      :class="ui?.img"
    />
    <figcaption v-if="resolvedPhoto.caption" class="np-photo__caption" :class="ui?.caption">
      {{ resolvedPhoto.caption }}
    </figcaption>
  </figure>
  <component :is="lightboxComponent" v-if="lightboxComponent && resolvedPhoto" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { ref, computed, onBeforeUnmount, watch, mergeProps, type VNodeChild } from 'vue'

import { useElementWidth } from '../composables/useElementWidth'
import { useGalleryModel } from '../gallery/model'
import PhotoImage from '../primitives/PhotoImage.vue'
import type { PhotoItem, ResolvedPhotoItem } from '../core/index'
import { photoAt, photoIndexOf } from '../core/photo/lookup'
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import type { InvalidPhotoPolicy, InvalidPhotosEvent } from '../core/photo/normalize'
import { useRecipePhotos } from './shared/useRecipePhotos'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { useEagerLabels } from '../provide/labels'
import type { PhotoUi } from '../types/ui'
import { useRecipeLightbox } from './shared/useRecipeLightbox'
import { useRecipeGroup } from './photo-group/usePhotoGroup'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /**
     * The photo to render. Needs a `src` and the real pixel `width` and `height`; `id` defaults to `src`.
     * Invalid data throws.
     */
    photo: PhotoItem<TMeta>
    /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
    active?: string | null
    ui?: PhotoUi<'Photo'>
    validation?: InvalidPhotoPolicy
    /**
     * `true` opens a one-photo lightbox; `lightbox.component` replaces the viewer. Ignored inside `PhotoGroup`, which
     * owns the lightbox. Read once at mount; change the component `key` to remount.
     */
    lightbox?: boolean | LightboxOptions
    /**
     * Inside a `PhotoGroup`, render a plain image that does not open the lightbox. The photo stays in
     * the group's navigation.
     */
    lightboxIgnore?: boolean
    /** Image provider object, or a Nuxt Image provider name. Wins over inherited config. */
    provider?: PhotoProvider | string
    /** Load eagerly with high fetch priority. @default false */
    priority?: boolean
    /**
     * The photo's width on screen as an HTML `sizes` value, such as
     * `(min-width: 768px) 720px, 100vw`. Set it when the photo is not full width. Without it, a
     * `priority` photo uses `100vw` and a lazy photo its measured width.
     */
    sizes?: string
  }>(),
  { lightbox: undefined },
)
const emit = defineEmits<{
  'update:active': [id: string | null]
  invalidPhotos: [event: InvalidPhotosEvent]
}>()
const slots = defineSlots<{
  slide?: (props: { photo: ResolvedPhotoItem<TMeta>; index: number }) => VNodeChild
}>()

const { group: parentGroup, options: recipeLightboxOptions } = useRecipeLightbox(
  'Photo',
  () => props.lightbox,
)

providePhotoConfig(() => ({
  provider: props.provider,
  validation: props.validation,
  lightbox: recipeLightboxOptions(),
}))

const normalizedPhotos = useRecipePhotos<TMeta>(
  () => [props.photo],
  'Photo',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)
const resolvedPhoto = computed(() => normalizedPhotos.value[0] ?? null)

const thumbRef = ref<HTMLElement | null>(null)
const { group, lightboxComponent } = useRecipeGroup<TMeta>({
  owner: 'Photo',
  photos: normalizedPhotos,
  root: () => thumbRef.value,
  lightbox: () => props.lightbox,
  defaultEnabled: false,
})

const { containerWidth } = useElementWidth(thumbRef)
// A priority image keeps its server-rendered sizes, so its preload and the image request
// the same file. Lazy images have not loaded yet and may use the measured width.
const imageSizes = computed(
  () =>
    props.sizes ??
    (!props.priority && containerWidth.value > 0 ? `${containerWidth.value}px` : '100vw'),
)

// `lightboxIgnore` is documented for photos inside a PhotoGroup only.
const ignored = computed(() => !!props.lightboxIgnore && !!parentGroup)
const isInteractive = computed(() => {
  const photo = resolvedPhoto.value
  return !!photo && group.enabled && group.hasPhoto(photo.id) && !ignored.value
})
const isHidden = computed(() => group.hiddenId.value === resolvedPhoto.value?.id)

const figureStyle = computed(() =>
  isInteractive.value
    ? { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
    : { margin: 0 },
)

function activate(source: HTMLElement | null) {
  return group.activate(resolvedPhoto.value!.id, source)
}

const labels = useEagerLabels()

const interactiveAttrs = computed(() => {
  if (!isInteractive.value || !resolvedPhoto.value) return {}
  return createPhotoTriggerBindings(
    resolvedPhoto.value,
    0,
    activate,
    resolvedPhoto.value.alt || labels.viewPhoto(1),
  )
})

// The group renders this photo's slide slot through its capability index.
const capabilityOwner = Symbol('Photo')

function registerWithGroup() {
  const photo = resolvedPhoto.value
  group.removeCapabilities(capabilityOwner)
  if (!photo || ignored.value) return
  group.replaceCapabilities(capabilityOwner, [
    {
      id: photo.id,
      renderSlide: slots.slide
        ? (slotProps) =>
            slots.slide?.({ ...slotProps, photo: slotProps.photo as ResolvedPhotoItem<TMeta> }) ??
            null
        : null,
    },
  ])
}

registerWithGroup()
watch(() => [resolvedPhoto.value?.id, props.lightboxIgnore], registerWithGroup)
onBeforeUnmount(() => group.removeCapabilities(capabilityOwner))

async function open(index = 0) {
  const photo = photoAt(normalizedPhotos.value, index)
  if (isInteractive.value) await group.activate(photo.id, thumbRef.value)
}
async function openById(id: string) {
  await open(photoIndexOf(normalizedPhotos.value, id))
}
async function close() {
  if (isInteractive.value) await group.close()
}
const isOpen = computed(
  () =>
    isInteractive.value && group.isOpen.value && group.activeId.value === resolvedPhoto.value?.id,
)
const { activeId, activePhoto } = useGalleryModel(
  'Photo',
  () => props.active,
  () => normalizedPhotos.value,
  {
    isOpen,
    activeId: computed(() => (isOpen.value ? (resolvedPhoto.value?.id ?? null) : null)),
    activePhoto: computed(() => (isOpen.value ? resolvedPhoto.value : null)),
    openById,
    close,
  },
  (id) => emit('update:active', id),
)
defineExpose({ open, openById, close, isOpen, activeId, activePhoto })
</script>
