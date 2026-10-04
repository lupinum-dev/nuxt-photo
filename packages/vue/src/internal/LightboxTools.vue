<template>
  <template v-if="photo">
    <a
      v-if="tools.includes('download')"
      class="np-lightbox__btn"
      :href="photo.src"
      download
      :target="crossOrigin ? '_blank' : undefined"
      :rel="crossOrigin ? 'noopener' : undefined"
      :aria-label="labels.download"
      :title="labels.download"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" />
      </svg>
    </a>
    <button
      v-if="tools.includes('share') && shareSupported"
      class="np-lightbox__btn"
      type="button"
      :aria-label="labels.share"
      :title="labels.share"
      :disabled="ctx.transitionInProgress.value"
      @click="share"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" />
      </svg>
    </button>
    <button
      v-if="tools.includes('fullscreen') && fullscreenSupported"
      class="np-lightbox__btn"
      type="button"
      :aria-label="fullscreen ? labels.exitFullscreen : labels.fullscreen"
      :title="fullscreen ? labels.exitFullscreen : labels.fullscreen"
      :disabled="ctx.transitionInProgress.value"
      @click="toggleFullscreen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path v-if="fullscreen" d="M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5" />
        <path v-else d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
      </svg>
    </button>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useLightboxInject } from '../lightbox/inject'
import { usePhotoLabels } from '../composables/usePhotoLabels'
import { photoParam, photoURL } from '../lightbox/history'
import { useAsyncErrorReporter } from './asyncErrors'

const ctx = useLightboxInject('LightboxTools')
const labels = usePhotoLabels()
const reportAsyncError = useAsyncErrorReporter()
const ready = ref(false)
const fullscreen = ref(false)
const photo = ctx.activePhoto
const tools = computed(() => ctx.photoConfig.value.lightbox.tools ?? [])
const shareSupported = computed(() => ready.value && typeof navigator.share === 'function')
const fullscreenSupported = computed(
  () =>
    ready.value &&
    typeof ctx.rootRef.value?.requestFullscreen === 'function' &&
    typeof document.exitFullscreen === 'function' &&
    document.fullscreenEnabled !== false,
)
const crossOrigin = computed(
  () =>
    ready.value &&
    photo.value &&
    new URL(photo.value.src, location.href).origin !== location.origin,
)
function syncFullscreen() {
  fullscreen.value = document.fullscreenElement === ctx.rootRef.value
}
onMounted(() => {
  ready.value = true
  document.addEventListener('fullscreenchange', syncFullscreen)
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    document.removeEventListener('fullscreenchange', syncFullscreen)
})
function share() {
  const current = photo.value
  if (!current) return
  const param = photoParam(ctx.photoConfig.value.lightbox.deepLink)
  const url = param ? photoURL(location.href, param, current.id) : location.href
  reportAsyncError(
    'share',
    navigator.share({ title: current.alt ?? current.caption, url }).catch((error: unknown) => {
      if (!(error instanceof Error && error.name === 'AbortError')) throw error
    }),
  )
}
function toggleFullscreen() {
  const root = ctx.rootRef.value
  if (!root) return
  reportAsyncError(
    'fullscreen',
    document.fullscreenElement === root ? document.exitFullscreen() : root.requestFullscreen(),
  )
}
</script>
