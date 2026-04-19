<script setup lang="ts">
const photo = {
  id: 'fixture-photo',
  src: '/demo.jpg',
  width: 1200,
  height: 800,
  alt: 'Fixture photo',
}
</script>

<template>
  <PhotoImage :photo="photo" />
</template>
