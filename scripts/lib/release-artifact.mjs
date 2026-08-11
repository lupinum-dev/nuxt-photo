import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

import {
  assert,
  assertPackageSetMatchesArtifact,
  discoverPackageSet,
  readJson,
  readWorkspaceCatalog,
} from './package-set.mjs'

export function readDeclaredToolchain(rootDir) {
  const rootManifest = readJson(join(rootDir, 'package.json'))
  const packageManager = /^pnpm@(.+)$/.exec(rootManifest.packageManager ?? '')
  assert(packageManager, 'packageManager must pin pnpm with pnpm@<version>.')

  const node = readFileSync(join(rootDir, '.node-version'), 'utf8').trim()
  assert(node, '.node-version must declare the maintainer Node version.')

  const vitePlus = readWorkspaceCatalog(rootDir)['vite-plus']
  assert(vitePlus, 'The workspace catalog must pin vite-plus.')

  return {
    node: node.startsWith('v') ? node : `v${node}`,
    pnpm: packageManager[1],
    vitePlus,
  }
}

export function toolchainMatchesDeclared(actual, declared) {
  return ['node', 'pnpm', 'vitePlus'].every((name) => actual[name] === declared[name])
}

export function hashFile(path, algorithm) {
  const hash = createHash(algorithm)
  hash.update(readFileSync(path))
  return hash.digest('hex')
}

export function sha1File(path) {
  return hashFile(path, 'sha1')
}

export function sha256File(path) {
  return hashFile(path, 'sha256')
}

export function readPackedManifest(tarballPath) {
  const raw = execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return JSON.parse(raw)
}

export function readReleaseArtifact(directory) {
  const artifactDirectory = resolve(directory)
  const metadataPath = resolve(artifactDirectory, 'release-artifact.json')
  assert(existsSync(metadataPath), `Missing artifact metadata: ${metadataPath}`)

  const metadata = readJson(metadataPath)
  assert(metadata.schemaVersion === 1, 'Unsupported release artifact schema.')
  assert(
    Array.isArray(metadata.packages) && metadata.packages.length > 0,
    'Release artifact has no packages.',
  )
  assert(Array.isArray(metadata.publishOrder), 'Release artifact has no publish order.')
  assert(
    metadata.sourceSha === null ||
      (typeof metadata.sourceSha === 'string' &&
        /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(metadata.sourceSha)),
    'Release artifact has an invalid source SHA.',
  )
  assert(
    metadata.worktreeDirty === null || typeof metadata.worktreeDirty === 'boolean',
    'Release artifact has invalid worktree state.',
  )
  assert(typeof metadata.releaseEligible === 'boolean', 'Release artifact eligibility is invalid.')
  if (metadata.releaseEligible) {
    assert(
      typeof metadata.sourceSha === 'string' && metadata.worktreeDirty === false,
      'A release-eligible artifact must come from a clean Git commit.',
    )
  }
  assert(
    metadata.toolchain &&
      ['node', 'npm', 'pnpm', 'vitePlus'].every(
        (name) => typeof metadata.toolchain[name] === 'string' && metadata.toolchain[name],
      ),
    'Release artifact has incomplete toolchain evidence.',
  )

  const packages = metadata.packages.map((pkg) => {
    assert(
      basename(pkg.tarball) === pkg.tarball,
      `Artifact tarball must be a basename: ${pkg.tarball}`,
    )
    const tarballPath = resolve(artifactDirectory, pkg.tarball)
    assert(existsSync(tarballPath), `Missing release tarball: ${tarballPath}`)
    return {
      metadata: pkg,
      packageJson: readPackedManifest(tarballPath),
      tarballPath,
    }
  })

  return {
    artifactDirectory,
    metadata,
    metadataPath,
    packages,
  }
}

export function verifyReleaseArtifact(
  directory,
  { expectedSha, publishable = false, rootDir } = {},
) {
  const artifact = readReleaseArtifact(directory)
  const names = new Set()
  const tarballs = new Set()

  assert(
    artifact.metadata.reproduciblePasses === 2,
    'Candidate was not proven by two clean reproducible passes.',
  )
  assert(
    artifact.metadata.packageSetVersion &&
      artifact.packages.every(
        (pkg) => pkg.metadata.version === artifact.metadata.packageSetVersion,
      ),
    'Artifact package-set versions are inconsistent.',
  )

  for (const pkg of artifact.packages) {
    assert(!names.has(pkg.metadata.name), `Duplicate artifact package ${pkg.metadata.name}.`)
    assert(
      !tarballs.has(pkg.metadata.tarball),
      `Duplicate artifact tarball ${pkg.metadata.tarball}.`,
    )
    names.add(pkg.metadata.name)
    tarballs.add(pkg.metadata.tarball)

    assert(
      sha256File(pkg.tarballPath) === pkg.metadata.sha256,
      `${pkg.metadata.name} SHA-256 differs from release metadata.`,
    )
    assert(
      sha1File(pkg.tarballPath) === pkg.metadata.sha1,
      `${pkg.metadata.name} SHA-1 differs from release metadata.`,
    )
    assert(
      pkg.packageJson.name === pkg.metadata.name,
      `${pkg.metadata.name} packed name differs from release metadata.`,
    )
    assert(
      pkg.packageJson.version === pkg.metadata.version,
      `${pkg.metadata.name} packed version differs from release metadata.`,
    )
  }

  assert(
    artifact.metadata.publishOrder.length === names.size &&
      new Set(artifact.metadata.publishOrder).size === names.size &&
      artifact.metadata.publishOrder.every((name) => names.has(name)),
    'Artifact publish order does not cover the package set exactly once.',
  )

  const actualTarballs = readdirSync(artifact.artifactDirectory)
    .filter((entry) => entry.endsWith('.tgz'))
    .toSorted()
  assert(
    JSON.stringify(actualTarballs) ===
      JSON.stringify([...tarballs].toSorted((left, right) => left.localeCompare(right))),
    'Release directory contains unrecorded or missing tarballs.',
  )

  if (expectedSha) {
    assert(
      artifact.metadata.sourceSha === expectedSha,
      `Artifact SHA ${artifact.metadata.sourceSha} does not match ${expectedSha}.`,
    )
  }

  if (rootDir) {
    assertPackageSetMatchesArtifact(discoverPackageSet(rootDir), artifact.metadata)
    const declaredToolchain = readDeclaredToolchain(rootDir)
    const toolchainMatches = toolchainMatchesDeclared(
      artifact.metadata.toolchain,
      declaredToolchain,
    )
    assert(
      artifact.metadata.releaseEligible ===
        (typeof artifact.metadata.sourceSha === 'string' &&
          artifact.metadata.worktreeDirty === false &&
          toolchainMatches),
      'Release artifact eligibility does not match its source and declared toolchain.',
    )
  }

  if (publishable) {
    assert(
      artifact.metadata.releaseEligible === true,
      'Artifact metadata does not authorize publication.',
    )
    assert(
      artifact.metadata.worktreeDirty === false,
      'A dirty-worktree artifact cannot be published.',
    )
    for (const pkg of artifact.packages) {
      assert(pkg.packageJson.private !== true, `${pkg.metadata.name} is private.`)
      assert(pkg.packageJson.version !== '0.0.0', `${pkg.metadata.name} uses reserved 0.0.0.`)
    }
  }

  return artifact
}
