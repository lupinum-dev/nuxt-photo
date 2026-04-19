<script setup>
defineProps({
  loose: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <UPageSection
    :ui="{
      container: 'gap-8 sm:gap-y-8' + (!loose ? ' py-12 sm:py-12' : ''),
      title: 'lg:text-4xl font-semibold'
    }"
    :links="[
      {
        label: 'Get started',
        to: '/docs/getting-started/installation',
        trailingIcon: 'i-lucide-arrow-right'
      },
      {
        label: 'View on GitHub',
        to: 'https://github.com/lupinum-dev/nuxt-photo',
        target: '_blank',
        variant: 'outline',
        color: 'neutral'
      }
    ]"
  >
    <svg
      class="absolute top-0 inset-x-0 pointer-events-none"
      viewBox="0 0 1017 181"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.5">
        <mask id="path-1-inside-1_846_160841" fill="white">
          <path d="M0 0H1017V181H0V0Z" />
        </mask>
        <path d="M0 0H1017V181H0V0Z" fill="url(#paint0_radial_846_160841)" fill-opacity="0.22" />
        <path d="M0 2H1017V-2H0V2Z" fill="url(#paint1_linear_846_160841)" mask="url(#path-1-inside-1_846_160841)" />
      </g>
      <defs>
        <radialGradient
          id="paint0_radial_846_160841"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(508.999 19.5) rotate(90.177) scale(161.501 509.002)"
        >
          <stop stop-color="#F59E0B" />
          <stop offset="1" stop-color="#F59E0B" stop-opacity="0" />
        </radialGradient>
        <linearGradient
          id="paint1_linear_846_160841"
          x1="10.9784"
          y1="91"
          x2="1017"
          y2="90.502"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F59E0B" stop-opacity="0" />
          <stop offset="0.395" stop-color="#F59E0B" />
          <stop offset="1" stop-color="#F59E0B" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
    <ClientOnly>
      <Sparkles
        :density="100"
        class="absolute inset-0 w-full pointer-events-none"
      />
    </ClientOnly>

    <template #title>
      <span>Build photo galleries in <span class="text-primary">minutes</span></span>
    </template>
    <template #description>
      Install the module, drop in a <code>&lt;PhotoAlbum&gt;</code>, and you have layouts, lightbox, zoom, and transitions — wired to @nuxt/image when you need it.
    </template>
  </UPageSection>
</template>
