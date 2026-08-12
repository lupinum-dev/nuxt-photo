<script setup lang="ts">
import { computed, ref, useId } from 'vue'

type CssMode = 'none' | 'structure' | 'all'
type ImageProvider = 'auto' | 'native' | 'nuxt-image' | 'custom'

const defaults = Object.freeze({
  css: 'structure' as CssMode,
  image: 'auto' as ImageProvider,
  components: true,
  autoImports: true,
  prefix: '',
  primitives: false,
  customMinZoom: false,
  minZoom: 1.2,
})

const radioId = useId()
const cssGroup = `${radioId}-css`
const imageGroup = `${radioId}-image`
const css = ref<CssMode>(defaults.css)
const image = ref<ImageProvider>(defaults.image)
const components = ref<boolean>(defaults.components)
const autoImports = ref<boolean>(defaults.autoImports)
const prefix = ref<string>(defaults.prefix)
const primitives = ref<boolean>(defaults.primitives)
const customMinZoom = ref<boolean>(defaults.customMinZoom)
const minZoom = ref<number>(defaults.minZoom)

const cleanPrefix = computed(() => prefix.value.trim())
const modules = computed(() =>
  image.value === 'nuxt-image' ? ['@nuxt-photo/nuxt', '@nuxt/image'] : ['@nuxt-photo/nuxt'],
)

const componentOption = computed(() => {
  if (!components.value) return 'false'

  const settings = [
    cleanPrefix.value ? `prefix: ${JSON.stringify(cleanPrefix.value)}` : null,
    primitives.value ? 'primitives: true' : null,
  ].filter(Boolean)

  return settings.length ? `{ ${settings.join(', ')} }` : 'true'
})

const autoImportOption = computed(() => {
  if (!autoImports.value) return 'false'
  return cleanPrefix.value ? `{ prefix: ${JSON.stringify(cleanPrefix.value)} }` : 'true'
})

const code = computed(() => {
  const moduleLines = modules.value.map((name) => `    '${name}',`).join('\n')
  const optionLines = [
    `css: '${css.value}',`,
    image.value === 'custom' ? 'image: false,' : `image: { provider: '${image.value}' },`,
    `components: ${componentOption.value},`,
    `autoImports: ${autoImportOption.value},`,
    customMinZoom.value ? `lightbox: { minZoom: ${minZoom.value.toFixed(2)} },` : null,
  ].filter(Boolean)

  return `export default defineNuxtConfig({
  modules: [
${moduleLines}
  ],
  nuxtPhoto: {
${optionLines.map((line) => `    ${line}`).join('\n')}
  },
})`
})

const componentName = computed(() =>
  components.value ? `<${cleanPrefix.value}PhotoAlbum>` : 'Manual imports',
)
const helperNames = computed(() => {
  if (!autoImports.value) return 'Import from @nuxt-photo/nuxt/app'
  if (!cleanPrefix.value) return 'useLightbox, useLightboxProvider, responsive'

  const helperPrefix = cleanPrefix.value
  const valuePrefix = `${helperPrefix.charAt(0).toLowerCase()}${helperPrefix.slice(1)}`
  return `use${helperPrefix}Lightbox, use${helperPrefix}LightboxProvider, ${valuePrefix}Responsive`
})
const cssConsequence = computed(
  () =>
    ({
      none: 'No library CSS; your app owns structure and theme.',
      structure: 'Required geometry without the default visual theme.',
      all: 'Structure plus the default Nuxt Photo theme.',
    })[css.value],
)
const imageConsequence = computed(
  () =>
    ({
      auto: 'Use Nuxt Image when the app already registers it; otherwise use native images.',
      native: 'Keep PhotoItem URLs and srcset values unchanged.',
      'nuxt-image': 'Install and register @nuxt/image; module order does not matter.',
      custom: 'Skip module adapter injection and provide your own ImageAdapter.',
    })[image.value],
)

