import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
]

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function packageSlug(packageName) {
  return packageName.replace(/^@/, '').replaceAll('/', '-')
}

function normalizeDirectory(rootDir, directory) {
  return relative(rootDir, directory).split(sep).join('/')
}

function collectInternalDependencies(manifest, packageNames) {
  const internalDependencies = []

  for (const field of dependencyFields) {
    for (const [name, rangeValue] of Object.entries(manifest[field] ?? {})) {
      if (!packageNames.has(name)) {
        continue
      }
      internalDependencies.push({
        field,
        name,
        range: String(rangeValue),
      })
    }
  }

  return internalDependencies
}

export function readWorkspaceCatalog(rootDir) {
  const workspacePath = join(rootDir, 'pnpm-workspace.yaml')
  const lines = readFileSync(workspacePath, 'utf8').split(/\r?\n/)
  const catalog = {}
  let inCatalog = false

  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true
      continue
    }
    if (inCatalog && /^[^\s#][^:]*:\s*/.test(line)) {
      break
    }
    if (!inCatalog || /^\s*(?:#.*)?$/.test(line)) {
      continue
    }

    const match = /^\s{2}([^:#][^:]*):\s*(.+?)\s*$/.exec(line)
    assert(match, `Unsupported pnpm catalog entry: ${line}`)
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    catalog[match[1].trim()] = value
  }

  assert(Object.keys(catalog).length > 0, 'pnpm-workspace.yaml has no default catalog.')
  return catalog
}

export function discoverPackageSet(rootDirectory = process.cwd()) {
  const rootDir = resolve(rootDirectory)
  const packagesDirectory = join(rootDir, 'packages')
  const candidates = readdirSync(packagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const absoluteDirectory = join(packagesDirectory, entry.name)
      const manifestPath = join(absoluteDirectory, 'package.json')
      const manifest = readJson(manifestPath)
      return {
        absoluteDirectory,
        directory: normalizeDirectory(rootDir, absoluteDirectory),
        manifest,
        manifestPath,
        name: manifest.name,
        slug: packageSlug(manifest.name ?? entry.name),
        version: manifest.version,
      }
    })
    .filter(
      (pkg) => pkg.manifest.private !== true && pkg.manifest.publishConfig?.access === 'public',
    )

  assert(candidates.length > 0, 'No public packages were found in packages/*.')

  const names = new Set()
  const slugs = new Set()
  for (const pkg of candidates) {
    assert(
      typeof pkg.name === 'string' && pkg.name.length > 0,
      `${pkg.directory}/package.json must declare a package name.`,
    )
    assert(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(pkg.version),
      `${pkg.name} has an invalid SemVer version.`,
    )
    assert(!names.has(pkg.name), `Duplicate public package name: ${pkg.name}`)
    assert(!slugs.has(pkg.slug), `Duplicate package slug: ${pkg.slug}`)
    names.add(pkg.name)
    slugs.add(pkg.slug)
  }

  for (const pkg of candidates) {
    pkg.internalDependencies = collectInternalDependencies(pkg.manifest, names)
  }

  const byName = new Map(candidates.map((pkg) => [pkg.name, pkg]))
  const visiting = new Set()
  const visited = new Set()
  const publishOrder = []

  function visit(pkg) {
    if (visited.has(pkg.name)) {
      return
    }
    assert(!visiting.has(pkg.name), `Circular package dependency at ${pkg.name}.`)
    visiting.add(pkg.name)

    for (const dependency of pkg.internalDependencies
      .filter(({ field }) => field === 'dependencies' || field === 'optionalDependencies')
      .toSorted((left, right) => left.name.localeCompare(right.name))) {
      visit(byName.get(dependency.name))
    }

    visiting.delete(pkg.name)
    visited.add(pkg.name)
    publishOrder.push(pkg.name)
  }

  for (const pkg of candidates.toSorted((left, right) => left.name.localeCompare(right.name))) {
    visit(pkg)
  }

  const versions = new Set(candidates.map((pkg) => pkg.version))
  assert(versions.size === 1, 'Nuxt Photo public packages must use one fixed package-set version.')

  return {
    byName,
    packageSetVersion: candidates[0].version,
    packages: publishOrder.map((name) => byName.get(name)),
    publishOrder,
    rootDir,
    version: candidates[0].version,
  }
}

export function assertPackageSetMatchesArtifact(packageSet, metadata) {
  assert(
    metadata.packageSetVersion === packageSet.version,
    `Artifact version ${metadata.packageSetVersion} does not match source ${packageSet.version}.`,
  )
  assert(
    JSON.stringify(metadata.publishOrder) === JSON.stringify(packageSet.publishOrder),
    'Artifact publish order does not match the source package graph.',
  )

  const artifactPackages = new Map(metadata.packages.map((pkg) => [pkg.name, pkg]))
  assert(
    artifactPackages.size === packageSet.packages.length,
    'Artifact package count does not match the source package set.',
  )

  for (const sourcePackage of packageSet.packages) {
    const artifactPackage = artifactPackages.get(sourcePackage.name)
    assert(artifactPackage, `Artifact is missing ${sourcePackage.name}.`)
    assert(
      artifactPackage.version === sourcePackage.version,
      `Artifact ${sourcePackage.name} version differs from source.`,
    )
    assert(
      artifactPackage.directory === sourcePackage.directory,
      `Artifact ${sourcePackage.name} directory differs from source.`,
    )
  }
}
