<script setup lang="ts">
import { provide } from 'vue'
import { LightboxComponentKey } from '@nuxt-photo/vue'
import Lightbox from '~/components/ui/Lightbox.vue'
import { photos } from '~/composables/photos'

provide(LightboxComponentKey, Lightbox)

useHead({ title: 'nuxt-photo — Tailwind 4' })
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-stone-200 antialiased">
    <nav
      class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-800 bg-stone-950 px-6 md:px-12"
    >
      <span class="text-lg font-semibold tracking-tight text-stone-100"
        >nuxt-photo</span
      >
      <span class="text-xs font-medium uppercase tracking-widest text-amber-600"
        >Tailwind 4</span
      >
    </nav>

    <main class="mx-auto max-w-5xl px-6 py-16 md:px-12 md:py-20">
      <header class="mb-16">
        <p
          class="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-amber-600"
        >
          @nuxt-photo/nuxt
        </p>
        <h1
          class="text-4xl font-light tracking-tight text-stone-100 md:text-6xl"
        >
          Styled with Tailwind.
        </h1>
        <p class="mt-6 max-w-lg text-base leading-relaxed text-stone-400">
          Everything you see here uses Tailwind utility classes — including the
          lightbox. Click any image to open it.
        </p>
      </header>

      <section class="border-t border-stone-800 pt-12">
        <UiPhotoAlbum
          :photos="photos"
          layout="rows"
          :target-row-height="280"
          :spacing="6"
          :breakpoints="[375, 600, 900, 1200]"
        />
      </section>

      <footer class="mt-20 border-t border-stone-800 pt-8">
        <p class="text-sm text-stone-500">
          Built with
          <span class="text-amber-600">@nuxt-photo/nuxt</span> +
          <span class="text-amber-600">Tailwind CSS 4</span>
        </p>
      </footer>
    </main>
  </div>
</template>
