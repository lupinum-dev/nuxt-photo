<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type {
  LayoutOptions,
  PhotoAlbumPhotoProps,
} from '../../types'
import { computed } from 'vue'
import { round } from '../../utils/round'

const props = defineProps<PhotoAlbumPhotoProps>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function calcWidth(
  base: string,
  width: number,
  itemsCount: number,
  layoutOptions: LayoutOptions,
) {
  const gaps
    = layoutOptions.spacing * (itemsCount - 1) + 2 * layoutOptions.padding * itemsCount

  return `calc((${base} - ${gaps}px) / ${round(
    (layoutOptions.containerWidth - gaps) / width,
    5,
  )})`
}

function cssPhotoWidth() {
  return props.layoutOptions.layout !== 'rows'
    ? `calc(100% - ${2 * props.layoutOptions.padding}px)`
    : calcWidth(
        '100%',
        props.layout.width,
        props.layout.itemsCount,
        props.layoutOptions,
      )
}

const wrapperStyle = computed<CSSProperties>(() => {
  const marginBottom
    = props.layout.mode !== 'rows' && props.layout.positionIndex < props.layout.itemsCount - 1
      ? `${props.layoutOptions.spacing}px`
      : undefined

  return {
    appearance: 'none',
    background: 'none',
    border: 0,
    boxSizing: 'content-box',
    cursor: props.interactive ? 'zoom-in' : undefined,
    display: 'block',
    height: 'auto',
    marginBottom,
    padding: `${props.layoutOptions.padding}px`,
    textAlign: 'inherit',
    textDecoration: 'none',
    width: cssPhotoWidth(),
  }
})

const tagName = computed(() => (props.item.href ? 'a' : 'button'))

const tagAttrs = computed(() => {
  if (props.item.href) {
    return {
      href: props.item.href,
    }
  }

  return {
    'aria-current': props.interactive ? props.selected : undefined,
    'type': 'button',
  }
})

function handleClick(event: MouseEvent) {
  if (props.item.href && props.interactive) {
    event.preventDefault()
  }

  emit('click', event)
}
</script>

<template>
  <component
    :is="tagName"
    v-bind="tagAttrs"
    class="photo-album__photo-button"
    :class="photoClass"
    :style="wrapperStyle"
    data-slot="album-photo"
    @click="handleClick"
  >
    <PhotoImage v-bind="imageProps" />
  </component>
</template>
