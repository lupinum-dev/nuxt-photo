import { fileURLToPath } from 'node:url'
import { defineBuildConfig } from 'unbuild'

const declarationTypes = fileURLToPath(
  new URL('../../node_modules/vue-declaration-types/dist/runtime-dom.d.ts', import.meta.url),
)

export default defineBuildConfig({
  entries: [
    {
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
  externals: ['vue', 'embla-carousel-vue', 'embla-carousel', 'embla-carousel-autoplay'],
  failOnWarn: false,
  hooks: {
    // scripts/agent-docs.mjs writes the `./agent-docs` target after the docs build.
    'build:done'(ctx) {
      for (const warning of ctx.warnings) {
        if (warning.includes('dist/agent/AGENTS.md')) ctx.warnings.delete(warning)
      }
    },
  },
})
