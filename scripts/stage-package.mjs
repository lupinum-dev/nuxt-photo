import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compareSemver, readRegistryState } from './lib/npm-registry.mjs'
import { assert } from './lib/package-set.mjs'
import { verifyReleaseRecord } from './lib/release-record.mjs'

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

const packageName = readArgument('--package', true)
const expectedSha = readArgument('--expected-sha', true)
const { artifact, record } = verifyReleaseRecord(releaseDir, {
  expectedSha,
  publishable: true,
  rootDir,
})
const packageRecord = record.packages.find((pkg) => pkg.name === packageName)
assert(packageRecord, `${packageName} is not in the approved package set.`)
const artifactPackage = artifact.packages.find((pkg) => pkg.metadata.name === packageName)

const npmVersion = execFileSync('npm', ['--version'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim()
assert(
  compareSemver(npmVersion, '11.15.0') >= 0,
  `npm staged publishing requires npm 11.15.0 or newer, received ${npmVersion}.`,
)

const registry = readRegistryState(packageName, packageRecord.version)
assert(
  !registry.published,
  `${packageName}@${packageRecord.version} is already public. Resume release finalization instead of staging again.`,
)
assert(
  (registry.distTags[record.channel] ?? null) === packageRecord.previousChannelVersion,
  `${packageName} ${record.channel} changed after approval planning.`,
)
assert(
  (registry.distTags[record.stagingTag] ?? null) === packageRecord.previousStagingVersion,
  `${packageName} ${record.stagingTag} changed after approval planning.`,
)

const output = execFileSync(
  'npm',
  [
    'stage',
    'publish',
    artifactPackage.tarballPath,
    '--tag',
    record.stagingTag,
    '--access',
    'public',
    '--ignore-scripts',
    '--provenance',
    '--json',
  ],
  {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  },
)
const parsed = JSON.parse(output)
// npm 11.16 emits stage-publish JSON under the package-name key and adds the
// UUID stageId only after a successful non-dry-run stage. Revalidate this
// parser before changing the release job's npm major/minimum.
const details = parsed[packageName] ?? parsed
assert(
  typeof details.stageId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      details.stageId,
    ),
  `npm did not return a valid stage ID for ${packageName}.`,
)
assert(
  details.name === undefined || details.name === packageName,
  `npm staged ${details.name}, expected ${packageName}.`,
)
assert(
  details.version === undefined || details.version === packageRecord.version,
  `npm staged ${details.version}, expected ${packageRecord.version}.`,
)
assert(
  details.shasum === undefined || details.shasum === packageRecord.sha1,
  `npm staged output SHA-1 differs for ${packageName}.`,
)

const stageRecord = {
  schemaVersion: 1,
  sourceSha: record.sourceSha,
  ciRunId: record.ciRunId,
  package: packageName,
  version: packageRecord.version,
  stagingTag: record.stagingTag,
  stageId: details.stageId,
  tarball: packageRecord.tarball,
  sha1: packageRecord.sha1,
  sha256: packageRecord.sha256,
}
const stagesDir = join(releaseDir, 'stages')
mkdirSync(stagesDir, { recursive: true })
const stagePath = join(stagesDir, `${packageName.replace(/^@/, '').replaceAll('/', '-')}.json`)
writeFileSync(stagePath, `${JSON.stringify(stageRecord, null, 2)}\n`)

process.stdout.write(`staged ${packageName}@${packageRecord.version} as ${stageRecord.stageId}\n`)
