import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { releaseChannel } from './npm-registry.mjs'
import { assert, readJson } from './package-set.mjs'
import { verifyReleaseArtifact } from './release-artifact.mjs'

export function stagingTagForRun(ciRunId) {
  assert(/^[1-9]\d*$/.test(String(ciRunId)), 'CI run ID must be a positive integer.')
  return `lupinum-stage-${ciRunId}`
}

function expectedTag(version) {
  return `v${version}`
}

function rollbackCommand(packageName, version, tag) {
  return version
    ? `npm dist-tag add ${packageName}@${version} ${tag}`
    : `npm dist-tag rm ${packageName} ${tag}`
}

export function createPackageReleaseRecord(pkg, registry, channel, stagingTag) {
  const previousChannelVersion = registry.distTags[channel] ?? null
  const previousStagingVersion = registry.distTags[stagingTag] ?? null
  return {
    name: pkg.metadata.name,
    version: pkg.metadata.version,
    directory: pkg.metadata.directory,
    tarball: pkg.metadata.tarball,
    sha1: pkg.metadata.sha1,
    sha256: pkg.metadata.sha256,
    previousChannelVersion,
    previousStagingVersion,
    promoteCommand: `npm dist-tag add ${pkg.metadata.name}@${pkg.metadata.version} ${channel}`,
    rollbackChannelCommand: rollbackCommand(pkg.metadata.name, previousChannelVersion, channel),
    rollbackStagingCommand: rollbackCommand(pkg.metadata.name, previousStagingVersion, stagingTag),
  }
}

export function readReleaseRecord(directory) {
  const releaseDirectory = resolve(directory)
  const recordPath = join(releaseDirectory, 'release-record.json')
  assert(existsSync(recordPath), `Missing release record: ${recordPath}`)
  return {
    record: readJson(recordPath),
    recordPath,
    releaseDirectory,
  }
}

export function verifyReleaseRecord(directory, { expectedSha, publishable = true, rootDir } = {}) {
  const artifact = verifyReleaseArtifact(directory, {
    expectedSha,
    publishable,
    rootDir,
  })
  const { record, recordPath, releaseDirectory } = readReleaseRecord(directory)
  assert(record.schemaVersion === 1, 'Unsupported release record schema.')
  assert(
    typeof record.ciRunId === 'string' && /^[1-9]\d*$/.test(record.ciRunId),
    'Release record ciRunId must be a positive integer.',
  )
  assert(record.sourceSha === artifact.metadata.sourceSha, 'Release record SHA differs.')
  assert(record.version === artifact.metadata.packageSetVersion, 'Release record version differs.')
  assert(record.tag === expectedTag(record.version), 'Release record tag differs.')
  assert(record.channel === releaseChannel(record.version), 'Release record channel differs.')
  assert(
    record.stagingTag === stagingTagForRun(record.ciRunId),
    'Release record staging tag differs.',
  )
  assert(
    JSON.stringify(record.publishOrder) === JSON.stringify(artifact.metadata.publishOrder),
    'Release record publish order differs.',
  )
  assert(
    existsSync(join(releaseDirectory, 'github-release-notes.md')),
    'Release record is missing GitHub release notes.',
  )

  assert(Array.isArray(record.packages), 'Release record has no packages.')
  const artifactByName = new Map(artifact.packages.map((pkg) => [pkg.metadata.name, pkg]))
  assert(
    record.packages.length === artifact.packages.length,
    'Release record package count differs.',
  )
  const recordPackageNames = new Set(record.packages.map((pkg) => pkg.name))
  assert(
    recordPackageNames.size === artifactByName.size &&
      [...artifactByName.keys()].every((name) => recordPackageNames.has(name)),
    'Release record packages do not cover the artifact package set exactly once.',
  )

  for (const packageRecord of record.packages) {
    const artifactPackage = artifactByName.get(packageRecord.name)
    assert(artifactPackage, `Release record has unknown package ${packageRecord.name}.`)
    for (const [field, expected] of [
      ['version', artifactPackage.metadata.version],
      ['directory', artifactPackage.metadata.directory],
      ['tarball', artifactPackage.metadata.tarball],
      ['sha1', artifactPackage.metadata.sha1],
      ['sha256', artifactPackage.metadata.sha256],
    ]) {
      assert(
        packageRecord[field] === expected,
        `${packageRecord.name} release record ${field} differs.`,
      )
    }
    assert(
      packageRecord.previousChannelVersion === null ||
        typeof packageRecord.previousChannelVersion === 'string',
      `${packageRecord.name} previous channel target is invalid.`,
    )
    assert(
      packageRecord.previousStagingVersion === null ||
        typeof packageRecord.previousStagingVersion === 'string',
      `${packageRecord.name} previous staging target is invalid.`,
    )
    assert(
      packageRecord.promoteCommand ===
        `npm dist-tag add ${packageRecord.name}@${packageRecord.version} ${record.channel}`,
      `${packageRecord.name} promotion command differs.`,
    )
    assert(
      packageRecord.rollbackChannelCommand ===
        rollbackCommand(packageRecord.name, packageRecord.previousChannelVersion, record.channel),
      `${packageRecord.name} channel rollback command differs.`,
    )
    assert(
      packageRecord.rollbackStagingCommand ===
        rollbackCommand(
          packageRecord.name,
          packageRecord.previousStagingVersion,
          record.stagingTag,
        ),
      `${packageRecord.name} staging rollback command differs.`,
    )
  }

  return {
    artifact,
    record,
    recordPath,
    releaseDirectory,
  }
}

export function releasePackageMatrix(record) {
  const packagesByName = new Map(record.packages.map((pkg) => [pkg.name, pkg]))
  return {
    include: record.publishOrder.map((name) => {
      const pkg = packagesByName.get(name)
      return {
        name,
        slug: name.replace(/^@/, '').replaceAll('/', '-'),
        tarball: pkg.tarball,
        version: pkg.version,
        sha1: pkg.sha1,
        sha256: pkg.sha256,
        channel: record.channel,
        stagingTag: record.stagingTag,
        previousChannelVersion: pkg.previousChannelVersion,
        previousStagingVersion: pkg.previousStagingVersion,
      }
    }),
  }
}
