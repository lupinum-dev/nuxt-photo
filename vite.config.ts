import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'
import vuePackage from './packages/vue/package.json' with { type: 'json' }

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const ignoredGeneratedPaths = [
  'release/**',
  '.release/**',
  '.package-preview/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/dist/**',
  '**/node_modules/**',
  'coverage/**',
  '**/playwright-report/**',
  '**/test-results/**',
]

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // Every code entry of the Vue exports map, served from its source file.
      ...Object.entries(vuePackage.exports).flatMap(([entry, target]) =>
        typeof target === 'object' && 'import' in target
          ? {
              find: new RegExp(`^@lupinum/vue-photo${entry.slice(1)}$`),
              replacement: fileURLToPath(
                new URL(
                  target.import.replace('./dist/', './packages/vue/src/').replace(/\.mjs$/, '.ts'),
                  import.meta.url,
                ),
              ),
            }
          : [],
      ),
      {
        find: '@lupinum/nuxt-photo/primitives',
        replacement: fileURLToPath(
          new URL('./packages/nuxt/src/runtime/primitives.ts', import.meta.url),
        ),
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
    // Keep the shared OSS release helpers identical to the starter.
    ignorePatterns: [
      ...ignoredGeneratedPaths,
      // Changesets writes the changelogs in the release job, which runs no formatter.
      '**/CHANGELOG.md',
      'pnpm-lock.yaml',
      'scripts/release.mjs',
      'scripts/lint-changesets.mjs',
      'scripts/agent-docs.mjs',
      'scripts/audit-deps.mjs',
    ],
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
  },
  lint: {
    ignorePatterns: [...ignoredGeneratedPaths, 'docs/server/routes/raw/**'],
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
        // Kept identical to the OSS starter. Its default sort orders [name, range]
        // pairs by their string form on purpose, to compare two dependency lists.
        files: ['scripts/lint-changesets.mjs'],
        rules: {
          'typescript/require-array-sort-compare': 'off',
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
    setupFiles: ['test/setup/dialog.ts'],
    clearMocks: true,
    restoreMocks: true,
    passWithNoTests: false,
  },
})
