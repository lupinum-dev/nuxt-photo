import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/', builder: 'mkdist', format: 'esm', declaration: true },
  ],
  clean: true,
  externals: [
    'vue',
    '@nuxt-photo/core',
    '@nuxt-photo/core/internal',
    '@nuxt-photo/vue',
  ],
  failOnWarn: false,
})
