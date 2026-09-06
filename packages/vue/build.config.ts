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
})
