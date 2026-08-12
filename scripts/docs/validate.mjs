import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const contentRoot = resolve(root, 'docs/content/docs')
const docsConfig = resolve(root, 'docs/nuxt.config.ts')

const expectedSections = [
  ['1.getting-started', 'section'],
  ['2.concepts', 'group'],
  ['3.guides', 'group'],
  ['4.customization', 'group'],
  ['5.troubleshooting.md', null],
  ['6.reference', 'section'],
  ['7.components', 'group'],
  ['8.resources', 'group'],
]

const expectedLabs = [
  'album-layout-lab',
  'carousel-lab',
  'image-pipeline-lab',
  'lightbox-behavior-lab',
  'module-config-lab',
  'responsive-lab',
  'ssr-layout-lab',
]

const genericEnding =
  /^#{2,6}\s+(?:what(?:'|’)s next|next steps?|where next|you(?:'|’)re done|related(?:\s+\w+)?|see also|conclusion|summary)\s*$/gimu

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
  const segments = relative(contentRoot, file).split('/').map(cleanSegment)
  if (segments.at(-1) === 'index') segments.pop()
  return `/docs/${segments.join('/')}`
}

function bodyWithoutFrontmatter(source) {
  return source.replace(/^---\n[\s\S]*?\n---\n/, '')
}

function checkCodeFences(source, file, failures) {
  let open = false
  for (const [index, line] of source.split('\n').entries()) {
    if (!line.startsWith('```')) continue
    if (!open) {
      const info = line.slice(3).trim()
      if (!info || !/^[a-z0-9+-]+\s+\[[^\]]+\]$/i.test(info)) {
        failures.push(
          `${relative(root, file)}:${index + 1} needs a language and a useful code-fence label`,
        )
      }
    }
    open = !open
  }
  if (open) failures.push(`${relative(root, file)} has an unclosed code fence`)
}

const files = (await markdownFiles(contentRoot)).sort()
const routes = new Set(files.map(routeFor))
const failures = []
const labUses = new Map(expectedLabs.map((name) => [name, []]))
const publicReadmes = [
  resolve(root, 'README.md'),
  resolve(root, 'packages/nuxt/README.md'),
  resolve(root, 'packages/vue/README.md'),
]
const publicRouteSources = [
  ...publicReadmes,
  resolve(root, 'packages/vue/src/components/photo-album/layoutState.ts'),
]

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const relativeFile = relative(root, file)
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)
  const body = bodyWithoutFrontmatter(source)

  if (!frontmatter) {
    failures.push(`${relativeFile} has no frontmatter`)
  } else {
    if (!/^title:\s*\S.+$/m.test(frontmatter[1])) {
      failures.push(`${relativeFile} has no frontmatter title`)
    }
    if (!/^description:\s*\S.+$/m.test(frontmatter[1])) {
      failures.push(`${relativeFile} has no frontmatter description`)
    }
  }

  if (/^#\s+/m.test(body)) failures.push(`${relativeFile} contains a body H1`)
  if (genericEnding.test(body)) failures.push(`${relativeFile} has a generic ending heading`)
  genericEnding.lastIndex = 0
  if (/[—–]/u.test(source)) failures.push(`${relativeFile} contains a disallowed dash character`)
  if (/::+read-more\b/i.test(source)) failures.push(`${relativeFile} uses a read-more footer card`)
  if (/(?:\]\(|to=["'])\/docs(?:\/|["'])/i.test(source)) {
    failures.push(`${relativeFile} uses a raw internal /docs link`)
  }
  if (/\bThis page (?:shows|explains|covers|will)\b/i.test(body)) {
    failures.push(`${relativeFile} opens with documentation meta prose`)
  }
  if (
    /(?:^|[`\s])(?:packages|playground)\//m.test(source) ||
    /\bpnpm size(?::\w+)?\b/.test(source)
  ) {
    failures.push(`${relativeFile} leaks maintainer-only repository paths or commands`)
  }

  checkCodeFences(source, file, failures)

  const references = source.matchAll(/(?:\]\(|to=["'])(?<ref>\$docs\/[^"')#}]+)(?:#[^"')}]+)?/g)
  for (const match of references) {
    const reference = match.groups?.ref
    if (!reference) continue
    const target = `/docs/${reference.slice('$docs/'.length)}`
    if (!routes.has(target)) failures.push(`${relativeFile} links to missing route ${target}`)
    if (target === routeFor(file)) failures.push(`${relativeFile} links to itself`)
  }

  for (const match of source.matchAll(/^::(?<tag>[a-z0-9-]+)(?:\{|$)/gim)) {
    const tag = match.groups?.tag
    if (tag?.endsWith('-lab')) {
      if (!labUses.has(tag)) failures.push(`${relativeFile} uses unregistered lab ${tag}`)
      else labUses.get(tag).push(relativeFile)
    }
  }
}

for (const file of publicRouteSources) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(
    /https:\/\/nuxt-photo\.lupinum\.com(?<url>\/docs\/[^"'`),#;\s]+)(?:#[^"'`)\s]+)?/g,
  )) {
    const url = match.groups?.url
    if (url && !routes.has(url)) {
      failures.push(`${relative(root, file)} links to missing route ${url}`)
    }
  }
  if (publicReadmes.includes(file)) {
    if (genericEnding.test(source)) {
      failures.push(`${relative(root, file)} has a generic ending heading`)
    }
    genericEnding.lastIndex = 0
  }
}

const actualSections = [
  ...new Set(files.map((file) => relative(contentRoot, file).split('/')[0])),
].sort((left, right) => left.localeCompare(right))
const expectedNames = expectedSections.map(([name]) => name)
if (JSON.stringify(actualSections) !== JSON.stringify(expectedNames)) {
  failures.push(`Unexpected documentation sections: ${actualSections.join(', ')}`)
}

for (const [directory, sidebar] of expectedSections) {
  if (!sidebar) continue
  const navigationPath = resolve(contentRoot, directory, '.navigation.yml')
  const navigation = await readFile(navigationPath, 'utf8').catch(() => '')
  if (!/^title:\s*\S.+$/m.test(navigation)) {
    failures.push(`${relative(root, navigationPath)} has no title`)
  }
  if (!new RegExp(`^sidebar: ${sidebar}$`, 'm').test(navigation)) {
    failures.push(`${relative(root, navigationPath)} must use sidebar: ${sidebar}`)
  }
}

for (const [lab, uses] of labUses) {
  if (uses.length !== 1) {
    failures.push(
      `${lab} must appear once; found ${uses.length} uses${uses.length ? ` in ${uses.join(', ')}` : ''}`,
    )
  }
}

const configSource = await readFile(docsConfig, 'utf8')
for (const lab of expectedLabs) {
  if (!configSource.includes(`'${lab}'`)) {
    failures.push(`docs/nuxt.config.ts does not register ${lab}`)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  process.stdout.write(
    `Validated ${files.length} documentation pages, ${publicReadmes.length} public READMEs, ${routes.size} routes, and ${expectedLabs.length} canonical labs.\n`,
  )
}
