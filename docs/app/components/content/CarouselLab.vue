<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

const defaults = Object.freeze({
  loop: true,
  dragFree: false,
  slidesToScroll: 1,
  autoplay: false,
  thumbnails: true,
  dots: false,
  lightbox: true,
})
const loop = ref<boolean>(defaults.loop)
const dragFree = ref<boolean>(defaults.dragFree)
const slidesToScroll = ref<number>(defaults.slidesToScroll)
const autoplay = ref<boolean>(defaults.autoplay)
const thumbnails = ref<boolean>(defaults.thumbnails)
const dots = ref<boolean>(defaults.dots)
const lightbox = ref<boolean>(defaults.lightbox)
const prefersReducedMotion = ref(false)
let motionQuery: MediaQueryList | undefined
const setupKey = computed(() => (lightbox.value ? 'lightbox-on' : 'lightbox-off'))
const code = computed(
  () => `<PhotoCarousel
  :photos="photos"
  :options="{ loop: ${loop.value}, dragFree: ${dragFree.value}, slidesToScroll: ${slidesToScroll.value} }"
  :autoplay="${autoplay.value}"
  :show-thumbnails="${thumbnails.value}"
  :show-dots="${dots.value}"
  :lightbox="${lightbox.value}"
  slide-aspect="16/9"
/>`,
)

function updateMotionPreference(event: MediaQueryListEvent | MediaQueryList) {
  prefersReducedMotion.value = event.matches
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference(motionQuery)
  motionQuery.addEventListener('change', updateMotionPreference)
})

onBeforeUnmount(() => motionQuery?.removeEventListener('change', updateMotionPreference))

watch(prefersReducedMotion, (reduce) => {
  if (reduce) autoplay.value = false
})

function reset() {
  loop.value = defaults.loop
  dragFree.value = defaults.dragFree
  slidesToScroll.value = defaults.slidesToScroll
  autoplay.value = defaults.autoplay
  thumbnails.value = defaults.thumbnails
  dots.value = defaults.dots
  lightbox.value = defaults.lightbox
}
</script>

<template>
  <InteractiveExample
    title="Configure the carousel"
    description="Change the small library-owned option surface."
    @reset="reset"
  >
    <PhotoCarousel
      :key="setupKey"
      :photos="demoPhotos.slice(0, 8)"
      :options="{ loop, dragFree, slidesToScroll }"
      :autoplay="autoplay"
      :show-thumbnails="thumbnails"
      :show-dots="dots"
      :lightbox="lightbox"
      slide-aspect="16/9"
    />
    <template #controls>
      <label class="docs-control"><input v-model="loop" type="checkbox" /><span>Loop</span></label>
      <label class="docs-control"
        ><input v-model="dragFree" type="checkbox" /><span>Drag free</span></label
      >
      <label class="docs-control docs-control--stacked"
        ><span
          >Slides to scroll <output>{{ slidesToScroll }}</output></span
        ><input
          v-model.number="slidesToScroll"
          type="range"
          min="1"
          max="3"
          aria-label="Slides to scroll"
      /></label>
      <label class="docs-control"
        ><input v-model="autoplay" type="checkbox" :disabled="prefersReducedMotion" /><span
          >Autoplay<span v-if="prefersReducedMotion"> (reduced motion is active)</span></span
        ></label
      >
      <label class="docs-control"
        ><input v-model="thumbnails" type="checkbox" /><span>Thumbnails</span></label
      >
      <label class="docs-control"><input v-model="dots" type="checkbox" /><span>Dots</span></label>
      <label class="docs-control"
        ><input v-model="lightbox" type="checkbox" /><span>Enable lightbox</span></label
      >
      <p class="docs-control-note">
        Nuxt Photo does not gate autoplay automatically. Production code should read
        <code>prefers-reduced-motion</code> before enabling it.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState
        :value="{
          loop,
          dragFree,
          slidesToScroll,
          autoplay,
          thumbnails,
          dots,
          lightbox,
          prefersReducedMotion,
        }"
    /></template>
  </InteractiveExample>
</template>
