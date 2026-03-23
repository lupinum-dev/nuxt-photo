<template>
  <main>
    <PhotoImg
      src="https://example.com/standalone.jpg"
      alt="Standalone test image"
      caption="Standalone test image"
      :width="1200"
      :height="800"
    />

    <PhotoAlbum
      :items="items"
      layout="columns"
      :columns="{ 0: 2 }"
      :spacing="{ 0: 16 }"
      :padding="0"
    />
  </main>
</template>

<script setup>
const items = [
  {
    src: 'https://example.com/one.jpg',
    alt: 'One',
    width: 1200,
    height: 800,
  },
  {
    src: 'https://example.com/two.jpg',
    alt: 'Two',
    width: 1200,
    height: 900,
  },
]
</script>
