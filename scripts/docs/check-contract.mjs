import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const contentRoot = resolve(root, 'docs/content/docs')
const failures = []

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
    }),
  )
  return nested.flat()
}

function routeFor(file) {
  const segments = relative(contentRoot, file)
    .split('/')
    .map((segment) => segment.replace(/^\d+\./, '').replace(/\.md$/, ''))
  return `/docs/${segments.join('/')}`
}

function namesFromBlock(source, startPattern) {
  const block = source.match(new RegExp(`${startPattern}<[^{]*\\{([\\s\\S]*?)\\n\\}>`))?.[1] ?? ''
  return [...block.matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\??:/gm)].map((match) => match[1])
}

function requireMarkers(label, source, markers) {
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${label} is missing documented ${marker}.`)
  }
}

const files = await markdownFiles(contentRoot)
const sources = new Map(
  await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])),
)

for (const [file, source] of sources) {
  const ownRoute = routeFor(file)
  const links = source.matchAll(/(?:to=["']|\]\()(?<url>\/docs\/[^"')#}]+)(?:#[^"')}]+)?/g)
  for (const match of links) {
    if (match.groups?.url === ownRoute) {
      failures.push(`${relative(root, file)} contains a semantic self-link to ${ownRoute}.`)
    }
  }

  const allowsVueImports =
    file.endsWith('/1.start/5.plain-vue.md') || file.endsWith('/4.reference/12.package-exports.md')
  if (
    !allowsVueImports &&
    /(?:from\s+|import\s+)["']@lupinum\/vue-photo(?:\/[^"']*)?["']/.test(source)
  ) {
    failures.push(`${relative(root, file)} imports the Vue package from a Nuxt consumer example.`)
  }
}

const componentContracts = [
  ['Photo', '4.reference/2.photo.md'],
  ['PhotoAlbum', '4.reference/3.photo-album.md'],
  ['PhotoGroup', '4.reference/4.photo-group.md'],
  ['PhotoCarousel', '4.reference/5.photo-carousel.md'],
  ['Lightbox', '4.reference/6.lightbox.md'],
]

for (const [component, docsPath] of componentContracts) {
  const source = await readFile(
    resolve(root, `packages/vue/src/components/${component}.vue`),
    'utf8',
  )
  const docs = await readFile(resolve(contentRoot, docsPath), 'utf8')
  requireMarkers(`${component} reference`, docs, namesFromBlock(source, 'defineProps'))
  requireMarkers(`${component} reference`, docs, namesFromBlock(source, 'defineEmits'))
  requireMarkers(`${component} reference`, docs, namesFromBlock(source, 'defineSlots'))

  const exposed = source.match(/defineExpose\(\{([^}]+)\}\)/)?.[1]
  if (exposed) {
    requireMarkers(
      `${component} reference`,
      docs,
      exposed.split(',').map((name) => name.trim()),
    )
  }
}

const primitivesDocs = await readFile(resolve(contentRoot, '4.reference/7.primitives.md'), 'utf8')
for (const primitive of [
  'LightboxProvider',
  'LightboxRoot',
  'LightboxOverlay',
  'LightboxViewport',
  'LightboxSlide',
  'LightboxControls',
  'LightboxCaption',
  'PhotoTrigger',
  'PhotoImage',
]) {
  const source = await readFile(
    resolve(root, `packages/vue/src/primitives/${primitive}.vue`),
    'utf8',
  )
  requireMarkers('Primitives reference', primitivesDocs, namesFromBlock(source, 'defineProps'))
  requireMarkers('Primitives reference', primitivesDocs, namesFromBlock(source, 'defineSlots'))
}

const labelsSource = await readFile(resolve(root, 'packages/vue/src/provide/labels.ts'), 'utf8')
const labelsDocs = await readFile(
  resolve(contentRoot, '4.reference/9.configuration-and-labels.md'),
  'utf8',
)
const labelBlock = labelsSource.match(/interface PhotoLabels \{([\s\S]*?)\n\}/)?.[1] ?? ''
const labelNames = [...labelBlock.matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):/gm)].map(
  (match) => match[1],
)
requireMarkers('Configuration and labels reference', labelsDocs, labelNames)

const cssDocs = await readFile(resolve(contentRoot, '4.reference/11.css.md'), 'utf8')
const publicCssFiles = ['lightbox-theme.css', 'carousel-theme.css', 'carousel-structure.css']
const cssVariables = new Set()
for (const filename of publicCssFiles) {
  const source = await readFile(resolve(root, 'packages/vue/src/styles', filename), 'utf8')
  for (const match of source.matchAll(/--np-[a-z0-9-]+/g)) cssVariables.add(match[0])
}
requireMarkers('CSS reference', cssDocs, [...cssVariables])

const typeDocs = await readFile(resolve(contentRoot, '4.reference/10.types.md'), 'utf8')
requireMarkers('Types reference', typeDocs, [
  'LightboxHandle',
  'LightboxController',
  'LightboxProviderController',
  'PhotoLabels',
  'PhotoDefaults',
  'PhotoCarouselAutoplayOptions',
  'ResponsivePhotoSizes',
  'LightboxControlsSlotProps',
  'LightboxCaptionSlotProps',
  'LightboxSlideSlotProps',
  'LightboxViewportSlotProps',
  'CarouselSlideSlotProps',
  'CarouselThumbSlotProps',
  'CarouselCaptionSlotProps',
  'CarouselControlsSlotProps',
  'CarouselDotsSlotProps',
])

const exportsDocs = await readFile(
  resolve(contentRoot, '4.reference/12.package-exports.md'),
  'utf8',
)
const supportedEntryPoints = new Set()
for (const packagePath of ['packages/nuxt/package.json', 'packages/vue/package.json']) {
  const manifest = JSON.parse(await readFile(resolve(root, packagePath), 'utf8'))
  for (const subpath of Object.keys(manifest.exports)) {
    const documentedPath = subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`
    supportedEntryPoints.add(documentedPath)
    if (!exportsDocs.includes(`\`${documentedPath}\``)) {
      failures.push(`Package exports reference is missing ${documentedPath}.`)
    }
  }
}
for (const match of exportsDocs.matchAll(
  /`(?<entry>@lupinum\/(?:nuxt|vue)-photo(?:\/[a-z.-]+)?)`/g,
)) {
  const entry = match.groups?.entry
  if (entry && !supportedEntryPoints.has(entry)) {
    failures.push(`Package exports reference lists unsupported entry ${entry}.`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  process.stdout.write('Documentation source contracts verified.\n')
}
