<script setup lang="ts">
withDefaults(
  defineProps<{
    category?: string
    title?: string
    description?: string
  }>(),
  {
    category: 'Docs',
    title: 'Nuxt Photo',
    description:
      'Documentation for photo galleries, albums, lightbox, and carousel.',
  },
)
</script>

<template>
  <div
    style="
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 56px;
      background:
        radial-gradient(
          circle at top right,
          rgba(0, 220, 130, 0.18),
          transparent 32%
        ),
        linear-gradient(135deg, #020420 0%, #071033 58%, #0e1d4d 100%);
      color: #f8fafc;
      font-family: 'Public Sans', sans-serif;
    "
  >
    <div
      style="
        display: flex;
        align-items: center;
        gap: 12px;
        align-self: flex-start;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.06);
        font-size: 24px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      "
    >
      <span
        style="
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #00dc82;
          box-shadow: 0 0 24px rgba(0, 220, 130, 0.75);
        "
      />
      {{ category }}
    </div>

    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 960px"
    >
      <h1
        style="margin: 0; font-size: 74px; line-height: 1.02; font-weight: 800"
      >
        {{ title }}
      </h1>
      <p
        style="
          margin: 0;
          font-size: 30px;
          line-height: 1.35;
          color: rgba(248, 250, 252, 0.82);
        "
      >
        {{ description }}
      </p>
    </div>

    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        color: rgba(248, 250, 252, 0.72);
        font-size: 24px;
      "
    >
      <span>nuxt-photo</span>
      <span style="color: #00dc82">lupinum.com</span>
    </div>
  </div>
</template>
