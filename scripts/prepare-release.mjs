import { appendFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractPackageSetReleaseNotes, listPendingChangesets } from './lib/changelog.mjs'
import { compareSemver, readRegistryState, releaseChannel } from './lib/npm-registry.mjs'
import { assert, discoverPackageSet } from './lib/package-set.mjs'
import { verifyReleaseArtifact } from './lib/release-artifact.mjs'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const releaseDir =
  args[0] && !args[0].startsWith('--') ? resolve(args.shift()) : resolve('.release')

function readArgument(name, required = false) {
  const index = args.indexOf(name)
  const value = index === -1 ? undefined : args[index + 1]
  if (required) assert(value, `${name} requires a value.`)
  return value
}

const expectedSha = readArgument('--expected-sha', true)
const ciRunId = readArgument('--ci-run-id', true)
const expectedVersion = readArgument('--expected-version', true)
const summaryPath = readArgument('--summary')
const outputPath = readArgument('--github-output')
assert(/^\d+$/.test(ciRunId) && Number(ciRunId) > 0, '--ci-run-id must be a positive integer.')

const artifact = verifyReleaseArtifact(releaseDir, {
  expectedSha,
  publishable: true,
  rootDir,
})
const packageSet = discoverPackageSet(rootDir)
assert(listPendingChangesets(rootDir).length === 0, 'Publication is blocked by pending Changesets.')

const version = artifact.metadata.packageSetVersion
assert(version === expectedVersion, `Artifact version ${version} differs from ${expectedVersion}.`)
const channel = releaseChannel(version)
const packages = artifact.packages.map((pkg) => {
  const registry = readRegistryState(pkg.metadata.name, pkg.metadata.version)
  assert(
    !registry.published || registry.shasum === pkg.metadata.sha1,
    `${pkg.metadata.name}@${pkg.metadata.version} already exists with different bytes.`,
  )
  const currentChannelVersion = registry.distTags[channel] ?? null
  if (!registry.published && currentChannelVersion) {
    assert(
      compareSemver(pkg.metadata.version, currentChannelVersion) > 0,
      `${pkg.metadata.name} candidate ${pkg.metadata.version} must be newer than ${channel} ${currentChannelVersion}.`,
    )
  }
  return {
    name: pkg.metadata.name,
    version: pkg.metadata.version,
    tarball: pkg.metadata.tarball,
    sha1: pkg.metadata.sha1,
    sha256: pkg.metadata.sha256,
  }
})

const record = {
  schemaVersion: 2,
  sourceSha: artifact.metadata.sourceSha,
  ciRunId: String(ciRunId),
  version,
  tag: `v${version}`,
  channel,
  publishOrder: artifact.metadata.publishOrder,
  packages,
}
writeFileSync(join(releaseDir, 'release-record.json'), `${JSON.stringify(record, null, 2)}\n`)

const releaseNotes = extractPackageSetReleaseNotes(rootDir, packageSet)
const evidence = [
  '---',
  '',
  '## Release evidence',
  '',
  `- Source SHA: \`${record.sourceSha}\``,
  `- CI run: \`${record.ciRunId}\``,
  `- Package-set version: \`${record.version}\``,
  `- npm channel: \`${record.channel}\``,
  '',
  '| Package | Tarball | SHA-256 |',
  '|---|---|---|',
  ...record.packages.map((pkg) => `| \`${pkg.name}\` | \`${pkg.tarball}\` | \`${pkg.sha256}\` |`),
  '',
]
writeFileSync(
  join(releaseDir, 'github-release-notes.md'),
  `${releaseNotes.trim()}\n\n${evidence.join('\n')}`,
)

if (summaryPath) {
  appendFileSync(
    summaryPath,
    `${[
      `# Release plan: ${record.tag}`,
      '',
      `- Source SHA: \`${record.sourceSha}\``,
      `- CI run: \`${record.ciRunId}\``,
      `- npm channel: \`${record.channel}\``,
      '',
      'The protected job publishes only the retained tarballs in dependency order.',
      '',
      ...record.publishOrder.map((name, index) => `${index + 1}. \`${name}@${version}\``),
      '',
    ].join('\n')}\n`,
  )
}
if (outputPath) {
  appendFileSync(outputPath, `tag=${record.tag}\nchannel=${record.channel}\n`)
}

process.stdout.write(
  `release plan prepared for ${record.tag} (${record.packages.length} packages)\n`,
)
