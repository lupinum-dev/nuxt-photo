import { isDeepStrictEqual } from 'node:util'

import { isNonRegistryDependencyReference } from './local-reference.mjs'
import { assert } from './package-set.mjs'

const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
]

const forbiddenLifecycleScripts = [
  'preinstall',
  'install',
  'postinstall',
  'prepare',
  'prepack',
  'prepublish',
  'prepublishOnly',
  'publish',
  'postpublish',
]

function normalizeDependencyRange(name, rangeValue, packageSet, catalog) {
  const range = String(rangeValue)

  if (range === 'catalog:') {
    const resolved = catalog[name]
    assert(resolved, `Catalog has no version for ${name}.`)
    return resolved
  }
  assert(
    !range.startsWith('catalog:'),
    `${name} uses an unsupported named catalog reference: ${range}.`,
  )

  if (range.startsWith('workspace:')) {
    const target = packageSet.byName.get(name)
    assert(target, `Workspace dependency ${name} is not a public package-set member.`)
    assert(
      range === 'workspace:*',
      `${name} must use workspace:* so the packed range is the exact package-set version.`,
    )
    return target.version
  }

  return range
}

export function expectedPackedManifest(sourceManifest, packageSet, catalog) {
  const expected = structuredClone(sourceManifest)

  for (const field of dependencyFields) {
    if (!expected[field]) {
      continue
    }
    for (const [name, range] of Object.entries(expected[field])) {
      expected[field][name] = normalizeDependencyRange(name, range, packageSet, catalog)
    }
  }

  return expected
}

export function assertPackedManifestParity(sourceManifest, packedManifest, packageSet, catalog) {
  const expected = expectedPackedManifest(sourceManifest, packageSet, catalog)
  assert(
    isDeepStrictEqual(expected, packedManifest),
    `Packed ${sourceManifest.name} package.json differs from the reviewed source after permitted pnpm rewrites.`,
  )
}

export function assertSafeLifecycleScripts(manifest) {
  for (const script of forbiddenLifecycleScripts) {
    assert(
      manifest.scripts?.[script] === undefined,
      `${manifest.name} must not publish the ${script} lifecycle script.`,
    )
  }
}

export function assertRegistryDependencies(manifest) {
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      assert(
        !isNonRegistryDependencyReference(range),
        `${manifest.name} ${field}.${name} must use a registry version, not ${range}.`,
      )
    }
  }
}
