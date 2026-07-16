import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { containsLocalFilesystemPath } from './lib/local-reference.mjs'
import {
  assertPackedManifestParity,
  assertRegistryDependencies,
  assertSafeLifecycleScripts,
} from './lib/package-contract.mjs'
import { verifyPackedConsumers } from './lib/packed-consumers.mjs'
import { assert, discoverPackageSet, readJson, readWorkspaceCatalog } from './lib/package-set.mjs'
import {
  readDeclaredToolchain,
  readPackedManifest,
  sha1File,
  sha256File,
  toolchainMatchesDeclared,
} from './lib/release-artifact.mjs'

const startedAt = process.hrtime.bigint()
const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const releaseDir = join(rootDir, '.release')
const firstPassDir = join(releaseDir, 'pass-a')
const secondPassDir = join(releaseDir, 'pass-b')
const unpackDir = join(releaseDir, 'unpacked')
const packageSet = discoverPackageSet(rootDir)
const catalog = readWorkspaceCatalog(rootDir)
const sourceManifests = new Map(
  packageSet.packages.map((pkg) => [pkg.name, readFileSync(pkg.manifestPath, 'utf8')]),
)

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })
  return typeof output === 'string' ? output.trim() : ''
}

function tryRun(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function assertSourceManifestsUnchanged() {
  for (const pkg of packageSet.packages) {
    assert(
      readFileSync(pkg.manifestPath, 'utf8') === sourceManifests.get(pkg.name),
      `${pkg.name} build or pack mutated its source package.json.`,
    )
  }
}

function buildAndPack(directory) {
  mkdirSync(directory, { recursive: true })

  for (const pkg of packageSet.packages) {
    rmSync(join(pkg.absoluteDirectory, 'dist'), {
      force: true,
      recursive: true,
    })
  }

  for (const pkg of packageSet.packages) {
    run('pnpm', ['--dir', pkg.absoluteDirectory, 'run', 'build'], {
      stdio: 'inherit',
    })
    assertSourceManifestsUnchanged()
  }

  const tarballs = new Map()
  for (const pkg of packageSet.packages) {
    const before = new Set(readdirSync(directory))
    run('pnpm', ['--dir', pkg.absoluteDirectory, 'pack', '--pack-destination', directory], {
      stdio: 'inherit',
    })
    assertSourceManifestsUnchanged()

    const created = readdirSync(directory).filter(
      (entry) => entry.endsWith('.tgz') && !before.has(entry),
    )
    assert(
      created.length === 1,
      `Expected one new tarball for ${pkg.name}, found ${created.length}.`,
    )
    tarballs.set(pkg.name, join(directory, created[0]))
  }

  return tarballs
}

function listPackedFiles(tarballPath) {
  return run('tar', ['-tf', tarballPath]).split('\n').filter(Boolean)
}

function collectExportTargets(value) {
  if (typeof value === 'string') {
    return [value]
  }
  if (!value || typeof value !== 'object') {
    return []
  }
  return Object.values(value).flatMap(collectExportTargets)
}

function assertPackedTarget(files, target, label) {
  if (!target?.startsWith('./')) {
    return
  }

  const packedPath = `package/${target.slice(2)}`
  if (packedPath.includes('*')) {
    const prefix = packedPath.slice(0, packedPath.indexOf('*'))
    assert(
      files.some((path) => path.startsWith(prefix)),
      `${label} target ${target} matched no packed files.`,
    )
    return
  }
  assert(files.includes(packedPath), `${label} points to missing ${target}.`)
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(path) : [path]
  })
}

function inspectSourceMaps(file, unpackedPackage) {
  const content = readFileSync(file, 'utf8')
  for (const match of content.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g)) {
    const reference = match[1]
    if (/^data:/i.test(reference)) {
      continue
    }
    assert(
      !/^[a-z][a-z+.-]*:/i.test(reference),
      `Packed file references an external source map: ${reference}.`,
    )
    const mapPath = resolve(dirname(file), reference)
    assert(
      mapPath.startsWith(`${unpackedPackage}${sep}`),
      `Packed source map reference escapes the package: ${reference}.`,
    )
    assert(existsSync(mapPath), `Packed file references missing source map ${reference}.`)
  }
}

