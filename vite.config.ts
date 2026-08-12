import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const ignoredGeneratedPaths = [
  '.release/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/dist/**',
  '**/node_modules/**',
  'coverage/**',
  'playwright-report/**',
  'test-results/**',
]

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@lupinum/vue-photo/composables',
        replacement: fileURLToPath(
          new URL('./packages/vue/src/composables/index.ts', import.meta.url),
        ),
      },
      {
        find: '@lupinum/vue-photo/provide',
        replacement: fileURLToPath(new URL('./packages/vue/src/provide/keys.ts', import.meta.url)),
      },
      {
        find: '@lupinum/vue-photo/types',
        replacement: fileURLToPath(new URL('./packages/vue/src/types/index.ts', import.meta.url)),
      },
      {
        find: '@lupinum/vue-photo',
        replacement: fileURLToPath(new URL('./packages/vue/src/index.ts', import.meta.url)),
      },
      {
        find: '@lupinum/nuxt-photo/app',
        replacement: fileURLToPath(new URL('./packages/nuxt/src/runtime/app.ts', import.meta.url)),
      },
      {
        find: '@lupinum/nuxt-photo',
        replacement: fileURLToPath(new URL('./packages/nuxt/src/module.ts', import.meta.url)),
      },
      {
        find: '@test-fixtures',
        replacement: fileURLToPath(new URL('./test/fixtures', import.meta.url)),
      },
    ],
  },
  fmt: {
    ignorePatterns: [...ignoredGeneratedPaths, 'pnpm-lock.yaml'],
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
  },
  lint: {
    ignorePatterns: [
      ...ignoredGeneratedPaths,
      'docs/server/routes/raw/**',
      'skills/nuxt-photo/references/**',
    ],
    options: {
      typeAware: true,
      // TypeScript-Go does not understand Vue SFC modules or Nuxt-generated
      // aliases. Authoritative compiler checks remain in the profile-specific
      // vue-tsc and Nuxt typecheck tasks.
      typeCheck: false,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'typescript/consistent-type-exports': 'error',
      'typescript/no-import-type-side-effects': 'error',
    },
    overrides: [
      {
        files: ['scripts/**', 'test/size/**'],
        rules: {
          'no-console': 'off',
        },
      },
      {
        files: ['**/*.test.ts'],
        rules: {
          'typescript/no-base-to-string': 'off',
          'typescript/unbound-method': 'off',
        },
      },
      {
        files: ['packages/nuxt/src/options.ts', 'packages/vue/src/core/photo/normalize.ts'],
        rules: {
          'typescript/no-base-to-string': 'off',
        },
      },
      {
        files: ['packages/vue/src/core/types.ts'],
        rules: {
          'typescript/no-redundant-type-constituents': 'off',
        },
      },
    ],
  },
  test: {
    root: rootDir,
    include: ['packages/*/test/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    passWithNoTests: false,
  },
})
