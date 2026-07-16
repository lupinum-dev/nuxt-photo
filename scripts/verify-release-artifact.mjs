import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assert } from './lib/package-set.mjs'
import { verifyReleaseArtifact } from './lib/release-artifact.mjs'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const directory = args[0] && !args[0].startsWith('--') ? resolve(args.shift()) : resolve('.release')

function readArgument(name) {
  const index = args.indexOf(name)
  if (index === -1) {
    return undefined
  }
  const value = args[index + 1]
  assert(value, `${name} requires a value.`)
  return value
}

const explicitExpectedSha = readArgument('--expected-sha')
const expectedHead = args.includes('--expected-head')
assert(
  !(explicitExpectedSha && expectedHead),
  'Use either --expected-sha or --expected-head, not both.',
)
const expectedSha = expectedHead
  ? execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim()
  : explicitExpectedSha
const publishable = args.includes('--publishable')
const artifact = verifyReleaseArtifact(directory, {
  expectedSha,
  publishable,
  rootDir,
})

process.stdout.write(
  `release artifact verified: ${artifact.metadata.packageSetVersion} (${artifact.packages.length} packages)\n`,
)
