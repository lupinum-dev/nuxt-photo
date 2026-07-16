import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hasAttestations, readRegistryState } from './lib/npm-registry.mjs'
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

const expectedSha = readArgument('--expected-sha', true)
const wait = args.includes('--wait')

const { record } = verifyReleaseRecord(releaseDir, {
  expectedSha,
  publishable: true,
  rootDir,
})
const attempts = wait ? 24 : 1
const delayMilliseconds = 5000

function sleep(milliseconds) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds)
  })
}

function verifyRegistryState() {
  for (const pkg of record.packages) {
    const registry = readRegistryState(pkg.name, pkg.version)
    assert(registry.published, `${pkg.name}@${pkg.version} is not public.`)
    assert(
      registry.shasum === pkg.sha1,
      `${pkg.name}@${pkg.version} SHA-1 differs from the approved tarball.`,
    )
    assert(
      hasAttestations(registry.attestations),
      `${pkg.name}@${pkg.version} has no trusted-publishing attestation.`,
    )

    assert(
      registry.distTags[record.channel] === pkg.version,
      `${pkg.name} ${record.channel} does not point to ${pkg.version}.`,
    )
    assert(
      (registry.distTags[record.stagingTag] ?? null) === pkg.previousStagingVersion,
      `${pkg.name} temporary staging tag was not restored.`,
    )
  }
}

let lastError
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    verifyRegistryState()
    lastError = null
    break
  } catch (error) {
    lastError = error
    if (attempt < attempts) {
      await sleep(delayMilliseconds)
    }
  }
}
if (lastError) {
  throw lastError
}

process.stdout.write(
  `final registry state verified for ${record.tag} (${record.packages.length} packages)\n`,
)