function inspectPackage(pkg, tarballPath) {
  const packageJson = readPackedManifest(tarballPath)
  const packedFiles = listPackedFiles(tarballPath)

  assert(packageJson.name === pkg.name, `Packed ${pkg.name} has the wrong name.`)
  assert(packageJson.version === pkg.version, `Packed ${pkg.name} has the wrong version.`)
  assert(packageJson.license === 'MIT', `${pkg.name} must use the MIT license.`)
  assert(
    JSON.stringify(packageJson.files) === JSON.stringify(['dist']),
    `${pkg.name} files must allow only dist.`,
  )
  assertPackedManifestParity(pkg.manifest, packageJson, packageSet, catalog)
  assertSafeLifecycleScripts(packageJson)
  assertRegistryDependencies(packageJson)

  for (const requiredFile of ['package/package.json', 'package/README.md', 'package/LICENSE']) {
    assert(packedFiles.includes(requiredFile), `${pkg.name} tarball is missing ${requiredFile}.`)
  }
  assert(
    packedFiles.some((path) => path.startsWith('package/dist/')),
    `${pkg.name} tarball is missing dist output.`,
  )
  for (const file of packedFiles) {
    const allowed =
      file === 'package/package.json' ||
      file === 'package/README.md' ||
      file === 'package/LICENSE' ||
      file.startsWith('package/dist/')
    assert(allowed, `${pkg.name} tarball contains unexpected ${file}.`)
  }

  assertPackedTarget(packedFiles, packageJson.main, `${pkg.name} main`)
  assertPackedTarget(packedFiles, packageJson.types, `${pkg.name} types`)
  for (const target of collectExportTargets(packageJson.exports)) {
    assertPackedTarget(packedFiles, target, `${pkg.name} exports`)
  }

  const unpackedPackage = join(unpackDir, pkg.slug, 'package')
  mkdirSync(dirname(unpackedPackage), { recursive: true })
  run('tar', ['-xzf', tarballPath, '-C', dirname(unpackedPackage)])

  for (const file of walkFiles(unpackedPackage)) {
    if (/\.(?:[cm]?[jt]s|d\.[cm]?ts|css|json|md|vue)$/i.test(file)) {
      const content = readFileSync(file, 'utf8')
      assert(
        !containsLocalFilesystemPath(content, rootDir),
        `${pkg.name} packed file contains a local filesystem path: ${file}`,
      )
    }
    if (/\.(?:[cm]?js|css|d\.[cm]?ts|vue)$/i.test(file)) {
      inspectSourceMaps(file, unpackedPackage)
    }
  }

  run('pnpm', ['exec', 'publint', 'run', tarballPath, '--strict'], {
    stdio: 'inherit',
  })

  return packageJson
}

rmSync(releaseDir, { force: true, recursive: true })
mkdirSync(releaseDir, { recursive: true })

const firstPass = buildAndPack(firstPassDir)
const secondPass = buildAndPack(secondPassDir)
const retainedPackages = []

for (const pkg of packageSet.packages) {
  const firstTarball = firstPass.get(pkg.name)
  const secondTarball = secondPass.get(pkg.name)
  assert(
    basename(firstTarball) === basename(secondTarball),
    `${pkg.name} repeated packs produced different filenames.`,
  )
  assert(
    sha256File(firstTarball) === sha256File(secondTarball),
    `${pkg.name} repeated clean build-and-pack passes were not byte-identical.`,
  )

  const retainedTarball = join(releaseDir, basename(firstTarball))
  copyFileSync(firstTarball, retainedTarball)
  const packageJson = inspectPackage(pkg, retainedTarball)
  retainedPackages.push({
    metadata: {
      name: pkg.name,
      version: pkg.version,
      directory: pkg.directory,
      tarball: basename(retainedTarball),
      sha1: sha1File(retainedTarball),
      sha256: sha256File(retainedTarball),
    },
    packageJson,
    tarballPath: retainedTarball,
  })
}

rmSync(firstPassDir, { force: true, recursive: true })
rmSync(secondPassDir, { force: true, recursive: true })
rmSync(unpackDir, { force: true, recursive: true })
assertSourceManifestsUnchanged()

verifyPackedConsumers(rootDir, retainedPackages)

const sourceSha = tryRun('git', ['rev-parse', 'HEAD'])
const worktreeStatus = tryRun('git', ['status', '--porcelain=v1', '--untracked-files=all'])
const worktreeDirty = worktreeStatus === null ? null : worktreeStatus.length > 0
if (process.env.CI === 'true') {
  assert(sourceSha, 'CI release candidates require a Git commit.')
  assert(worktreeDirty === false, 'CI release candidates require a clean tree.')
}

const toolchain = {
  node: process.version,
  npm: run('npm', ['--version']),
  pnpm: run('pnpm', ['--version']),
  vitePlus: readJson(join(rootDir, 'node_modules', 'vite-plus', 'package.json')).version,
}
const declaredToolchain = readDeclaredToolchain(rootDir)
const metadata = {
  schemaVersion: 1,
  sourceSha,
  worktreeDirty,
  releaseEligible:
    Boolean(sourceSha) &&
    worktreeDirty === false &&
    toolchainMatchesDeclared(toolchain, declaredToolchain),
  reproduciblePasses: 2,
  packageSetVersion: packageSet.packageSetVersion,
  publishOrder: packageSet.publishOrder,
  toolchain,
  packages: retainedPackages.map(({ metadata: packageMetadata }) => packageMetadata),
}

writeFileSync(join(releaseDir, 'release-artifact.json'), `${JSON.stringify(metadata, null, 2)}\n`)

const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9
process.stdout.write(
  `release package set verified: ${packageSet.packageSetVersion} (${packageSet.packages.length} packages) in ${durationSeconds.toFixed(2)}s\n`,
)
