<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, useSeoMeta } from '#imports'
import { getLocalizedSiteText } from '#ginko-docs/config/site.utils'
import { useGinkoDocsConfig } from '#ginko-docs/composables/useGinkoDocsConfig'
import type { LightboxNavigationMode } from '@lupinum/nuxt-photo/app'
import { demoPhotos } from 'nuxt-photo-demo'

// The words come from the Ginko landing config; this page adds a live product.
const config = useGinkoDocsConfig()
const { locale, t } = useI18n()
type LocalizableText = string | { en: string; de?: string }
const localize = (value: LocalizableText) => getLocalizedSiteText(value, locale.value)

const landing = computed(() => ({
  eyebrow: 'Nuxt Photo 1.0 beta',
  title: localize(config.landing.title),
  description: localize(config.landing.description),
  primary: {
    label: localize(config.landing.primary.label),
    to: localize(config.landing.primary.to),
  },
  secondary: config.landing.secondary
    ? { label: localize(config.landing.secondary.label), to: localize(config.landing.secondary.to) }
    : null,
  install: config.landing.install?.command ?? '',
}))

const modes: { value: LightboxNavigationMode; label: string }[] = [
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'crossfade', label: 'Crossfade' },
]
const navigation = ref<LightboxNavigationMode>('slide')

const layouts = ['rows', 'columns', 'masonry'] as const
const layout = ref<(typeof layouts)[number]>('rows')
const albumLayout = computed(() =>
  layout.value === 'rows'
    ? { type: 'rows' as const, targetRowHeight: 120 }
    : { type: layout.value, columns: 3 },
)

const heroPhotos = demoPhotos.slice(0, 8)
const layoutPhotos = demoPhotos.slice(2, 11)
const carouselPhotos = demoPhotos.slice(4, 10)

