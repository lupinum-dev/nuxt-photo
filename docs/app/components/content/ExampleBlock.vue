<script setup lang="ts">
import { defineAsyncComponent, ref, useId } from 'vue'
import { demoPhotos } from 'nuxt-photo-demo'

type ExampleSource = { source: string; html: string }

const props = defineProps<{
  /** The example file in `app/examples`, in kebab case: `tailwind-gallery`. */
  name: string
  /** More example files to show as code tabs, comma-separated: `tailwind-lightbox`. */
  also?: string
  /** `open` shows the code without a click, for guides where the code is the point. */
  code?: string
}>()

// The page renders the example and shows its source from the same file.
const components = import.meta.glob('~/examples/*.vue')
const sources = import.meta.glob<ExampleSource>('~/examples/*.vue', {
  query: '?example-source',
  import: 'default',
})

function fileOf(name: string) {
  const file =
    name
      .trim()
      .split('-')
      .map((part) => part[0]!.toUpperCase() + part.slice(1))
      .join('') + '.vue'
  const key = Object.keys(components).find((path) => path.endsWith(`/${file}`))
  if (!key) throw new Error(`[docs] No example named "${name}" in app/examples.`)
  return { file, key }
}

const main = fileOf(props.name)
const files = [main, ...(props.also?.split(',').map(fileOf) ?? [])]
const loaded = await Promise.all(
  files.map(async (entry) => ({ ...entry, ...(await sources[entry.key]!()) })),
)

const Example = defineAsyncComponent(components[main.key] as () => Promise<object>)
const showCode = ref(props.code === 'open')
const activeFile = ref(0)
const codeId = useId()
</script>

<template>
  <figure class="docs-example not-prose">
    <div class="docs-example__stage">
      <Example :photos="demoPhotos" />
    </div>
    <div class="docs-example__bar">
      <div v-if="showCode && loaded.length > 1" class="docs-example__tabs" role="tablist">
        <button
          v-for="(entry, index) in loaded"
          :key="entry.file"
          type="button"
          role="tab"
          class="docs-example__tab"
          :aria-selected="activeFile === index"
          @click="activeFile = index"
        >
          {{ entry.file }}
        </button>
      </div>
      <button
        type="button"
        class="docs-example__toggle"
        :aria-expanded="showCode"
        :aria-controls="codeId"
        @click="showCode = !showCode"
      >
        <Icon
          :name="showCode ? 'lucide:chevron-up' : 'lucide:code'"
          mode="svg"
          aria-hidden="true"
        />
        {{ showCode ? 'Hide code' : 'Show code' }}
      </button>
    </div>
    <div v-show="showCode" :id="codeId" class="docs-example__code">
      <template v-for="(entry, index) in loaded" :key="entry.file">
        <ProsePre
          v-show="activeFile === index"
          :code="entry.source"
          language="vue"
          :filename="`app/components/${entry.file}`"
        >
          <!-- eslint-disable-next-line vue/no-v-html -- Shiki output for this repo's own example files, built at build time. -->
          <code v-html="entry.html" />
        </ProsePre>
      </template>
    </div>
  </figure>
</template>

<style scoped>
.docs-example {
  margin: 1.75rem 0;
  border: 1px solid var(--docs-line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--docs-surface);
}

.docs-example__stage {
  padding: clamp(16px, 3vw, 28px);
  background: var(--background, #fff);
}

.docs-example__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-top: 1px solid var(--docs-line);
}

.docs-example__tabs {
  display: flex;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
}

.docs-example__tab,
.docs-example__toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: color-mix(in oklab, var(--foreground) 68%, transparent);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.docs-example__tab {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
}

.docs-example__tab[aria-selected='true'] {
  background: var(--docs-surface-strong);
  color: var(--foreground);
}

.docs-example__toggle {
  margin-left: auto;
}

.docs-example__tab:hover,
.docs-example__toggle:hover {
  background: var(--docs-surface-strong);
  color: var(--foreground);
}

.docs-example__tab:focus-visible,
.docs-example__toggle:focus-visible {
  outline: 2px solid var(--docs-accent);
  outline-offset: 2px;
}

.docs-example__toggle :deep(svg) {
  width: 15px;
  height: 15px;
}

.docs-example__code :deep(.content-codeblock) {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--docs-line);
  border-radius: 0;
}
</style>
