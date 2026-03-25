import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/', builder: 'mkdist', format: 'esm', declaration: true },
  ],
  clean: true,
  externals: ['vue', 'embla-carousel-vue', 'embla-carousel', '@nuxt-photo/core'],
  failOnWarn: false,
})
