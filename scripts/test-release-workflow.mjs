import { readFileSync } from 'node:fs'

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

const publishJob = /^  publish:\n([\s\S]*?)(?=^  [a-z][a-z-]*:\n)/m.exec(workflow)?.[1]
assert(publishJob, 'release.yml is missing the isolated publish job.')
assert(
  publishJob.includes('environment: npm'),
  'The publish job must use the protected npm environment.',
)
assert(publishJob.includes('id-token: write'), 'The publish job must use npm trusted publishing.')
for (const forbidden of [
  'actions/checkout@',
  'actions/github-script@',
  'node scripts/',
  'node-version-file:',
  'npm install',
  'pnpm install',
  'vp install',
]) {
  assert(
    !publishJob.includes(forbidden),
    `The token-capable publish job must not contain ${forbidden}.`,
  )
}
for (const required of [
  "'@lupinum/vue-photo', '@lupinum/nuxt-photo'",
  "'publish', tarball",
  "'--ignore-scripts', '--provenance'",
  'record.channel',
  'dist.attestations',
]) {
  assert(publishJob.includes(required), `The publish job is missing: ${required}`)
}

const releaseJob = /^  github-release:\n([\s\S]*)$/m.exec(workflow)?.[1]
assert(releaseJob, 'release.yml is missing automatic GitHub release creation.')
assert(
  releaseJob.includes('needs:\n      - verify\n      - publish'),
  'GitHub release creation must wait for npm publication.',
)
assert(releaseJob.includes('gh release create'), 'GitHub release creation is not automatic.')

process.stdout.write('Release workflow isolation verified.\n')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
