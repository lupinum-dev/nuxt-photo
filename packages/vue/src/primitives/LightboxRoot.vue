<template>
  <Teleport v-if="ctx.isOpen.value" to="body">
    <div
      ref="rootRef"
      tabindex="-1"
      v-bind="$attrs"
      @keydown.capture="handleKeydownCapture"
    >
      <slot />
      <LightboxTransitionLayer />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLightboxInject } from '../lightbox/inject'
import LightboxTransitionLayer from '../internal/LightboxTransitionLayer.vue'

const ctx = useLightboxInject('LightboxRoot')

const rootRef = ref<HTMLElement | null>(null)
let restoreFocusEl: HTMLElement | null = null
let restoreSiblings: (() => void) | null = null

function isolatePageSiblings(root: HTMLElement) {
  restoreSiblings?.()

  const previous = new Map<
    HTMLElement,
    { inert: boolean; ariaHidden: string | null }
  >()
  const observer = new MutationObserver(() => {
    isolateCurrentSiblings()
  })

  function isolateElement(element: HTMLElement) {
    if (element === root || previous.has(element)) return
    previous.set(element, {
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    })
    element.inert = true
    element.setAttribute('aria-hidden', 'true')
  }

  function isolateCurrentSiblings() {
    for (const child of document.body.children) {
      if (child instanceof HTMLElement) {
        isolateElement(child)
      }
    }
  }

  isolateCurrentSiblings()
  observer.observe(document.body, { childList: true })

  restoreSiblings = () => {
    observer.disconnect()
    for (const [element, { inert, ariaHidden }] of previous) {
      element.inert = inert
      if (ariaHidden === null) {
        element.removeAttribute('aria-hidden')
      } else {
        element.setAttribute('aria-hidden', ariaHidden)
      }
    }
    restoreSiblings = null
  }
}

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
      if (rootRef.value) {
        isolatePageSiblings(rootRef.value)
      }
      rootRef.value?.focus()
      if (rootRef.value && document.activeElement !== rootRef.value) {
        const firstFocusable = getFocusableElements(rootRef.value)[0]
        firstFocusable?.focus()
      }
      return
    }

    const target = restoreFocusEl
    restoreFocusEl = null
    restoreSiblings?.()
    if (!target?.isConnected) return

    await nextTick()
    target.focus()
  },
)

onBeforeUnmount(() => {
  restoreFocusEl = null
  restoreSiblings?.()
})
</script>
