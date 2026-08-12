import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const contentRoot = resolve(root, 'docs/content/docs')

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return markdownFiles(path)
      return entry.name.endsWith('.md') ? [path] : []
    }),
  )
  return nested.flat()
}

function cleanSegment(segment) {
  return segment.replace(/^\d+\./, '').replace(/\.md$/, '')
}

function routeFor(file) {
  return `/docs/${relative(contentRoot, file).split('/').map(cleanSegment).join('/')}`
}

const files = await markdownFiles(contentRoot)
const routes = new Set(files.map(routeFor))
const failures = []
const publicReadmes = [
  resolve(root, 'README.md'),
  resolve(root, 'packages/nuxt/README.md'),
  resolve(root, 'packages/vue/README.md'),
]

for (const file of [...files, ...publicReadmes]) {
  const source = await readFile(file, 'utf8')
  const links = source.matchAll(
    /(?:to=["']|\]\()(?:https:\/\/nuxt-photo\.lupinum\.com)?(?<url>\/docs\/[^"')#}]+)(?:#[^"')}]+)?/g,
  )
  for (const match of links) {
    const url = match.groups?.url
    if (url && !routes.has(url)) {
      failures.push(`${relative(root, file)} links to missing route ${url}`)
    }
  }
  if (file.startsWith(contentRoot) && /[—–]/u.test(source)) {
    failures.push(`${relative(root, file)} contains a disallowed dash character`)
  }
}

const expectedSections = [
  '1.overview',
  '2.getting-started',
  '3.concepts',
  '4.guides',
  '5.api',
  '6.help',
  '7.project',
]
const topLevel = await readdir(contentRoot, { withFileTypes: true })
const actualSections = topLevel
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
if (JSON.stringify(actualSections) !== JSON.stringify(expectedSections)) {
  failures.push(`Unexpected documentation sections: ${actualSections.join(', ')}`)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  process.stdout.write(
    `Validated ${files.length} documentation pages, ${publicReadmes.length} public READMEs, and ${routes.size} routes.\n`,
  )
}
