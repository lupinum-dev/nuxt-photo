const config = require('./scripts/size/config.json')

module.exports = [
  {
    name: 'core:responsive',
    path: 'packages/core/dist/index.mjs',
    import: '{ responsive }',
    limit: config.core.responsive.sizeLimit,
  },
  {
    name: 'core:all',
    path: 'packages/core/dist/index.mjs',
    import: '*',
    limit: config.core.all.sizeLimit,
  },
]
