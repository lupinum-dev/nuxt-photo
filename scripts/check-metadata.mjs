import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isNonRegistryDependencyReference } from './lib/local-reference.mjs'
import { discoverPackageSet, readWorkspaceCatalog } from './lib/package-set.mjs'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const packageSet = discoverPackageSet(root)
const rootManifest = readJson('package.json')
const canonicalLicense = readText('LICENSE')
const supportedNode = rootManifest.engines?.node
const packageManager = /^pnpm@(.+)$/.exec(rootManifest.packageManager ?? '')
const maintainerNode = readText('.node-version').trim()
const catalog = readWorkspaceCatalog(root)
const requiredRootScripts = [
  'build',
  'audit:all',
  'changeset',
  'check',
  'check:release-workflow',
  'check:vercel',
  'docs:build',
  'release:notes',
  'release:pack',
  'release:verify',
  'test',
  'verify',
  'version',
]
const forbiddenLifecycleScripts = [
  'prepack',
  'postpack',
  'prepublish',
  'prepublishOnly',
  'postpublish',
]
const workspaceDirectories = [
  'docs',
  'playground',
  'playground-tailwind',
  ...packageSet.packages.map((pkg) => pkg.directory),
]
const workspaceManifests = [
  { directory: '.', manifest: rootManifest },
  ...workspaceDirectories.map((directory) => ({
    directory,
    manifest: readJson(join(directory, 'package.json')),
  })),
]

assert(rootManifest.private === true, 'The workspace root must remain private.')
assert(rootManifest.type === 'module', 'The workspace root must use ESM.')
assert(packageManager, 'packageManager must pin pnpm with pnpm@<version>.')
assert(supportedNode, 'The root must declare a bounded Node support policy.')
assert(
  isSupportedNodeVersion(maintainerNode, supportedNode),
  `.node-version ${maintainerNode} must satisfy the root Node policy ${supportedNode}.`,
)

for (const script of requiredRootScripts) {
  assert(rootManifest.scripts?.[script], `Missing root script: ${script}.`)
}
for (const [name, command] of Object.entries(rootManifest.scripts ?? {})) {
  assert(
    !/\b(?:npm|pnpm|vp\s+pm)\s+publish\b/.test(command),
    `Root script ${name} must not publish packages locally.`,
  )
}

assert(
  rootManifest.devDependencies?.vite === 'catalog:',
  'The root Vite dependency must come from the workspace catalog.',
)
assert(
  rootManifest.devDependencies?.['vite-plus'] === 'catalog:',
  'Vite+ must come from the workspace catalog.',
)
assert(
  rootManifest.devDependencies?.rolldown === 'catalog:',
  'Rolldown must be explicit because Nuxt consumes the Vite+ core runtime.',
)
assert(
  !Object.hasOwn(rootManifest.devDependencies ?? {}, 'prettier'),
  'Oxfmt is the only repository formatter; remove Prettier.',
)
assert(
  rootManifest.devDependencies?.['pkg-pr-new'] === '0.0.87',
  'pkg-pr-new must remain pinned for reproducible package previews.',
)

const npmrc = readText('.npmrc')
assert(npmrc.includes('engine-strict=true'), '.npmrc must reject unsupported Node versions.')
assert(npmrc.includes('save-exact=true'), '.npmrc must save exact dependency versions by default.')

const workspacePolicy = readText('pnpm-workspace.yaml')
assert(
  catalog.vite === `npm:@voidzero-dev/vite-plus-core@${catalog['vite-plus']}`,
  'The Vite catalog alias and vite-plus package must use the same pinned version.',
)
for (const requiredPolicy of [
  "vite: 'catalog:'",
  "vitest: 'catalog:'",
  'autoInstallPeers: false',
  'enableGlobalVirtualStore: false',
  'preferFrozenLockfile: true',
  'strictPeerDependencies: true',
  'minimumReleaseAge: 1440',
]) {
  assert(
    workspacePolicy.includes(requiredPolicy),
    `pnpm-workspace.yaml is missing policy: ${requiredPolicy}`,
  )
}

assert(
  JSON.stringify(packageSet.publishOrder) ===
    JSON.stringify(['@lupinum/vue-photo', '@lupinum/nuxt-photo']),
  'The public package graph must publish Vue before Nuxt.',
)

