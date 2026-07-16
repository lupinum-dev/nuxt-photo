import { appendFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractPackageSetReleaseNotes, listPendingChangesets } from './lib/changelog.mjs'
import { compareSemver, readRegistryState, releaseChannel } from './lib/npm-registry.mjs'
import { assert, discoverPackageSet } from './lib/package-set.mjs'
import {
  createPackageReleaseRecord,
  releasePackageMatrix,
  stagingTagForRun,
} from './lib/release-record.mjs'
import { verifyReleaseArtifact } from './lib/release-artifact.mjs'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const releaseDir =
  args[0] && !args[0].startsWith('--') ? resolve(args.shift()) : resolve('.release')

function readArgument(name, required = false) {
  const index = args.indexOf(name)
  const value = index === -1 ? undefined : args[index + 1]
  if (required) {
    assert(value, `${name} requires a value.`)
  }
  return value
}

const expectedSha = readArgument('--expected-sha', true)
const ciRunId = readArgument('--ci-run-id', true)
const summaryPath = readArgument('--summary')
const outputPath = readArgument('--github-output')
assert(
  Number.isSafeInteger(Number(ciRunId)) && Number(ciRunId) > 0,
  '--ci-run-id must be a positive integer.',
)

const artifact = verifyReleaseArtifact(releaseDir, {
  expectedSha,
  publishable: true,
  rootDir,
})
const packageSet = discoverPackageSet(rootDir)
const pendingChangesets = listPendingChangesets(rootDir)
assert(
  pendingChangesets.length === 0,
  `Publication is blocked by pending Changesets: ${pendingChangesets.join(', ')}.`,
)

const version = artifact.metadata.packageSetVersion
const channel = releaseChannel(version)
const stagingTag = stagingTagForRun(ciRunId)
const releaseNotes = extractPackageSetReleaseNotes(rootDir, packageSet)
const packageRecords = []

for (const pkg of artifact.packages) {
  const registry = readRegistryState(pkg.metadata.name, pkg.metadata.version)
  assert(
    !registry.published,
    `${pkg.metadata.name}@${pkg.metadata.version} already exists. Resume the original release run instead of preparing new bytes.`,
  )
  const currentChannelVersion = registry.distTags[channel] ?? null
  if (currentChannelVersion) {
    assert(
      compareSemver(pkg.metadata.version, currentChannelVersion) > 0,
      `${pkg.metadata.name} candidate ${pkg.metadata.version} must be newer than ${channel} ${currentChannelVersion}.`,
    )
  }
  packageRecords.push(createPackageReleaseRecord(pkg, registry, channel, stagingTag))
}

const previousChannelVersions = new Set(packageRecords.map((pkg) => pkg.previousChannelVersion))
assert(
  previousChannelVersions.size === 1,
  `The ${channel} tags are not aligned across the fixed package set.`,
)
const previousStagingVersions = new Set(packageRecords.map((pkg) => pkg.previousStagingVersion))
assert(
  previousStagingVersions.size === 1,
  `The ${stagingTag} tags are not aligned across the fixed package set.`,
)

const record = {
  schemaVersion: 1,
  sourceSha: artifact.metadata.sourceSha,
  ciRunId: String(ciRunId),
  version,
  tag: `v${version}`,
  channel,
  stagingTag,
  publishOrder: artifact.metadata.publishOrder,
  packages: packageRecords,
}
const recordPath = join(releaseDir, 'release-record.json')
const releaseNotesPath = join(releaseDir, 'github-release-notes.md')
writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`)

const evidenceLines = [
  '---',
  '',
  '## Release evidence',
  '',
  `- Source SHA: \`${record.sourceSha}\``,
  `- CI run: \`${record.ciRunId}\``,
  `- Package-set version: \`${record.version}\``,
  `- npm staging tag: \`${record.stagingTag}\``,
  `- npm final channel: \`${record.channel}\``,
  '',
  '| Package | Tarball | SHA-1 | SHA-256 |',
  '|---|---|---|---|',
  ...record.packages.map(
    (pkg) => `| \`${pkg.name}\` | \`${pkg.tarball}\` | \`${pkg.sha1}\` | \`${pkg.sha256}\` |`,
  ),
  '',
]
writeFileSync(releaseNotesPath, `${releaseNotes.trim()}\n\n${evidenceLines.join('\n')}`)

const previousChannelVersion = [...previousChannelVersions][0] ?? 'not set'
const previousStagingVersion = [...previousStagingVersions][0] ?? 'not set'
const summary = [
  `# Staged release plan: ${record.tag}`,
  '',
  '| Field | Value |',
  '|---|---|',
  `| Source SHA | \`${record.sourceSha}\` |`,
  `| CI run | \`${record.ciRunId}\` |`,
  `| Version | \`${record.version}\` |`,
  `| Internal staging tag | \`${record.stagingTag}\` |`,
  `| Final channel | \`${record.channel}\` |`,
  `| Previous staging target | \`${previousStagingVersion}\` |`,
  `| Previous final target | \`${previousChannelVersion}\` |`,
  '',
  '## Exact package set',
  '',
  '| Order | Package | Tarball | SHA-256 |',
  '|---:|---|---|---|',
  ...record.publishOrder.map((name, index) => {
    const pkg = record.packages.find((candidate) => candidate.name === name)
    return `| ${index + 1} | \`${name}\` | \`${pkg.tarball}\` | \`${pkg.sha256}\` |`
  }),
  '',
  'The OIDC job may submit only these retained tarballs to npm staged publishing.',
  `No \`${record.channel}\` tag changes during staging.`,
  '',
  '## Reviewed release contents',
  '',
  releaseNotes.trim(),
  '',
]

if (summaryPath) {
  appendFileSync(summaryPath, `${summary.join('\n')}\n`)
}
if (outputPath) {
  appendFileSync(
    outputPath,
    [
      `tag=${record.tag}`,
      `channel=${record.channel}`,
      `package_matrix=${JSON.stringify(releasePackageMatrix(record))}`,
      '',
    ].join('\n'),
  )
}

process.stdout.write(
  `release plan prepared for ${record.tag} (${record.packages.length} packages)\n`,
)
