import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@nuxt-photo\/core$/,
        replacement: fileURLToPath(
          new URL('./packages/core/src/index.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/vue',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/index.ts', import.meta.url),
        ),
      },
      {
        find: '@nuxt-photo/recipes',
        replacement: fileURLToPath(
          new URL('./packages/recipes/src/index.ts', import.meta.url),
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