const publicNames = new Set(packageSet.publishOrder)
for (const pkg of packageSet.packages) {
  const { manifest } = pkg
  assert(
    manifest.engines?.node === supportedNode,
    `${pkg.name} must use the root Node support policy.`,
  )
  assert(manifest.license === 'MIT', `${pkg.name} must declare MIT licensing.`)
  assert(
    manifest.author === 'Lupinum OG <info@lupinum.com> (https://lupinum.com)',
    `${pkg.name} must identify Lupinum OG as the package author.`,
  )
  assert(
    manifest.homepage === 'https://nuxt-photo.lupinum.com',
    `${pkg.name} must link to the canonical documentation site.`,
  )
  assert(
    manifest.publishConfig?.access === 'public',
    `${pkg.name} must explicitly publish with public access.`,
  )
  assert(
    JSON.stringify(manifest.files) === JSON.stringify(['dist']),
    `${pkg.name} must publish only dist plus npm's mandatory metadata files.`,
  )
  assert(
    manifest.repository?.directory === pkg.directory,
    `${pkg.name} repository.directory must be ${pkg.directory}.`,
  )
  assert(existsSync(join(root, pkg.directory, 'README.md')), `${pkg.name} is missing README.md.`)
  assert(existsSync(join(root, pkg.directory, 'LICENSE')), `${pkg.name} is missing LICENSE.`)
  assert(
    readText(join(pkg.directory, 'LICENSE')) === canonicalLicense,
    `${pkg.name} LICENSE must match the repository LICENSE.`,
  )
  assert(
    existsSync(join(root, pkg.directory, 'CHANGELOG.md')),
    `${pkg.name} is missing its Changesets-owned changelog.`,
  )

  for (const script of forbiddenLifecycleScripts) {
    assert(
      !manifest.scripts?.[script],
      `${pkg.name} must not use lifecycle script ${script}; release:pack owns builds.`,
    )
  }

  for (const dependency of pkg.internalDependencies) {
    assert(
      dependency.field === 'dependencies' || dependency.field === 'optionalDependencies',
      `${pkg.name} must not hide internal runtime ${dependency.name} in ${dependency.field}.`,
    )
    assert(
      dependency.range === 'workspace:*',
      `${pkg.name} must declare ${dependency.name} as workspace:* in source.`,
    )
  }

  for (const target of collectExportTargets(manifest.exports)) {
    assert(
      target.startsWith('./dist/'),
      `${pkg.name} export target ${target} must resolve inside dist.`,
    )
  }
  for (const field of ['main', 'module', 'types']) {
    if (!manifest[field]) continue
    assert(manifest[field].startsWith('./dist/'), `${pkg.name} ${field} must resolve inside dist.`)
  }
}

const nuxtPackage = packageSet.byName.get('@lupinum/nuxt-photo')
assert(
  nuxtPackage.manifest.dependencies?.['@lupinum/vue-photo'] === 'workspace:*',
  '@lupinum/nuxt-photo must directly depend on @lupinum/vue-photo via workspace:*.',
)

for (const { directory, manifest } of workspaceManifests) {
  if (directory !== '.') {
    assert(
      !manifest.packageManager,
      `${directory}/package.json must inherit the root packageManager declaration.`,
    )
  }
  if (!publicNames.has(manifest.name) && directory !== '.') {
    assert(
      manifest.private === true,
      `${directory}/package.json must be private because it is not published.`,
    )
  }

  for (const [field, dependencies] of dependencyMaps(manifest)) {
    for (const [name, range] of Object.entries(dependencies)) {
      assert(
        range.startsWith('workspace:') || !isNonRegistryDependencyReference(range),
        `${directory}/package.json uses forbidden non-registry reference ${field}.${name}=${range}.`,
      )
      if (range.startsWith('workspace:')) {
        assert(
          publicNames.has(name) && range === 'workspace:*',
          `${directory}/package.json has unsupported workspace reference ${name}=${range}.`,
        )
      }
    }
  }
}

for (const path of [
  'AGENTS.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'MAINTAINING.md',
  'README.md',
  'SECURITY.md',
  '.changeset/config.json',
  'renovate.json',
]) {
  assert(existsSync(join(root, path)), `Missing repository policy file: ${path}.`)
}
for (const obsoletePath of [
  '.prettierrc',
  '.prettierrc.json',
  'docs/.npmrc',
  'scripts/release/pack-dry-run.mjs',
  'scripts/release/publish.mjs',
  'scripts/release/verify-version.mjs',
  'scripts/stage-package.mjs',
]) {
  assert(
    !existsSync(join(root, obsoletePath)),
    `Obsolete maintenance path still exists: ${obsoletePath}.`,
  )
}

verifyChangesets()
verifyRenovate()
verifyWorkflows()

console.log(
  `Metadata verified for ${packageSet.publishOrder.join(' -> ')} at ${packageSet.packageSetVersion}.`,
)

function verifyChangesets() {
  const config = readJson('.changeset/config.json')
  const expected = packageSet.publishOrder.toSorted((left, right) => left.localeCompare(right))
  const fixed =
    config.fixed?.map((group) => group.toSorted((left, right) => left.localeCompare(right))) ?? []
  assert(
    fixed.some((group) => JSON.stringify(group) === JSON.stringify(expected)),
    'Changesets must keep the public package set in one fixed version group.',
  )
  assert(config.access === 'public', 'Changesets access must be public.')
  assert(config.baseBranch === 'main', 'Changesets baseBranch must be main.')
  assert(config.prettier === false, 'Changesets must defer formatting to Oxfmt.')
}

