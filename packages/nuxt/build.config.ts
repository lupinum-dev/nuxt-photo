import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    // scripts/agent-docs.mjs writes the `./agent-docs` target after the docs build.
    'build:done'(ctx) {
      for (const warning of ctx.warnings) {
        if (warning.includes('dist/agent/AGENTS.md')) ctx.warnings.delete(warning)
      }
    },
  },
})
