<script setup lang="ts">
import {
  PhotoImage,
  type ImageAdapter,
  type ImageContext,
  type PhotoItem,
} from '@nuxt-photo/nuxt/app'
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import pipelineThumbnail from '~/assets/photos/desert-light-480.jpg'
import pipelineSlide from '~/assets/photos/desert-light-960.jpg'
import { demoPhotos } from '~/composables/demoPhotos'

type Mode = 'native' | 'custom'

const defaults = Object.freeze({
  mode: 'native' as Mode,
  context: 'thumb' as ImageContext,
  quality: 80,
})
const radioId = useId()
const adapterGroup = `${radioId}-adapter`
const contextGroup = `${radioId}-context`
const mode = ref<Mode>(defaults.mode)
const context = ref<ImageContext>(defaults.context)
const quality = ref(defaults.quality)
const rendered = ref<Record<string, string | null>>({})
const preview = ref<HTMLElement | null>(null)
const sourcePhoto = demoPhotos[0]!
const photo: PhotoItem = {
  ...sourcePhoto,
  thumbSrc: pipelineThumbnail,
  srcset: [`${pipelineSlide} 960w`, `${sourcePhoto.src} 1280w`].join(', '),
}
const nativeAdapter: ImageAdapter = (item, imageContext) => {
  const usesThumbnailSource = imageContext === 'thumb' && Boolean(item.thumbSrc)

  return {
    src: usesThumbnailSource ? item.thumbSrc! : item.src,
    srcset: usesThumbnailSource ? undefined : item.srcset,
    width: item.width,
    height: item.height,
  }
}

const customAdapter: ImageAdapter = (item, imageContext) => {
  const widths = imageContext === 'thumb' ? [320, 640] : [960, 1280]
  const src = imageContext === 'thumb' ? (item.thumbSrc ?? item.src) : item.src
  const separator = src.includes('?') ? '&' : '?'
  const url = (width: number) => `${src}${separator}w=${width}&q=${quality.value}&format=webp`

  return {
    src: url(widths[0]!),
    srcset: widths.map((width) => `${url(width)} ${width}w`).join(', '),
    sizes: imageContext === 'thumb' ? '(min-width: 960px) 420px, 100vw' : '100vw',
    width: item.width,
    height: item.height,
  }
}

const adapter = computed(() => (mode.value === 'native' ? nativeAdapter : customAdapter))
const scriptClose = '</' + 'script>'
const photoCode = `const photo: PhotoItem = {
  id: 'desert-light',
  src: '/photos/desert-light-1280.jpg',
  thumbSrc: '/photos/desert-light-480.jpg',
  srcset: [
    '/photos/desert-light-960.jpg 960w',
    '/photos/desert-light-1280.jpg 1280w',
  ].join(', '),
  width: 1280,
  height: 800,
  alt: 'Desert landscape at golden hour',
}`
const code = computed(() => {
  if (mode.value === 'native') {
    return `<script setup lang="ts">
import { PhotoImage, type ImageAdapter, type PhotoItem } from '@nuxt-photo/nuxt/app'

${photoCode}

const nativeAdapter: ImageAdapter = (photo, context) => {
  if (context === 'thumb' && photo.thumbSrc) {
    return {
      src: photo.thumbSrc,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: photo.src,
    srcset: photo.srcset,
    width: photo.width,
    height: photo.height,
  }
}
${scriptClose}

<template>
  <PhotoImage :photo="photo" context="${context.value}" :image-adapter="nativeAdapter" />
</template>`
  }

  return `<script setup lang="ts">
import { PhotoImage, type ImageAdapter, type PhotoItem } from '@nuxt-photo/nuxt/app'

${photoCode}

const imageAdapter: ImageAdapter = (photo, context) => {
  const widths = context === 'thumb' ? [320, 640] : [960, 1280]
  const src = context === 'thumb' ? (photo.thumbSrc ?? photo.src) : photo.src
  const separator = src.includes('?') ? '&' : '?'
  const url = (width: number) =>
    \`\${src}\${separator}w=\${width}&q=${quality.value}&format=webp\`

  return {
    src: url(widths[0]),
    srcset: widths.map((width) => \`\${url(width)} \${width}w\`).join(', '),
    sizes: context === 'thumb' ? '(min-width: 960px) 420px, 100vw' : '100vw',
    width: photo.width,
    height: photo.height,
  }
}
${scriptClose}

<template>
  <PhotoImage :photo="photo" context="${context.value}" :image-adapter="imageAdapter" />
</template>`
})

async function inspect() {
  await nextTick()
  const image = preview.value?.querySelector('img')
  rendered.value = {
    src: image?.getAttribute('src') ?? null,
    srcset: image?.getAttribute('srcset') ?? null,
    sizes: image?.getAttribute('sizes') ?? null,
    width: image?.getAttribute('width') ?? null,
    height: image?.getAttribute('height') ?? null,
  }
}

watch([mode, context, quality], inspect, { flush: 'post' })
onMounted(inspect)

function reset() {
  mode.value = defaults.mode
  context.value = defaults.context
  quality.value = defaults.quality
}
</script>

<template>
  <InteractiveExample
    title="Inspect the image adapter"
    description="Compare the native fallback with a deterministic custom CDN adapter."
    @reset="reset"
  >
    <div ref="preview" class="image-pipeline-preview">
      <PhotoImage
        :key="`${mode}-${context}-${quality}`"
        :photo="photo"
        :context="context"
        :image-adapter="adapter"
      />
    </div>
    <template #controls>
      <fieldset class="docs-control">
        <legend>Adapter</legend>
        <label
          ><input v-model="mode" type="radio" :name="adapterGroup" value="native" /><span
            >Native</span
          ></label
        >
        <label
          ><input v-model="mode" type="radio" :name="adapterGroup" value="custom" /><span
            >Custom CDN</span
          ></label
        >
      </fieldset>
      <fieldset class="docs-control">
        <legend>Image context</legend>
        <label
          ><input v-model="context" type="radio" :name="contextGroup" value="thumb" /><span
            >Thumbnail</span
          ></label
        >
        <label
          ><input v-model="context" type="radio" :name="contextGroup" value="slide" /><span
            >Lightbox slide</span
          ></label
        >
      </fieldset>
      <label v-if="mode === 'custom'" class="docs-control docs-control--stacked">
        <span
          >Quality <output>{{ quality }}</output></span
        >
        <input
          v-model.number="quality"
          type="range"
          min="40"
          max="100"
          step="5"
          aria-label="Image quality"
        />
      </label>
      <p class="docs-control-note">
        Nuxt Image is a module-level provider. Configure it in <code>nuxt.config.ts</code> rather
        than simulating it in this runtime preview.
      </p>
      <p v-if="mode === 'custom'" class="docs-control-note">
        Custom mode demonstrates deterministic URL and attribute generation. The local asset server
        does not perform the requested CDN transformation.
      </p>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state><DemoState :value="{ adapter: mode, context, quality, rendered }" /></template>
  </InteractiveExample>
</template>