function verifyRenovate() {
  const renovate = readJson('renovate.json')
  assert(renovate.automerge === false, 'Renovate must not automerge dependency changes.')
  assert(
    renovate.extends?.includes('helpers:pinGitHubActionDigests'),
    'Renovate must preserve full GitHub Action digest pinning.',
  )
  assert(
    renovate.minimumReleaseAge === '1 day',
    'Renovate minimumReleaseAge must match pnpm at one day.',
  )
  assert(
    renovate.internalChecksFilter === 'strict',
    'Renovate must wait for ordinary updates to pass the release-age gate.',
  )
  assert(
    renovate.vulnerabilityAlerts?.enabled === true,
    'Renovate must raise vulnerability remediation pull requests.',
  )
}

function verifyWorkflows() {
  const workflowDirectory = join(root, '.github', 'workflows')
  const workflows = readdirSync(workflowDirectory)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => ({
      name,
      text: readFileSync(join(workflowDirectory, name), 'utf8'),
    }))

  assert(
    workflows.some(({ name }) => name === 'ci.yml'),
    'The authoritative ci.yml workflow is missing.',
  )
  assert(
    workflows.some(({ name }) => name === 'release.yml'),
    'The protected release.yml workflow is missing.',
  )
  assert(
    workflows.some(({ name }) => name === 'security.yml'),
    'The CodeQL security.yml workflow is missing.',
  )
  assert(
    workflows.some(({ name }) => name === 'version.yml'),
    'The Changesets version.yml workflow is missing.',
  )
  assert(
    workflows.some(({ name }) => name === 'package-preview.yml'),
    'The non-required package-preview.yml workflow is missing.',
  )

  for (const workflow of workflows) {
    assert(
      !workflow.text.includes('pull_request_target:'),
      `${workflow.name} must not use pull_request_target.`,
    )
    assert(
      !/\b(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b/.test(workflow.text),
      `${workflow.name} must use OIDC rather than a long-lived npm token.`,
    )
    if (workflow.name !== 'release.yml') {
      assert(
        !/\bnpm\s+publish\b/.test(workflow.text),
        `${workflow.name} must not publish packages.`,
      )
    }
    for (const match of workflow.text.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
      const reference = match[1]
      if (reference.startsWith('./') || reference.startsWith('docker://')) {
        continue
      }
      assert(
        /@[0-9a-f]{40}$/.test(reference),
        `${workflow.name} action is not pinned by full digest: ${reference}`,
      )
    }
  }

  const releaseWorkflow = workflows.find(({ name }) => name === 'release.yml')?.text ?? ''
  const publishJob = /^  publish:\n([\s\S]*?)(?=^  [a-z][a-z-]*:\n)/m.exec(releaseWorkflow)?.[1]
  assert(publishJob, 'release.yml is missing the npm publish job.')
  assert(publishJob.includes('id-token: write'), 'The publish job must use npm trusted publishing.')
  for (const forbidden of [
    'actions/checkout@',
    'actions/github-script@',
    'node scripts/',
    'node-version-file:',
    'npm install',
    'pnpm install',
    'vp install',
  ]) {
    assert(
      !publishJob.includes(forbidden),
      `The token-capable publish job must not contain ${forbidden}.`,
    )
  }
  assert(
    publishJob.includes("'publish', tarball") &&
      publishJob.includes("'--ignore-scripts', '--provenance'") &&
      publishJob.includes('record.channel'),
    'The publish job must submit only retained tarballs to next or latest with scripts disabled and provenance enabled.',
  )
  const releaseCreateCommand =
    releaseWorkflow.match(/gh release create[^\n]*\\\n(?:\s+[^\n]*\\\n)*\s+[^\n]*/u)?.[0] ?? ''
  assert(
    /^  github-release:\n([\s\S]*)$/m.test(releaseWorkflow) &&
      releaseCreateCommand.includes('--repo "$GITHUB_REPOSITORY"'),
    'release.yml must create the GitHub release automatically.',
  )
}

function dependencyMaps(manifest) {
  return [
    ['dependencies', manifest.dependencies ?? {}],
    ['devDependencies', manifest.devDependencies ?? {}],
    ['optionalDependencies', manifest.optionalDependencies ?? {}],
    ['peerDependencies', manifest.peerDependencies ?? {}],
  ]
}

function collectExportTargets(value) {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(collectExportTargets)
}

function readJson(path) {
  return JSON.parse(readText(path))
}

function readText(path) {
  return readFileSync(join(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isSupportedNodeVersion(version, policy) {
  const actual = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!actual) return false

  return policy.split('||').some((part) => {
    const minimum = /^\s*\^(\d+)\.(\d+)\.(\d+)\s*$/.exec(part)
    if (!minimum || actual[1] !== minimum[1]) return false
    for (let index = 2; index <= 3; index += 1) {
      const difference = Number(actual[index]) - Number(minimum[index])
      if (difference !== 0) return difference > 0
    }
    return true
  })
}
