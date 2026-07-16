import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const packages = [readPackage('packages/vue'), readPackage('packages/nuxt')]

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function readPackage(directory) {
  const manifest = JSON.parse(
    readFileSync(join(directory, 'package.json'), 'utf8'),
  )
  return { directory, name: manifest.name, version: manifest.version }
}

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })
  return typeof output === 'string' ? output.trim() : ''
}

function parseConfirmation(args) {
  const normalizedArgs = args[0] === '--' ? args.slice(1) : args
  assert(
    normalizedArgs.length === 2 &&
      normalizedArgs[0] === '--confirm' &&
      normalizedArgs[1],
    'Usage: corepack pnpm run release:publish -- --confirm <version>',
  )
  return normalizedArgs[1]
}

function publishedVersion(packageName, version) {
  try {
    return JSON.parse(
      run('npm', ['view', `${packageName}@${version}`, 'version', '--json'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    )
  } catch (error) {
    const stderr = String(error?.stderr ?? '')
    if (/E404|404 Not Found/.test(stderr)) return null
    fail(
      `Could not read npm registry state for ${packageName}@${version}: ${stderr.trim()}`,
    )
  }
}

function assertPublishOrder(state) {
  const vuePublished = state.get('@nuxt-photo/vue') !== null
  const nuxtPublished = state.get('@nuxt-photo/nuxt') !== null
  assert(
    !nuxtPublished || vuePublished,
    'Registry is inconsistent: Nuxt is published but Vue is not',
  )
}

function readRegistryState(version) {
  const state = new Map(
    packages.map((pkg) => [pkg.name, publishedVersion(pkg.name, version)]),
  )
  assertPublishOrder(state)
  return state
}

async function waitForPublished(packageName, version) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    if (publishedVersion(packageName, version) === version) return
    if (attempt < 10) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000))
    }
  }
  fail(`${packageName}@${version} did not become readable from npm`)
}

function assertLatestTag(packageName, version) {
  const tags = JSON.parse(
    run('npm', ['view', packageName, 'dist-tags', '--json'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  )
  assert(
    tags.latest === version,
    `${packageName} latest dist-tag is ${tags.latest ?? 'missing'}, expected ${version}`,
  )
}

const confirmedVersion = parseConfirmation(process.argv.slice(2))
const versions = new Set(packages.map((pkg) => pkg.version))
assert(versions.size === 1, 'Public package versions must match')
const [version] = versions
assert(
  confirmedVersion === version,
  `Confirmation ${confirmedVersion} does not match package version ${version}`,
)

const changelog = readFileSync('CHANGELOG.md', 'utf8')
assert(
  new RegExp(
    `^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`,
    'm',
  ).test(changelog),
  `CHANGELOG.md needs a dated ${version} release heading`,
)

assert(run('git', ['branch', '--show-current']) === 'main', 'Release from main')
assert(
  run('git', ['status', '--porcelain']) === '',
  'Working tree is not clean',
)
run('git', ['fetch', 'origin', 'main'])
assert(
  run('git', ['rev-parse', 'HEAD']) ===
    run('git', ['rev-parse', 'origin/main']),
  'Local main is not synchronized with origin/main',
)
assert(
  run('git', ['tag', '--list', `v${version}`]) === '',
  `Local tag v${version} already exists`,
)
assert(
  run('git', ['ls-remote', '--tags', 'origin', `refs/tags/v${version}`]) === '',
  `Remote tag v${version} already exists`,
)

readRegistryState(version)
const releaseDirectory = resolve('.release', `v${version}`)

process.stdout.write('Running the complete local release gate.\n')
run('corepack', ['pnpm', 'run', 'release:verify'], { stdio: 'inherit' })

rmSync(releaseDirectory, { recursive: true, force: true })
run(
  'node',
  ['scripts/release/pack-dry-run.mjs', '--output-dir', releaseDirectory],
  { stdio: 'inherit' },
)

const npmUser = run('npm', ['whoami'], { stdio: ['ignore', 'pipe', 'inherit'] })
process.stdout.write(`Authenticated to npm as ${npmUser}.\n`)

const registryState = readRegistryState(version)
for (const pkg of packages) {
  if (registryState.get(pkg.name) === version) {
    process.stdout.write(`Already published: ${pkg.name}@${version}\n`)
    continue
  }

  const tarball = join(
    releaseDirectory,
    `${pkg.name.replace('@', '').replace('/', '-')}-${version}.tgz`,
  )
  run('npm', ['publish', tarball, '--access', 'public', '--tag', 'latest'], {
    stdio: 'inherit',
  })
  await waitForPublished(pkg.name, version)
  process.stdout.write(`Published: ${pkg.name}@${version}\n`)
}

for (const pkg of packages) {
  await waitForPublished(pkg.name, version)
  assertLatestTag(pkg.name, version)
}

process.stdout.write(
  `Published ${version}. Verified tarballs remain in ${releaseDirectory}.\n`,
)