function reset() {
  css.value = defaults.css
  image.value = defaults.image
  components.value = defaults.components
  autoImports.value = defaults.autoImports
  prefix.value = defaults.prefix
  primitives.value = defaults.primitives
  customMinZoom.value = defaults.customMinZoom
  minZoom.value = defaults.minZoom
}
</script>

<template>
  <InteractiveExample
    title="Build the module configuration"
    description="Choose startup options and copy a valid nuxt.config.ts. The preview explains what Nuxt will register after restart."
    :heading-level="3"
    @reset="reset"
  >
    <div
      class="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2"
    >
      <div class="bg-card p-4">
        <p class="m-0 text-xs font-semibold text-muted-foreground">CSS</p>
        <p class="mt-2 mb-0 text-sm text-foreground">{{ cssConsequence }}</p>
      </div>
      <div class="bg-card p-4">
        <p class="m-0 text-xs font-semibold text-muted-foreground">Images</p>
        <p class="mt-2 mb-0 text-sm text-foreground">{{ imageConsequence }}</p>
      </div>
      <div class="bg-card p-4">
        <p class="m-0 text-xs font-semibold text-muted-foreground">Components</p>
        <p class="mt-2 mb-0 font-mono text-sm text-foreground">{{ componentName }}</p>
        <p v-if="components && primitives" class="mt-1 mb-0 text-xs text-muted-foreground">
          Lightbox primitives are also registered.
        </p>
      </div>
      <div class="bg-card p-4">
        <p class="m-0 text-xs font-semibold text-muted-foreground">Helpers</p>
        <p class="mt-2 mb-0 text-sm text-foreground">{{ helperNames }}</p>
      </div>
    </div>
    <p class="ownership-note">
      <strong>Startup configuration</strong>
      These controls generate configuration; they do not mutate the running documentation app.
    </p>

    <template #controls>
      <fieldset class="docs-control">
        <legend>CSS</legend>
        <label v-for="value in ['structure', 'all', 'none'] as CssMode[]" :key="value">
          <input v-model="css" type="radio" :name="cssGroup" :value="value" /><span>{{
            value
          }}</span>
        </label>
      </fieldset>
      <fieldset class="docs-control">
        <legend>Image provider</legend>
        <label
          v-for="value in ['auto', 'native', 'nuxt-image', 'custom'] as ImageProvider[]"
          :key="value"
        >
          <input v-model="image" type="radio" :name="imageGroup" :value="value" /><span>{{
            value === 'custom' ? 'custom adapter' : value
          }}</span>
        </label>
      </fieldset>
      <label class="docs-control">
        <input v-model="components" type="checkbox" />
        <span>Auto-register recipe components</span>
      </label>
      <label class="docs-control">
        <input v-model="autoImports" type="checkbox" />
        <span>Auto-import helpers</span>
      </label>
      <label v-if="components || autoImports" class="docs-control docs-control--stacked">
        <span>Optional prefix</span>
        <input v-model="prefix" type="text" placeholder="Np" autocomplete="off" />
      </label>
      <label v-if="components" class="docs-control">
        <input v-model="primitives" type="checkbox" />
        <span>Register lightbox primitives</span>
      </label>
      <label class="docs-control">
        <input v-model="customMinZoom" type="checkbox" />
        <span>Set the app-wide minZoom default</span>
      </label>
      <label v-if="customMinZoom" class="docs-control docs-control--stacked">
        <span
          >minZoom <output>{{ minZoom.toFixed(2) }}</output></span
        >
        <input
          v-model.number="minZoom"
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          aria-label="Minimum zoom"
        />
      </label>
    </template>
    <template #code><DemoCode :code="code" /></template>
    <template #state>
      <DemoState
        :value="{
          modules,
          css,
          image,
          components: components ? componentName : false,
          autoImports: autoImports ? helperNames : false,
          minZoom: customMinZoom ? minZoom : undefined,
        }"
      />
    </template>
  </InteractiveExample>
</template>
