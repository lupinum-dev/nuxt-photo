import { execFileSync } from 'node:child_process'
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
const trackedFiles = new Set(
  execFileSync('git', ['ls-files'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n'),
)
if (files.includes(resolve(contentRoot, 'index.md'))) {
  failures.push(
    'docs/content/docs/index.md must not exist because it creates a self-redirect at /docs.',
  )
}
for (const path of [
  '.github/ISSUE_TEMPLATE/bug.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/documentation.md',
  '.github/ISSUE_TEMPLATE/proposal.md',
  '.github/pull_request_template.md',
]) {
  if (!trackedFiles.has(path)) failures.push(`${path} must be tracked.`)
}
const pullRequestTemplate = await readFile(
  resolve(root, '.github/pull_request_template.md'),
  'utf8',
)
for (const marker of [
  '- [ ] I ran `pnpm verify`, or I explained why it does not apply.',
  '- [ ] I updated versions, migration guidance, and compatibility notes when the public contract changed.',
]) {
  if (!pullRequestTemplate.includes(marker))
    failures.push(`Pull request template is missing: ${marker}`)
}
const docsAppConfig = await readFile(resolve(root, 'docs/app/app.config.ts'), 'utf8')
for (const marker of [
  "plausible: { scriptId: 'AdOTbq5X_7FOIbPeaHoma' }",
  'feedback: { enabled: true }',
  'https://discord.gg/RPH6SeA36N',
  'https://lupinum.com/impressum',
  'https://lupinum.com/datenschutz',
]) {
  if (!docsAppConfig.includes(marker))
    failures.push(`Documentation app config is missing: ${marker}`)
}

const nuxtPackage = JSON.parse(await readFile(resolve(root, 'packages/nuxt/package.json'), 'utf8'))
const vuePackage = JSON.parse(await readFile(resolve(root, 'packages/vue/package.json'), 'utf8'))
const prereleaseDocs = String(nuxtPackage.version).includes('-')
const installationSurfaces = [
  ['README.md', '@lupinum/nuxt-photo'],
  ['packages/nuxt/README.md', '@lupinum/nuxt-photo'],
  ['packages/vue/README.md', '@lupinum/vue-photo'],
  ['docs/content/docs/1.start/2.installation.md', '@lupinum/nuxt-photo'],
  ['docs/content/docs/1.start/5.plain-vue.md', '@lupinum/vue-photo'],
  ['docs/app/app.config.ts', '@lupinum/nuxt-photo'],
  ['skills/nuxt-photo/references/gallery-basics.md', '@lupinum/nuxt-photo'],
]

if (String(nuxtPackage.version) !== String(vuePackage.version)) {
  failures.push('Nuxt and Vue packages must document one coordinated version.')
}

for (const [path, packageName] of installationSurfaces) {
  const source = await readFile(resolve(root, path), 'utf8')
  if (prereleaseDocs && !source.includes(`${packageName}@next`)) {
    failures.push(`${path} must install ${packageName} from the next tag during prerelease.`)
  }
  if (!prereleaseDocs && source.includes(`${packageName}@next`)) {
    failures.push(`${path} must stop using the next tag after the stable release.`)
  }
}

const publicReadmes = [
  resolve(root, 'README.md'),
  resolve(root, 'packages/nuxt/README.md'),
  resolve(root, 'packages/vue/README.md'),
]
const readmeContracts = new Map([
  [
    resolve(root, 'README.md'),
    [
      'Why use Nuxt Photo?',
      'When to use it',
      'Requirements',
      'Installation',
      'Quick start',
      'Discord',
      'Core concepts',
      'Packages',
      'Documentation',
      'Contributing and development',
      'Support and security',
      'License',
    ],
  ],
  ...['packages/nuxt/README.md', 'packages/vue/README.md'].map((path) => [
    resolve(root, path),
    [
      'Purpose',
      'Requirements',
      'Installation',
      'Quick start',
      'Exports',
      'Documentation',
      'Support and security',
      'License',
    ],
  ]),
])

const maintaining = await readFile(resolve(root, 'MAINTAINING.md'), 'utf8')
for (const heading of [
  'Daily work',
  'Documentation changes',
  'Publication',
  'Rollback',
  'Dependency automation',
  'Respond to a credential incident',
]) {
  if (!maintaining.includes(`## ${heading}`)) {
    failures.push(`MAINTAINING.md is missing the playbook: ${heading}`)
  }
}

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
  if (file.startsWith(contentRoot)) {
    const body = source.replace(/^---\n[\s\S]*?\n---\n/, '')
    if (/^# /m.test(body)) {
      failures.push(`${relative(root, file)} contains a duplicate body title`)
    }
    if (
      /^## (Conclusion|Next|Next step|Next steps|Related|See also|Summary|What's next)$/m.test(body)
    ) {
      failures.push(`${relative(root, file)} contains a generic closing section`)
    }
    if (
      /\b(?:aren['’]t|can['’]t|couldn['’]t|didn['’]t|doesn['’]t|don['’]t|hadn['’]t|hasn['’]t|haven['’]t|isn['’]t|it['’]s|shouldn['’]t|that['’]s|there['’]s|they['’]re|we['’]re|weren['’]t|what['’]s|won['’]t|wouldn['’]t|you['’]ll|you['’]re)\b/i.test(
        body,
      )
    ) {
      failures.push(`${relative(root, file)} contains a contraction`)
    }
  }
  if (readmeContracts.has(file)) {
    const label = relative(root, file)
    const headings = [...source.matchAll(/^## (.+)$/gm)].map((match) => match[1])
    const expected = readmeContracts.get(file)
    if (JSON.stringify(headings) !== JSON.stringify(expected)) {
      failures.push(`${label} has the wrong public section order: ${headings.join(' -> ')}`)
    }
    if ((source.match(/<h1 align="center">/g) ?? []).length !== 1 || /^# /m.test(source)) {
      failures.push(`${label} must contain one centered HTML H1 and no Markdown H1`)
    }
    if (!/<p align="center">[\s\S]*?<img [^>]*width="128"[^>]*>[\s\S]*?<\/p>/u.test(source)) {
      failures.push(`${label} must start with a centered 128 px product icon`)
    }
    for (const marker of ['img.shields.io/npm/v/', 'actions/workflows/ci.yml', 'license-MIT']) {
      if (!source.includes(marker)) failures.push(`${label} is missing badge marker ${marker}`)
    }
    for (const link of [
      'https://github.com/lupinum-dev/nuxt-photo',
      'https://nuxt-photo.lupinum.com',
      'https://discord.gg/RPH6SeA36N',
      ...(label === 'README.md' ? ['https://deepwiki.com/lupinum-dev/nuxt-photo'] : []),
    ]) {
      if (!source.includes(link)) failures.push(`${label} is missing canonical link ${link}`)
    }
    const expectedPackage =
      label === 'packages/vue/README.md' ? '@lupinum/vue-photo' : '@lupinum/nuxt-photo'
    if (!source.includes(expectedPackage))
      failures.push(`${label} does not identify ${expectedPackage}`)
    if (/\b(?:TODO|TBD|lorem ipsum|placeholder)\b/iu.test(source)) {
      failures.push(`${label} contains placeholder text`)
    }
    if (
      /^## (?:At a Glance|Quick Start|Public API|Support And Security|What It Provides)$/m.test(
        source,
      )
    ) {
      failures.push(`${label} contains a title-case heading`)
    }
  }
}

const expectedSections = ['1.start', '2.guides', '3.concepts', '4.reference', '5.help']
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