const copied = ref(false)
async function copyInstall() {
  await navigator.clipboard?.writeText(landing.value.install)
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

const siteName = computed(() => localize(config.site.name))
const siteDescription = computed(() => localize(config.site.description))
useSeoMeta({
  title: siteName,
  description: siteDescription,
  ogTitle: siteName,
  ogDescription: siteDescription,
})
</script>

<template>
  <div class="overflow-hidden">
    <section class="landing-hero border-b border-border">
      <div
        class="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:pt-24 lg:pb-28"
      >
        <div class="min-w-0">
          <p v-if="landing.eyebrow" class="text-sm font-semibold text-brand">
            {{ landing.eyebrow }}
          </p>
          <h1
            class="mt-4 text-5xl leading-[0.98] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-6xl"
          >
            {{ landing.title }}
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            {{ landing.description }}
          </p>
          <div class="mt-9 flex flex-wrap items-center gap-3">
            <NuxtLink
              :to="landing.primary.to"
              class="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-foreground transition-transform hover:-translate-y-0.5"
            >
              {{ landing.primary.label }}
              <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink
              v-if="landing.secondary"
              :to="landing.secondary.to"
              class="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {{ landing.secondary.label }}
            </NuxtLink>
          </div>
          <div
            v-if="landing.install"
            class="mt-5 inline-flex h-10 max-w-full items-center gap-3 rounded-md border border-border bg-muted/40 pr-1.5 pl-4 font-mono text-[13px] text-foreground/90"
          >
            <span class="text-muted-foreground select-none" aria-hidden="true">$</span>
            <span class="truncate">{{ landing.install }}</span>
            <button
              type="button"
              class="content-codeblock-copy-button"
              :aria-label="copied ? t('docs.copiedText') : t('docs.copyText')"
              @click="copyInstall"
            >
              <Icon
                :name="copied ? 'lucide:check' : 'lucide:clipboard'"
                class="size-3.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <figure class="min-w-0">
          <div class="landing-stage rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <PhotoAlbum
              :photos="heroPhotos"
              :navigation="navigation"
              :layout="{ type: 'rows', targetRowHeight: 150 }"
              :spacing="6"
              :default-container-width="560"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
          <figcaption class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm text-muted-foreground">Open a photo, then change photos.</span>
            <fieldset class="landing-modes">
              <legend class="sr-only">How the lightbox changes photos</legend>
              <label v-for="mode in modes" :key="mode.value">
                <input
                  v-model="navigation"
                  type="radio"
                  name="landing-navigation"
                  :value="mode.value"
                />
                <span>{{ mode.label }}</span>
              </label>
            </fieldset>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-16">
        <div class="min-w-0">
          <h2 class="text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground">
            The layout is ready before the images are
          </h2>
          <p class="mt-4 text-base leading-7 text-muted-foreground">
            Each photo brings its width and height, so rows, columns, and masonry are computed on
            the server. The page keeps its shape while images load, and the album follows its own
            container width, not the window.
          </p>
          <fieldset class="landing-modes mt-6">
            <legend class="sr-only">Album layout</legend>
            <label v-for="value in layouts" :key="value">
              <input v-model="layout" type="radio" name="landing-layout" :value="value" />
              <span class="capitalize">{{ value }}</span>
            </label>
          </fieldset>
          <NuxtLink
            to="/docs/concepts/layouts-and-responsive-values"
            class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Layouts and responsive values
            <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div class="landing-stage min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
          <PhotoAlbum
            :photos="layoutPhotos"
            :layout="albumLayout"
            :spacing="6"
            :default-container-width="600"
            :lightbox="false"
          />
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-muted/30">
      <div
        class="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)] lg:gap-16"
      >
        <div
          class="landing-stage order-2 min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 lg:order-1"
        >
          <PhotoCarousel :photos="carouselPhotos" loop />
        </div>
        <div class="order-1 min-w-0 lg:order-2">
          <h2 class="text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground">
            A lightbox that behaves the way people expect
          </h2>
          <ul class="landing-list mt-5 text-base leading-7 text-muted-foreground">
            <li>Swipe, pinch, and double-tap on touch screens.</li>
            <li>Arrow keys, Home, End, and Escape on a keyboard.</li>
            <li>Click the photo to see its real pixels; click beside it to close.</li>
            <li>Focus returns to the photo you were looking at.</li>
          </ul>
          <NuxtLink
            to="/docs/concepts/lightbox-gestures-and-accessibility"
            class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Gestures and accessibility
            <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <h2 class="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground">
        Start ready-made. Change only what your design needs.
      </h2>
      <div class="mt-10 grid gap-4 md:grid-cols-3">
        <NuxtLink
          v-for="level in [
            {
              title: 'Ready-made components',
              text: 'Albums, groups, and carousels with the lightbox built in.',
              to: '/docs/start/choose-a-component',
            },
            {
              title: 'Slots and CSS variables',
              text: 'Replace the caption, counter, or buttons, and set the mat around the photo.',
              to: '/docs/guides/customize-the-built-in-lightbox',
            },
            {
              title: 'Lower-level components',
              text: 'Compose your own lightbox, for example in Tailwind, and keep the behavior.',
              to: '/docs/guides/build-a-lightbox-from-primitives',
            },
          ]"
          :key="level.title"
          :to="level.to"
          class="group min-w-0 rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/25"
        >
          <h3 class="text-base font-semibold tracking-tight text-foreground">{{ level.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ level.text }}</p>
          <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Read the guide
            <Icon
              name="lucide:arrow-right"
              class="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-modes {
  display: inline-flex;
  gap: 2px;
  margin: 0;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--background);
}

.landing-modes label {
  position: relative;
  cursor: pointer;
}

.landing-modes input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.landing-modes span {
  display: block;
  padding: 5px 13px;
  border-radius: 999px;
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: 500;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.landing-modes input:checked + span {
  background: var(--foreground);
  color: var(--background);
}

.landing-modes input:focus-visible + span {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.landing-list li {
  position: relative;
  padding-left: 1.25rem;
}

.landing-list li + li {
  margin-top: 0.5rem;
}

.landing-list li::before {
  content: '';
  position: absolute;
  top: 0.7em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--brand);
}
</style>
