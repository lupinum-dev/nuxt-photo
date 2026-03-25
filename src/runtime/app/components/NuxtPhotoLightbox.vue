<!-- Headless lightbox view component that exposes programmatic control and render slots. -->
<script setup lang="ts">
import { useResizeObserver } from '../../utils/dom-helpers'
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import type {
  LightboxControlsSlotProps,
  LightboxItem,
  LightboxOptions,
  PhotoLightboxDOMBinding,
  PhotoPoint,
} from '../../types'
import { useBodyScrollLock } from '../composables/useBodyScrollLock'
import { usePhotoLightbox } from '../composables/usePhotoLightbox'

interface PhotoLightboxProps {
  items: readonly LightboxItem[]
  options?: LightboxOptions
  image?: import('../../types').ImageConfig
  teleportTo?: string | HTMLElement
  getThumbnailElement?: (index: number, item: LightboxItem) => HTMLElement | null | undefined
}

const props = withDefaults(defineProps<PhotoLightboxProps>(), {
  teleportTo: 'body',
})

const emit = defineEmits<{
  open: []
  close: []
  change: [index: number]
  destroy: []
}>()

defineSlots<{
  controls?: (props: LightboxControlsSlotProps) => unknown
  slide?: (props: {
    item: LightboxItem
    index: number
    slide: unknown
    isActive: boolean
  }) => unknown
}>()

const controller = usePhotoLightbox({
  image: toRef(props, 'image'),
  items: toRef(props, 'items'),
  options: () => props.options,
  getThumbnailElement: () => resolveThumbnailElement,
})
const state = controller.state

const rootRef = ref<HTMLDivElement>()
const bgRef = ref<HTMLDivElement>()
const scrollWrapRef = ref<HTMLDivElement>()
const containerRef = ref<HTMLDivElement>()
const holder0Ref = ref<HTMLDivElement>()
const holder1Ref = ref<HTMLDivElement>()
const holder2Ref = ref<HTMLDivElement>()
const bodyScrollLock = useBodyScrollLock()

function resolveThumbnailElement(index: number, item: LightboxItem) {
  return props.getThumbnailElement?.(index, item)
}

function getDOMBinding(): PhotoLightboxDOMBinding | undefined {
  if (
    !rootRef.value
    || !bgRef.value
    || !scrollWrapRef.value
    || !containerRef.value
    || !holder0Ref.value
    || !holder1Ref.value
    || !holder2Ref.value
  ) {
    return
  }

  return {
    element: rootRef.value,
    bg: bgRef.value,
    scrollWrap: scrollWrapRef.value,
    container: containerRef.value,
    itemHolders: [holder0Ref.value, holder1Ref.value, holder2Ref.value],
  }
}

controller.hooks.onOpen(() => {
  emit('open')
})

controller.hooks.onChange((index) => {
  if (typeof index === 'number') {
    emit('change', index)
  }
})

controller.hooks.onClose(() => {
  emit('close')
})

controller.hooks.onDestroy(() => {
  emit('destroy')
})

watch(
  () => state.isOpen.value,
  (isOpen) => {
    bodyScrollLock.setLocked(isOpen)
  },
  { immediate: true },
)

useResizeObserver(rootRef, () => {
  if (state.isOpen.value && state.transitionPhase.value !== 'closing') {
    controller.refreshLayout(true)
  }
})

const rootClasses = computed(() => {
  const classes = ['photo-lightbox']
  if (state.isOpen.value) classes.push('photo-lightbox--open')
  if (state.touchSupported.value) classes.push('photo-lightbox--touch')
  if (state.uiVisible.value) classes.push('photo-lightbox--ui-visible')
  if (state.hasMouse.value) classes.push('photo-lightbox--has-mouse')
  if (state.totalItems.value === 1) classes.push('photo-lightbox--one-slide')
  if (state.zoomAllowed.value) classes.push('photo-lightbox--zoom-allowed')
  if (state.isZoomedIn.value) classes.push('photo-lightbox--zoomed-in')
  if (
    state.zoomAllowed.value
    && (
      props.options?.imageClickAction === 'zoom'
      || props.options?.imageClickAction === 'zoom-or-close'
    )
  ) {
    classes.push('photo-lightbox--click-to-zoom')
  }
  return classes
})

const resolvedPublicOptions = computed<LightboxOptions | undefined>(() => ({
  ...(props.options ?? {}),
  loop: controller.options.value.loop,
}))

const controlSlotProps = computed<LightboxControlsSlotProps>(() => ({
  controller,
  state,
  options: resolvedPublicOptions.value,
  open,
  close,
  next: () => controller.next(),
  prev: () => controller.prev(),
  toggleZoom: () => controller.toggleZoom(),
  setUiVisible: (isVisible: boolean) => controller.setUiVisible(isVisible),
}))

function open(
  index?: number,
  overrideOptions?: LightboxOptions,
  sourceElement?: HTMLElement | null,
  initialPointerPos?: PhotoPoint | null,
) {
  const domBinding = getDOMBinding()
  if (!domBinding) {
    return false
  }

  return controller.open({
    domBinding,
    index,
    initialPointerPos,
    openSource: 'PhotoLightbox.vue',
    options: {
      ...(props.options || {}),
      ...(overrideOptions || {}),
    },
    sourceElement,
  })
}

function close() {
  controller.close()
}

function setUiVisible(isVisible: boolean) {
  controller.setUiVisible(isVisible)
}

onBeforeUnmount(() => {
  controller.destroy()
})

defineExpose({
  open,
  close,
  setUiVisible,
  controller,
  currIndex: state.currIndex,
  isOpen: state.isOpen,
})
</script>

<template>
  <Teleport :to="teleportTo">
    <div
      ref="rootRef"
      :class="rootClasses"
      tabindex="-1"
      role="dialog"
    >
      <div
        ref="bgRef"
        class="photo-lightbox__bg"
      />
      <section
        ref="scrollWrapRef"
        class="photo-lightbox__scroll-wrap"
        aria-roledescription="carousel"
      >
        <div
          id="photo-lightbox__items"
          ref="containerRef"
          class="photo-lightbox__container"
          aria-live="off"
        >
          <div
            ref="holder0Ref"
            class="photo-lightbox__item"
            role="group"
            aria-roledescription="slide"
          />
          <div
            ref="holder1Ref"
            class="photo-lightbox__item"
            role="group"
            aria-roledescription="slide"
          />
          <div
            ref="holder2Ref"
            class="photo-lightbox__item"
            role="group"
            aria-roledescription="slide"
          />
        </div>

        <slot
          name="controls"
          v-bind="controlSlotProps"
        />
      </section>

      <Teleport
        v-for="render in state.customSlideRenders.value"
        :key="`${state.sessionId.value}-${render.index}`"
        :to="render.target"
      >
        <slot
          name="slide"
          :item="render.item"
          :index="render.index"
          :slide="render.slide"
          :is-active="render.isActive"
        />
      </Teleport>
    </div>
  </Teleport>
</template>
