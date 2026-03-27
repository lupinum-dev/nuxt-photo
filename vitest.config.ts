import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@nuxt-photo/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@nuxt-photo/vue/extend': fileURLToPath(new URL('./packages/vue/src/extend.ts', import.meta.url)),
      '@nuxt-photo/vue/internal': fileURLToPath(new URL('./packages/vue/src/internal.ts', import.meta.url)),
      '@nuxt-photo/vue': fileURLToPath(new URL('./packages/vue/src/index.ts', import.meta.url)),
      '@nuxt-photo/recipes': fileURLToPath(new URL('./packages/recipes/src/index.ts', import.meta.url)),
      '@nuxt-photo/nuxt': fileURLToPath(new URL('./packages/nuxt/src/module.ts', import.meta.url)),
      '@test-fixtures': fileURLToPath(new URL('./test/fixtures', import.meta.url)),
    },
  },
  test: {
    root: rootDir,
    include: [
      'packages/*/test/**/*.test.ts',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['packages/vue/test/**', 'jsdom'],
      ['packages/recipes/test/**', 'jsdom'],
    ],
  },
})
