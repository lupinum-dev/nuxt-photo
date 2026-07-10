<template>
  <figure
    ref="thumbRef"
    class="np-photo"
    v-bind="{ ...$attrs, ...interactiveAttrs }"
    :style="figureStyle"
  >
    <PhotoImage
      :photo="photo"
      context="thumb"
      :image-adapter="imageAdapter"
      :loading="loading ?? 'lazy'"
      class="np-photo__img"
      :class="imgClass"
    />
    <figcaption
      v-if="photo.caption"
      class="np-photo__caption"
      :class="captionClass"
    >
      {{ photo.caption }}
    </figcaption>
  </figure>
  <component :is="soloLightboxComponent" v-if="isSolo && soloCtx" />
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  inject,
  onMounted,
  onBeforeUnmount,
  watch,
  useSlots,
  type Component,
} from 'vue'

defineOptions({ inheritAttrs: false })
import { useLightboxProvider } from '../composables/index'
import { PhotoImage } from '../primitives/index'
import { LightboxComponentKey } from '../provide/keys'
import type { PhotoItem, ImageAdapter } from '../core/index'
import type { LightboxTransitionOption } from '../core/index'
import Lightbox from './Lightbox.vue'
import { PhotoGroupContextKey } from '../context/photoGroup'
import { warnOnSetupOptionChanges } from './shared/staticOptionWarnings'

const props = defineProps<{
  photo: PhotoItem
  /** Opens a solo lightbox when this Photo is not inside a PhotoGroup */
  lightbox?: boolean | Component
  /** Opt this photo out of a parent PhotoGroup (renders as plain image) */
  lightboxIgnore?: boolean
  imageAdapter?: ImageAdapter
  /** Setup-time transition configuration for a standalone lightbox. */
  transition?: LightboxTransitionOption
  loading?: 'lazy' | 'eager'
  /** Extra classes for the inner img element */
  imgClass?: string
  /** Extra classes for the caption element */
  captionClass?: string
}>()
const slots = useSlots()

// Inject parent group context (null if none)
const group = inject(PhotoGroupContextKey, null)

// Global lightbox override
const injectedLightbox = inject(LightboxComponentKey, null)

// Standalone mode: lightbox prop set and no parent group
const hasSoloProvider = !group && !!props.lightbox && !props.lightboxIgnore
const isSolo = computed(() => hasSoloProvider)
warnOnSetupOptionChanges('Photo', {
  lightbox: () => props.lightbox,
  transition: () => props.transition,
  imageAdapter: () => props.imageAdapter,
})

// Solo lightbox context — only created when solo (outside group)
const soloCtx = isSolo.value
  ? useLightboxProvider(
      computed(() => props.photo),
      {
        transition: props.transition,
        imageAdapter: props.imageAdapter,
        resolveSlide: (photo) => {
          if (
            (photo !== props.photo &&
              String(photo.id) !== String(props.photo.id)) ||
            !slots.slide
          )
            return null
          return (slotProps) => slots.slide?.(slotProps) ?? null
        },
      },
    )
  : null

const soloLightboxComponent: Component = (() => {
  if (props.lightbox === true || props.lightbox === undefined) {
    return injectedLightbox ?? Lightbox
  }
  return (props.lightbox as Component) ?? Lightbox
})()

// Ref for the thumb element
const thumbRef = ref<HTMLElement | null>(null)

// Is this photo's thumb hidden during a transition?
const isHidden = computed(() => group?.hiddenPhoto.value === props.photo)

// Auto-group mode: inside a PhotoGroup with auto-collection
const isAutoGrouped = computed(
  () => !!group && group.enabled && !props.lightboxIgnore,
)
const isInteractive = computed(() => isSolo.value || isAutoGrouped.value)

const figureStyle = computed(() => {
  if (isSolo.value) {
    return {
      margin: 0,
      opacity: soloCtx && soloCtx.hiddenThumbnailIndex.value === 0 ? 0 : 1,
      cursor: 'pointer',
    }
  }
  if (isAutoGrouped.value) {
    return { margin: 0, opacity: isHidden.value ? 0 : 1, cursor: 'pointer' }
  }
  return { margin: 0 }
})

function handleClick() {
  if (isSolo.value) soloOpen()
  else if (isAutoGrouped.value) void group!.openById(props.photo.id)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    if (e.key === ' ') e.preventDefault()
    handleClick()
  }
}

const interactiveAttrs = computed(() => {
  if (!isInteractive.value) return {}
  return {
    role: 'button' as const,
    tabindex: 0,
    'aria-label': props.photo.alt || 'View photo',
    onClick: handleClick,
    onKeydown: handleKeydown,
  }
})

// Registration with parent group (auto mode only)
const id = Symbol()
const registered = ref(false)

function shouldRegisterWithGroup() {
  return group && group.enabled && !props.lightboxIgnore && !isSolo.value
}

function unregisterFromGroup() {
  if (!group || !registered.value) return
  group.unregister(id)
  registered.value = false
}

function registerWithGroup() {
  if (!shouldRegisterWithGroup()) return
  group!.register(
    id,
    props.photo,
    () => thumbRef.value,
    slots.slide ? (slotProps) => slots.slide?.(slotProps) ?? null : null,
  )
  registered.value = true
}

onMounted(() => {
  if (soloCtx) {
    soloCtx.setThumbnailRef(0)(thumbRef.value)
  }

  registerWithGroup()
})

watch(
  () => [props.photo, props.lightboxIgnore],
  () => {
    unregisterFromGroup()
    registerWithGroup()
  },
)

onBeforeUnmount(unregisterFromGroup)

async function soloOpen() {
  if (!soloCtx) return
  soloCtx.setThumbnailRef(0)(thumbRef.value)
  await soloCtx.open(0)
}
</script>
