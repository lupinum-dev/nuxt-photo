<script setup lang="ts">
import type { ImageAdapter } from '@nuxt-photo/nuxt/app'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { demoPhotos } from '~/composables/demoPhotos'

type Mode = 'native' | 'nuxt-image'
type Context = 'thumb' | 'slide'
const mode = ref<Mode>('native')
const context = ref<Context>('thumb')
const rendered = ref<Record<string, string | null>>({})
const preview = ref<HTMLElement | null>(null)
const photo = demoPhotos[0]!

const nativeAdapter: ImageAdapter = (item, imageContext) => ({
  src: imageContext === 'thumb' ? (item.thumbSrc ?? item.src) : item.src,
  srcset: item.srcset,
  sizes: imageContext === 'thumb' ? '(min-width: 900px) 420px, 100vw' : '100vw',
  width: item.width,
  height: item.height,
})

const adapter = computed(() =>
  mode.value === 'native' ? nativeAdapter : undefined,
)
const code = computed(() =>
  mode.value === 'native'
    ? `<PhotoImage :photo="photo" context="${context.value}" :image-adapter="nativeAdapter" />`
    : `<PhotoImage :photo="photo" context="${context.value}" />\n\n// The Nuxt module injects the configured @nuxt/image adapter.`,
)

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

watch([mode, context], inspect, { flush: 'post' })
onMounted(inspect)

function reset() {
  mode.value = 'native'
  context.value = 'thumb'
}
</script>

<template>
  <InteractiveExample
    title="Inspect the image pipeline"
    description="See the final attributes produced for thumbnail and lightbox contexts."
    @reset="reset"
  >
    <div ref="preview" class="image-pipeline-preview">
      <PhotoImage
        :key="`${mode}-${context}`"
        :photo="photo"
        :context="context"
        :image-adapter="adapter"
      />
    </div>
    <template #controls>
      <fieldset class="docs-control">
        <legend>Adapter</legend>
        <label
          ><input v-model="mode" type="radio" value="native" /><span
            >Native image</span
          ></label
        >
        <label
          ><input v-model="mode" type="radio" value="nuxt-image" /><span
            >Nuxt Image</span
          ></label
        >
      </fieldset>
      <fieldset class="docs-control">
        <legend>Context</legend>
        <label
          ><input v-model="context" type="radio" value="thumb" /><span
            >Thumbnail</span
          ></label
        >
        <label
          ><input v-model="context" type="radio" value="slide" /><span
            >Lightbox slide</span
          ></label
        >
      </fieldset>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state
      ><DemoState :value="{ adapter: mode, context, rendered }"
    /></template>
  </InteractiveExample>
</template>
