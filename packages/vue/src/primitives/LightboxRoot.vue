<template>
  <Teleport v-if="ctx.isOpen.value" :to="ctx.photoConfig.value.teleportTarget ?? 'body'">
    <!-- `open` keeps the server-rendered lightbox visible without JavaScript; on mount the
         dialog becomes modal (see `rootRef`). -->
    <dialog
      ref="rootRef"
      open
      tabindex="-1"
      data-np-lightbox-root
      :data-np-initial="ctx.initialOpening.value || undefined"
      :dir="ctx.direction.value"
      :data-np-navigation="ctx.navigationMode.value"
      :style="ctx.frameVars.value"
      v-bind="$attrs"
      @keydown.capture="handleKeydownCapture"
      @cancel="handleCancel"
      @close="handleBrowserClose"
    >
      <!-- A <dialog> cannot be the fullscreen element; this layer is. Without positioning it
           leaves the layout to the dialog, and :fullscreen makes it fill the screen. -->
      <div ref="surfaceRef" data-np-lightbox-surface>
        <slot />
        <LightboxTransitionLayer />
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { nextTick, ref, watch } from 'vue'
import { useLightboxInject } from '../lightbox/inject'
import LightboxTransitionLayer from '../internal/LightboxTransitionLayer.vue'
import { useAsyncErrorReporter } from '../internal/asyncErrors'

const ctx = useLightboxInject('LightboxRoot')
const reportAsyncError = useAsyncErrorReporter()

const rootRef = ref<HTMLDialogElement | null>(null)
const surfaceRef = ref<HTMLElement | null>(null)
watch(
  surfaceRef,
  (surface) => {
    ctx.rootRef.value = surface
  },
  { flush: 'sync' },
)
watch(
  rootRef,
  (dialog) => {
    // The browser makes the rest of the page inert and keeps focus inside. Removing `open`
    // and calling showModal() in the same task leaves no frame between the two states.
    if (dialog && !dialog.matches(':modal')) {
      dialog.removeAttribute('open')
      dialog.showModal()
    }
  },
  { flush: 'sync' },
)

let restoreFocusEl: HTMLElement | null = null

// Escape (and Android's back gesture) arrive as a close request: run the animated close.
function handleCancel(event: Event) {
  event.preventDefault()
  reportAsyncError('escape-close', ctx.close())
}

// A close request the page may not cancel (a repeated Escape without user activation)
// closes the dialog at once. Show it again so the engine's own close finishes visibly and
// releases the scroll lock and history entry.
function handleBrowserClose() {
  const dialog = rootRef.value
  if (!dialog?.isConnected || ctx.lifecycleStatus.value === 'closed') return
  dialog.showModal()
  if (ctx.lifecycleStatus.value !== 'closing') reportAsyncError('escape-close', ctx.close())
}

function handleKeydownCapture(event: KeyboardEvent) {
  // Keyboard users bring hidden controls back before moving focus into them.
  if (event.key !== 'Tab' || ctx.uiVisible.value) return
  event.preventDefault()
  ctx.uiVisible.value = true
}

function focusableTrigger(element: HTMLElement | null) {
  return element?.closest<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ?? null
}

watch(
  () => ctx.isOpen.value,
  async (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      restoreFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      rootRef.value?.focus({ preventScroll: true })
      return
    }

    // Return focus to the photo the person was looking at, not the one they opened.
    const activeId = ctx.activeId.value
    const target =
      (activeId === null ? null : focusableTrigger(ctx.thumbnailFor(activeId))) ?? restoreFocusEl
    restoreFocusEl = null
    if (!target?.isConnected) return

    await nextTick()
    target.focus({ preventScroll: true })
  },
  { immediate: true },
)
</script>
