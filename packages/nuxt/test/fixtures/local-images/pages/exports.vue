<script setup lang="ts">
import * as app from '@lupinum/nuxt-photo/app'
const contract = {
  exports: Object.fromEntries(Object.entries(app).map(([key, value]) => [key, typeof value])),
  responsive: app.responsive({ 0: 1 })(320),
}
</script>
<template>
  <pre id="exports">{{ JSON.stringify(contract) }}</pre>
</template>
