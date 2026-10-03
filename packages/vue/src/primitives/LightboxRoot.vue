<template>
  <Teleport v-if="ctx.isOpen.value" to="body">
    <div
      ref="rootRef"
      tabindex="-1"
      data-np-lightbox-root
      :dir="ctx.direction.value"
      :data-np-navigation="ctx.navigationMode.value"
      :style="ctx.frameVars.value"
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

  const previous = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>()
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
      !el.matches('input[type="hidden"], :disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      !el.closest('[inert]') &&
      getComputedStyle(el).visibility !== 'hidden' &&
      getComputedStyle(el).visibility !== 'collapse' &&
      (el.checkVisibility?.() ?? el.getClientRects().length > 0),
  )
}

function focusableTrigger(element: HTMLElement | null) {
  return element?.closest<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ?? null
}

function handleKeydownCapture(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  // Keyboard users bring hidden controls back before moving focus into them.
  if (!ctx.uiVisible.value) {
    event.preventDefault()
    ctx.uiVisible.value = true
    return
  }

  const root = rootRef.value
  if (!root) return

  const focusables = getFocusableElements(root)
  if (focusables.length === 0) {
    event.preventDefault()
    root.focus()
    return
  }

  event.preventDefault()
  const activeIndex = focusables.findIndex((element) => element === document.activeElement)
  let nextIndex = event.shiftKey
    ? (activeIndex <= 0 ? focusables.length : activeIndex) - 1
    : (activeIndex + 1) % focusables.length
  const direction = event.shiftKey ? -1 : 1
  // A rendered candidate may still refuse focus. Try each candidate once
  // instead of leaving the next Tab aimed at the same unreachable element.
  for (let attempt = 0; attempt < focusables.length; attempt++) {
    const target = focusables[nextIndex]!
    target.focus()
    if (document.activeElement === target) return
    nextIndex = (nextIndex + direction + focusables.length) % focusables.length
  }
  root.focus()
}

watch(
  () => ctx.isOpen.value,
  async (isOpen) => {
    if (isOpen) {
      restoreFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
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

    // Return focus to the photo the person was looking at, not the one they opened.
    const target = focusableTrigger(ctx.getThumbElement(ctx.activeIndex.value)) ?? restoreFocusEl
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
