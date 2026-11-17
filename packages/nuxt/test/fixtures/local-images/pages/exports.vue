<script setup lang="ts">
import * as app from '@lupinum/nuxt-photo/app'
import * as primitives from '@lupinum/nuxt-photo/primitives'
const kinds = (entry: object) =>
  Object.fromEntries(Object.entries(entry).map(([key, value]) => [key, typeof value]))
const contract = {
  exports: kinds(app),
  primitives: kinds(primitives),
  responsive: app.responsive({ 0: 1 })(320),
}
</script>
<template>
  <pre id="exports">{{ JSON.stringify(contract) }}</pre>
</template>
