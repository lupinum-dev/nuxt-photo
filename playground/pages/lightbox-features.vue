<template>
  <main class="proof-page" :data-ready="ready">
    <h1>Lightbox feature checks</h1>
    <output data-testid="router-runs">{{ routerRuns }}</output>
    <output data-testid="middleware-runs">{{ middlewareRuns }}</output>
    <PhotoGroup ref="gallery" :photos="photos" :lightbox="options">
      <PhotoAlbum :photos="photos.slice(0, 6)" :layout="{ type: 'rows', targetRowHeight: 200 }" />
    </PhotoGroup>
    <button data-testid="open-middle" @click="gallery?.open(250)">Open photo 251 of 500</button>
    <section data-testid="second-gallery">
      <PhotoAlbum
        :photos="portraits"
        :lightbox="{ deepLink: 'portrait', transition: 'none', tools: ['download'] }"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import type { GalleryHandle, LightboxOptions } from '@lupinum/nuxt-photo/app'
import { demoPhotos } from 'nuxt-photo-demo'
import LightboxFeatureViewer from '../components/LightboxFeatureViewer.vue'

definePageMeta({ middleware: ['lightbox-proof'] })
const gallery = ref<GalleryHandle | null>(null)
const middlewareRuns = useState('lightbox-middleware-runs', () => 0)
const routerRuns = ref(0)
const ready = ref(false)
const router = useRouter()
let removeAfterEach: (() => void) | undefined
onNuxtReady(() => {
  removeAfterEach = router.afterEach(() => routerRuns.value++)
  ready.value = true
})
onBeforeUnmount(() => removeAfterEach?.())
const route = useRoute()
const options: LightboxOptions = {
  deepLink: route.query.link === 'off' ? false : true,
  ...(route.query.history === 'off' ? { history: false } : {}),
  transition: 'none',
  component: LightboxFeatureViewer,
  tools: ['download', 'share', 'fullscreen'],
}
const photos = Array.from({ length: 500 }, (_, index) => ({
  ...demoPhotos[index % demoPhotos.length]!,
  id: `feature-${index}`,
  alt: `Feature photo ${index}`,
}))
const portraits = demoPhotos.slice(0, 3).map((photo, index) => ({
  ...photo,
  id: `portrait-${index}`,
  src: index === 1 ? 'https://example.com/portrait.jpg' : photo.src,
}))
</script>

<style scoped>
.proof-page {
  padding: 120px 40px;
  max-width: 1100px;
  min-height: 1800px;
  margin: auto;
}
output {
  display: block;
}
section {
  margin-top: 40px;
}
</style>
