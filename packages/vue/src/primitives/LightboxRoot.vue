<template>
  <div v-if="props.photos !== undefined" v-bind="$attrs">
    <slot />
  </div>

  <Teleport v-else to="body">
    <div
      v-if="ctx.isOpen.value"
      ref="rootRef"
      tabindex="-1"
      v-bind="$attrs"
      @keydown.capture="handleKeydownCapture"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxProvider } from '../composables/useLightboxProvider'
import { useLightboxInject } from '../composables/useLightboxInject'
import type { LightboxTransitionOption } from '../composables/useLightboxContext'

const props = defineProps<{
  photos?: PhotoItem | PhotoItem[]
  transition?: LightboxTransitionOption
  minZoom?: number
}>()

const ctx =
  props.photos !== undefined
    ? useLightboxProvider(
        computed(() => props.photos as PhotoItem | PhotoItem[]),
        {
          transition: props.transition,
          minZoom: props.minZoom,
        },
      )
    : useLightboxInject('LightboxRoot')

const rootRef = ref<HTMLElement | null>(null)
let restoreFocusEl: HTMLElement | null = null

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) =>
      !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  )
}

function handleKeydownCapture(event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  const root = rootRef.value
  if (!root) return

  const focusables = getFocusableElements(root)
  if (focusables.length === 0) {
    event.preventDefault()
    root.focus()
    return
  }

  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey) {
    if (!active || active === first || active === root) {
      event.preventDefault()
      last.focus()
    }
    return
  }

  if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => ctx.isOpen.value,
  async (isOpen) => {
    if (isOpen) {
      restoreFocusEl =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      await nextTick()
      rootRef.value?.focus()
      if (rootRef.value && document.activeElement !== rootRef.value) {
        const firstFocusable = getFocusableElements(rootRef.value)[0]
        firstFocusable?.focus()
      }
      return
    }

    const target = restoreFocusEl
    restoreFocusEl = null
    if (!target?.isConnected) return

    await nextTick()
    target.focus()
  },
)

onBeforeUnmount(() => {
  restoreFocusEl = null
})
</script>
