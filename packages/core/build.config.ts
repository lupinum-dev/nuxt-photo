import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/internal'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
  },
})
