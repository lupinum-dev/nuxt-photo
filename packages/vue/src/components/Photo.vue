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
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx && resolvedPhoto" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { ref, computed, onMounted, onBeforeUnmount, watch, mergeProps, type VNodeChild } from 'vue'

import { useElementWidth } from '../composables/useElementWidth'
import { useGalleryRuntime } from '../gallery/runtime'
import { useGalleryModel } from '../gallery/model'
import { provideLightbox } from '../composables/index'
import { PhotoImage } from '../primitives/index'
import type { PhotoItem } from '../core/index'
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import Lightbox from './Lightbox.vue'
import type { InvalidPhotoPolicy, InvalidPhotosEvent } from '../core/photo/normalize'
import { useRecipePhotos } from './shared/useRecipePhotos'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from './shared/photoTriggerBindings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { usePhotoLabels } from '../composables/usePhotoLabels'

import type { PhotoUi } from '../types/ui'
import { useRecipeLightbox } from './shared/useRecipeLightbox'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /**
     * The photo to render. Needs a stable `id`, a `src`, and the real pixel `width` and `height`.
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
     * `(min-width: 768px) 720px, 100vw`. Set it when the photo is not full width.
     * @default '100vw'
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
  slide?: (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild
}>()

const { group, options: recipeLightboxOptions } = useRecipeLightbox('Photo', () => props.lightbox)

const photoConfig = providePhotoConfig(() => ({
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

// Inject parent group context (null if none)
if (!group) useGalleryRuntime(normalizedPhotos, () => thumbRef.value)

// Global lightbox override
const injectedLightbox = photoConfig.value.lightbox.component ?? null

const soloLightboxComponent = !group
  ? resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, false)
  : null
// Standalone mode: lightbox capability set and no parent group.
const hasSoloProvider = soloLightboxComponent !== null
const isSolo = computed(() => hasSoloProvider)
if (!group)
  warnOnSetupOptionChanges('Photo', {
    lightbox: () =>
      typeof props.lightbox === 'object' ? (props.lightbox.component ?? true) : props.lightbox,
  })

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? provideLightbox(normalizedPhotos, undefined, (photo) => {
      if (
        (photo !== props.photo && String(photo.id) !== String(resolvedPhoto.value?.id)) ||
        !slots.slide
      )
        return null
      return (slotProps) => slots.slide?.(slotProps) ?? null
    })
  : null

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)
const { containerWidth } = useElementWidth(thumbRef)
// A priority image keeps its server-rendered sizes, so its preload and the image request
// the same file. Lazy images have not loaded yet and may use the measured width.
const imageSizes = computed(() =>
  props.sizes ?? (!props.priority && containerWidth.value > 0 ? `${containerWidth.value}px` : '100vw'),
)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value?.id === resolvedPhoto.value?.id)

// Group mode: the parent owns the canonical collection; this photo is a trigger.
const isGrouped = computed(() => {
  const photo = resolvedPhoto.value
  return !!photo && !!group && group.enabled && group.hasPhoto(photo.id) && !props.lightboxIgnore
})
const isInteractive = computed(() => !!resolvedPhoto.value && (isSolo.value || isGrouped.value))

const figureStyle = computed(() => {
  if (isSolo.value) {
    return {
      margin: 0,
      opacity: soloCtx && soloCtx.hiddenThumbnailIndex.value === 0 ? 0 : 1,
      cursor: 'pointer',
    }
  }
  if (isGrouped.value) {
    return { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
  }
  return { margin: 0 }
})

function handleClick() {
  return open()
}

const labels = usePhotoLabels()

const interactiveAttrs = computed(() => {
  if (!isInteractive.value || !resolvedPhoto.value) return {}
  return createPhotoTriggerBindings(
    resolvedPhoto.value,
    0,
    handleClick,
    resolvedPhoto.value.alt || labels.viewPhoto(1),
  )
})

// Capability registration with the parent group.
const id = Symbol()
const registered = ref(false)

function shouldRegisterWithGroup() {
  return resolvedPhoto.value && group && group.enabled && !props.lightboxIgnore && !isSolo.value
}

function unregisterFromGroup() {
  if (!group || !registered.value) return
  group.removeCapabilities(id)
  registered.value = false
}

function registerWithGroup() {
  const photo = resolvedPhoto.value
  if (!shouldRegisterWithGroup() || !photo) return
  group!.replaceCapabilities(id, [
    {
      id: photo.id,
      getThumbnailElement: () => thumbRef.value,
      renderSlide: slots.slide
        ? (slotProps) =>
            slots.slide?.({ ...slotProps, photo: slotProps.photo as PhotoItem<TMeta> }) ?? null
        : null,
    },
  ])
  registered.value = true
}

onMounted(() => {
  if (soloCtx) {
    soloCtx.setThumbnailRef(0)(thumbRef.value)
  }
})

registerWithGroup()

watch(
  () => [resolvedPhoto.value?.id, props.lightboxIgnore],
  () => {
    unregisterFromGroup()
    registerWithGroup()
  },
)

onBeforeUnmount(unregisterFromGroup)

async function open(index = 0) {
  const photo = resolvedPhoto.value
  if (index !== 0 || !photo)
    throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  if (isGrouped.value) return group!.activateById(photo.id, thumbRef.value)
  if (!soloCtx) return
  soloCtx.setThumbnailRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
async function openById(id: string) {
  if (id !== resolvedPhoto.value?.id)
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  await open()
}
async function close() {
  if (isGrouped.value) await group!.close()
  else await soloCtx?.close()
}
const isOpen = computed(() =>
  isGrouped.value
    ? !!group?.isOpen.value && group.activeId.value === resolvedPhoto.value?.id
    : (soloCtx?.isOpen.value ?? false),
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
