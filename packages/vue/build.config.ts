import { existsSync, globSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineBuildConfig } from 'unbuild'
import { build } from 'vite'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))
const declarationTypes = fileURLToPath(
  new URL('../../node_modules/vue-declaration-types/dist/runtime-dom.d.ts', import.meta.url),
)

// One source file per JavaScript target of the exports map: `./dist/a/b.mjs` comes from
// `src/a/b.ts` or `src/a/b.vue`.
function exportEntries() {
  const { exports } = JSON.parse(readFileSync(`${packageRoot}package.json`, 'utf8'))
  const entries: Record<string, string> = {}
  for (const target of Object.values<Record<string, string> | string>(exports)) {
    const file = typeof target === 'object' ? target.import : undefined
    if (!file) continue
    const name = file.replace(/^\.\/dist\//, '').replace(/\.mjs$/, '')
    const source = [`src/${name}.ts`, `src/${name}.vue`].find((path) =>
      existsSync(`${packageRoot}${path}`),
    )
    if (!source) throw new Error(`No source file for the export target ${file}.`)
    entries[name] = `${packageRoot}${source}`
  }
  return entries
}

export default defineBuildConfig({
  entries: [
    {
      // Declarations and stylesheets. Its JavaScript is replaced by the compiled build below.
      input: 'src/',
      builder: 'mkdist',
      format: 'esm',
      declaration: true,
      // Only declaration emission sees minimum Vue types; runtime imports remain vue.
      typescript: {
        compilerOptions: {
          paths: {
            vue: [declarationTypes],
          },
        },
      },
    },
  ],
  clean: true,
  externals: ['vue', 'embla-carousel', 'embla-carousel-autoplay'],
  failOnWarn: false,
  hooks: {
    async 'build:done'(ctx) {
      // scripts/agent-docs.mjs writes the `./agent-docs` target after the docs build.
      for (const warning of ctx.warnings) {
        if (warning.includes('dist/agent/AGENTS.md')) ctx.warnings.delete(warning)
      }

      // Apps load compiled components: a `.vue` file in node_modules needs a bundler setting
      // in Vite (pre-bundling splits module state) and in Nuxt (the dev server loads it with Node).
      for (const file of globSync('dist/**/*.{mjs,vue}', { cwd: packageRoot })) {
        rmSync(`${packageRoot}${file}`)
      }
      await build({
        configFile: false,
        root: packageRoot,
        logLevel: 'warn',
        plugins: [vue()],
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          minify: false,
          target: 'es2022',
          lib: { entry: exportEntries(), formats: ['es'] },
          rollupOptions: {
            // Self-references stay bare: they are seams of the exports map that Nuxt aliases,
            // and the viewer one is the lazy chunk. Stylesheets stay files next to the code.
            external: (id) =>
              /^(vue|embla-carousel(-autoplay)?|@lupinum\/vue-photo)(\/|$)/.test(id) ||
              id.endsWith('.css'),
            output: {
              preserveModules: true,
              preserveModulesRoot: 'src',
              entryFileNames: '[name].mjs',
            },
          },
        },
      })
    },
  },
})
