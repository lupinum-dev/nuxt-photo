import { createHash } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
const versionWorkflow = readFileSync(
  new URL('../.github/workflows/version.yml', import.meta.url),
  'utf8',
)

assert(
  versionWorkflow.includes('prepare-version:') &&
    versionWorkflow.includes('permissions:\n      contents: read'),
  'Version preparation must run with read-only repository permissions.',
)
assert(
  versionWorkflow.includes('vp install --frozen-lockfile --ignore-scripts'),
  'Version preparation must disable dependency lifecycle scripts.',
)
const privilegedVersionJob = versionWorkflow.split('  version-pr:')[1]
assert(privilegedVersionJob, 'Version PR creation must use a separate privileged job.')
assert(
  !privilegedVersionJob.includes('vp install') && !privilegedVersionJob.includes('vp run version'),
  'The privileged version PR job must not install dependencies or execute repository tooling.',
)
assert(
  privilegedVersionJob.includes('git apply --index "$RUNNER_TEMP/version.patch"'),
  'The privileged version PR job must consume the inert patch.',
)
assert(
  privilegedVersionJob.includes('Confirm that the prepared SHA is still current main') &&
    privilegedVersionJob.indexOf('Confirm that the prepared SHA is still current main') <
      privilegedVersionJob.indexOf('git apply --index "$RUNNER_TEMP/version.patch"'),
  'The privileged version PR job must revalidate main immediately before it applies the patch.',
)

const embeddedScript = /node --input-type=module <<'NODE'\n([\s\S]*?)\n          NODE/.exec(
  workflow,
)?.[1]
if (!embeddedScript) {
  throw new Error('Cannot find the isolated staging program in release.yml.')
}
const program = embeddedScript.replace(/^ {10}/gm, '')

runScenario('registry server error', 'server-error', false)
runScenario('explicit missing package', 'missing', true)

process.stdout.write('Release workflow isolation verified.\n')

function runScenario(label, registryMode, shouldStage) {
  const directory = mkdtempSync(join(tmpdir(), 'nuxt-photo-release-'))
  const releaseDirectory = join(directory, '.release')
  const packageDirectory = join(directory, 'fixture', 'package')
  const binDirectory = join(directory, 'bin')
  mkdirSync(releaseDirectory, { recursive: true })
  mkdirSync(packageDirectory, { recursive: true })
  mkdirSync(binDirectory, { recursive: true })

  const packageName = '@lupinum/vue-photo'
  const packageSlug = 'lupinum-vue-photo'
  const version = '9.8.7-test.1'
  const tarball = 'lupinum-vue-photo-9.8.7-test.1.tgz'
  writeFileSync(
    join(packageDirectory, 'package.json'),
    `${JSON.stringify({ name: packageName, version })}\n`,
  )
  const pack = spawnSync(
    'tar',
    ['-czf', join(releaseDirectory, tarball), '-C', join(directory, 'fixture'), 'package'],
    {
      encoding: 'utf8',
    },
  )
  if (pack.status !== 0) {
    throw new Error(`Cannot create ${label} test tarball: ${pack.stderr}`)
  }

  const marker = join(directory, 'npm-stage-called')
  const fakeNpm = join(binDirectory, 'npm')
  writeFileSync(
    fakeNpm,
    `#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
const args = process.argv.slice(2)
if (args[0] === '--version') {
  process.stdout.write('11.15.0\\n')
  process.exit(0)
}
if (args[0] === 'view') {
  if (process.env.REGISTRY_MODE === 'missing') {
    process.stderr.write('npm error code E404\\nnpm error 404 Not Found\\n')
    process.exit(1)
  }
  process.stderr.write('npm error code E500\\nnpm error registry unavailable\\n')
  process.exit(1)
}
if (args[0] === 'stage' && args[1] === 'publish') {
  writeFileSync(process.env.STAGE_MARKER, 'called')
  process.stdout.write(JSON.stringify({
    [process.env.PACKAGE_NAME]: {
      stageId: '966d9309-da98-4280-b554-c5ad51e0f564',
      name: process.env.PACKAGE_NAME,
      version: process.env.PACKAGE_VERSION,
      shasum: process.env.PACKAGE_SHA1,
    },
  }))
  process.exit(0)
}
process.stderr.write('unexpected fake npm command\\n')
process.exit(2)
`,
  )
  chmodSync(fakeNpm, 0o755)

  const bytes = readFileSync(join(releaseDirectory, tarball))
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${binDirectory}${delimiter}${process.env.PATH}`,
      PACKAGE_NAME: packageName,
      PACKAGE_SLUG: packageSlug,
      PACKAGE_TARBALL: tarball,
      PACKAGE_VERSION: version,
      PACKAGE_SHA1: createHash('sha1').update(bytes).digest('hex'),
      PACKAGE_SHA256: createHash('sha256').update(bytes).digest('hex'),
      RELEASE_CHANNEL: 'next',
      STAGING_TAG: 'lupinum-stage-1234',
      PREVIOUS_CHANNEL_VERSION: '',
      PREVIOUS_STAGING_VERSION: '',
      SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
      CI_RUN_ID: '1234',
      REGISTRY_MODE: registryMode,
      STAGE_MARKER: marker,
    },
  })

  if (shouldStage) {
    assert(result.status === 0, `${label} must stage: ${result.stderr}`)
    assert(existsSync(marker), `${label} did not call npm stage publish.`)
    assert(
      existsSync(join(releaseDirectory, 'stages', `${packageSlug}.json`)),
      `${label} did not write staging evidence.`,
    )
    return
  }

  assert(result.status !== 0, `${label} must fail closed.`)
  assert(result.stderr.includes('npm view failed'), `${label} did not report the registry failure.`)
  assert(!existsSync(marker), `${label} called npm stage publish after a registry failure.`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
