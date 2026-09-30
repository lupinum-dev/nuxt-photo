import { readFile } from 'node:fs/promises'
import { createHighlighter, type Highlighter } from 'shiki'
import type { Plugin } from 'vite'

const QUERY = '?example-source'
const VIRTUAL = '\0example-source:'
const THEMES = { light: 'material-theme-lighter', dark: 'material-theme-palenight' } as const

/**
 * Serve a docs example's own source, highlighted at build time.
 *
 * `import.meta.glob('~/examples/*.vue', { query: '?example-source' })` loads the
 * same file the page renders, so the code a reader sees is the code that runs.
 * The themes match Ginko's code blocks, including its dark-mode token variables.
 */
export function exampleSources(): Plugin {
  let highlighter: Promise<Highlighter> | undefined

  return {
    name: 'nuxt-photo-docs:example-sources',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!id.endsWith(QUERY)) return null
      const resolved = await this.resolve(id.slice(0, -QUERY.length), importer, { skipSelf: true })
      // A virtual id keeps the Vue plugin from compiling this module as a component.
      return resolved ? `${VIRTUAL}${resolved.id}` : null
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL)) return null
      const file = id.slice(VIRTUAL.length)
      this.addWatchFile(file)
      const source = (await readFile(file, 'utf8')).trimEnd()
      highlighter ??= createHighlighter({ themes: Object.values(THEMES), langs: ['vue'] })
      const html = (await highlighter).codeToHtml(source, {
        lang: 'vue',
        themes: THEMES,
        defaultColor: 'light',
      })
      // The docs code block supplies its own <pre>; keep only the highlighted lines.
      const code = html.slice(html.indexOf('<code>') + '<code>'.length, html.lastIndexOf('</code>'))
      return `export default ${JSON.stringify({ source, html: code })}`
    },
  }
}
