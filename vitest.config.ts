import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@nuxt-photo/vue/composables',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/composables/index.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/vue/provide',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/provide/keys.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/vue/types',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/types/index.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/vue',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/index.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/nuxt/app',
        replacement: fileURLToPath(
          new URL('./packages/nuxt/src/runtime/app.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/nuxt',
        replacement: fileURLToPath(
          new URL('./packages/nuxt/src/module.ts', import.meta.url),
        ),
      },
      {
        find: '@test-fixtures',
        replacement: fileURLToPath(new URL('./test/fixtures', import.meta.url)),
      },
    ],
  },
  test: {
    root: rootDir,
    include: ['packages/*/test/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
