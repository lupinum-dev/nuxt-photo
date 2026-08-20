import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { parse } from 'yaml'

const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
const versionWorkflow = readFileSync(
  new URL('../.github/workflows/version.yml', import.meta.url),
  'utf8',
)
const versionConfig = parse(versionWorkflow)
const ciWorkflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
const ciConfig = parse(ciWorkflow)
const securityWorkflow = readFileSync(
  new URL('../.github/workflows/security.yml', import.meta.url),
  'utf8',
)
const securityConfig = parse(securityWorkflow)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

const versionAuthorizationJob = ciConfig.jobs['authorize-version-pr']
assert(versionAuthorizationJob, 'Version CI must authorize the required PR gate directly.')
assert(
  normalizeCondition(versionAuthorizationJob.if) ===
    "always() && needs.pr-gate.result == 'success' && github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/changeset-release/main'",
  'Only successful dispatched CI for the generated version branch may authorize the PR gate.',
)
assert(
  versionAuthorizationJob.needs === 'pr-gate',
  'Version PR authorization must wait for the aggregate CI gate.',
)
assert(
  versionAuthorizationJob.permissions.contents === 'read' &&
    versionAuthorizationJob.permissions['pull-requests'] === 'read' &&
    versionAuthorizationJob.permissions.statuses === 'write',
  'Version PR authorization must receive only the permissions needed to verify and publish status.',
)
const versionAuthorizationScript = versionAuthorizationJob.steps.find(
  (step) => step.name === 'Publish the exact verified commit status',
)?.with?.script
assert(versionAuthorizationScript, 'Version PR authorization must use the trusted GitHub API.')
for (const required of [
  "const branch = 'changeset-release/main'",
  'currentBranch.object.sha !== verifiedSha',
  'pullRequests.length !== 1',
  'pullRequests[0].head.sha !== verifiedSha',
  "context: 'PR gate'",
  "state: 'success'",
]) {
  assert(
    versionAuthorizationScript.includes(required),
    `Version PR authorization is missing: ${required}`,
  )
}
assert(
  !JSON.stringify(versionAuthorizationJob).includes('actions/checkout') &&
    !JSON.stringify(versionAuthorizationJob).includes('vp install'),
  'The status-writing job must not checkout or run repository code.',
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
assert(
  versionWorkflow.includes('GITHUB_TOKEN: ${{ github.token }}'),
  'Changesets must receive the job-scoped read-only token for GitHub changelog metadata.',
)
const versionPatchStep = versionConfig.jobs['prepare-version'].steps.find(
  (step) => step.name === 'Generate the version patch without write credentials',
)
assert(versionPatchStep, 'The version workflow must prepare an inert patch.')
assert(
  versionPatchStep.run.includes('git diff HEAD --binary --full-index') &&
    versionPatchStep.run.includes('git diff HEAD --quiet'),
  'The version patch must include staged Changeset deletions and new files.',
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
  privilegedVersionJob.includes('base: main'),
  'Version PR creation must declare main when checkout uses an exact detached SHA.',
)
assert(
  versionConfig.jobs['version-pr'].permissions.actions === 'write' &&
    Object.hasOwn(ciConfig.on, 'workflow_dispatch') &&
    Object.hasOwn(securityConfig.on, 'workflow_dispatch'),
  'CI and security must permit the version workflow to dispatch branch verification.',
)
const versionVerificationStep = versionConfig.jobs['version-pr'].steps.find(
  (step) => step.name === 'Verify the version branch',
)
assert(
  versionVerificationStep?.run ===
    'gh workflow run ci.yml --ref changeset-release/main\ngh workflow run security.yml --ref changeset-release/main\n',
  'The version workflow must dispatch verification for the exact generated branch.',
)
for (const [jobName, expectedCondition] of Object.entries({
  verify:
    "needs.classify.outputs.full == 'true' && (github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/changeset-release/main'))",
  'pr-gate':
    "always() && (github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/changeset-release/main'))",
})) {
  assert(
    normalizeCondition(ciConfig.jobs[jobName].if) === expectedCondition,
    `${jobName} must restrict dispatch verification to the generated version branch.`,
  )
}
assert(
  normalizeCondition(ciConfig.jobs.compatibility.if) === "needs.classify.outputs.full == 'true'" &&
    normalizeCondition(ciConfig.jobs.docs.if) ===
      "github.event_name == 'pull_request' && needs.classify.outputs.full == 'false'",
  'Only public documentation changes may skip the complete pull-request lanes.',
)
const classifyScript = ciConfig.jobs.classify.steps.find(
  (step) => step.name === 'Select required lanes',
)?.with?.script
assert(classifyScript, 'CI must classify pull-request paths before selecting expensive lanes.')
for (const scenario of [
  {
    name: 'documentation',
    event: 'pull_request',
    paths: ['docs/content/docs/1.getting-started.md'],
    full: 'false',
  },
  {
    name: 'top-level public prose',
    event: 'pull_request',
    paths: ['README.md'],
    full: 'false',
  },
  {
    name: 'package source',
    event: 'pull_request',
    paths: ['packages/nuxt/src/module.ts'],
    full: 'true',
  },
  {
    name: 'workflow policy',
    event: 'pull_request',
    paths: ['.github/workflows/ci.yml'],
    full: 'true',
  },
  { name: 'main certification', event: 'push', paths: [], full: 'true' },
]) {
  const outputs = new Map()
  await new AsyncFunction('context', 'github', 'core', classifyScript)(
    {
      eventName: scenario.event,
      issue: { number: 1 },
      repo: { owner: 'lupinum-dev', repo: 'nuxt-photo' },
    },
    {
      paginate: async () => scenario.paths.map((filename) => ({ filename })),
      rest: { pulls: { listFiles() {} } },
    },
    { setOutput: (name, value) => outputs.set(name, value) },
  )
  assert(
    outputs.get('full') === scenario.full,
    `CI classifier failed the ${scenario.name} fixture.`,
  )
}
assert(
  ciConfig.jobs['pr-gate'].needs.includes('classify') &&
    ciConfig.jobs['pr-gate'].needs.includes('docs') &&
    ciConfig.jobs['pr-gate'].steps[0].run.includes('test "$DOCS_RESULT" = "success"') &&
    ciConfig.jobs['pr-gate'].steps[0].run.includes('test "$VERIFY_RESULT" = "success"'),
  'The aggregate pull-request gate must authorize exactly the selected lane.',
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
  'versions.length !== 1 || versions[0] !== pkg.version',
  "modes.set(name, attestations ? 'oidc' : 'bootstrap')",
  "mode === 'bootstrap' || (mode === 'oidc' && attestations)",
  'bootstrap=${String(bootstrap)}',
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
const releaseCreateCommand =
  releaseJob.match(/gh release create[^\n]*\\\n(?:\s+[^\n]*\\\n)*\s+[^\n]*/u)?.[0] ?? ''
assert(
  releaseCreateCommand.includes('--repo "$GITHUB_REPOSITORY"'),
  'GitHub release commands must declare the repository when the job has no checkout.',
)
assert(
  releaseJob.includes('This first npm version was created from the exact CI-certified artifact'),
  'Bootstrap releases must record the missing first-version provenance.',
)

const publishScriptMatch = /node --input-type=module <<'NODE'\n([\s\S]*?)\n\s+NODE/.exec(publishJob)
assert(publishScriptMatch, 'The publish job must contain one inline Node program.')
const publishScript = dedent(publishScriptMatch[1])

runScenario('matching bootstrap bytes', {
  allowBootstrap: true,
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  expectedBootstrap: true,
  expectedModes: {
    '@lupinum/vue-photo': 'bootstrap',
    '@lupinum/nuxt-photo': 'bootstrap',
  },
  expectedPublishes: 0,
})
runScenario('missing packages use OIDC', {
  useProductionPollingDefaults: true,
  expectedBootstrap: false,
  expectedModes: {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'oidc',
  },
  expectedPublishes: 2,
})
runScenario('mixed package sets recover safely', {
  allowBootstrap: true,
  existing: ['@lupinum/vue-photo'],
  expectedBootstrap: true,
  expectedModes: {
    '@lupinum/vue-photo': 'bootstrap',
    '@lupinum/nuxt-photo': 'oidc',
  },
  expectedPublishes: 1,
})
runScenario('different bytes fail', {
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  differentBytes: '@lupinum/vue-photo',
  expectedError: 'exists with different bytes',
})
runScenario('wrong dist-tags fail', {
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  attested: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  wrongTag: '@lupinum/nuxt-photo',
  expectedError: 'did not expose the required bytes',
})
runScenario('later provenance-free versions fail', {
  allowBootstrap: true,
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  extraVersion: '@lupinum/vue-photo',
  expectedError: 'is not the first package version and has no provenance',
})
runScenario('a bootstrap package must remain the sole version', {
  allowBootstrap: true,
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  laterVersionDuringVerification: '@lupinum/vue-photo',
  expectedError: 'did not expose the required bytes',
})
runScenario('bootstrap recovery requires explicit authorization', {
  existing: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  expectedError: 'requires explicit bootstrap authorization',
})
runScenario('new provenance-free publications fail', {
  publishProvenance: false,
  expectedError: 'did not expose the required bytes',
})
runScenario('one polling attempt with no delay is valid', {
  pollAttempts: '1',
  pollDelayMs: '0',
  expectedBootstrap: false,
  expectedModes: {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'oidc',
  },
  expectedPublishes: 2,
})
for (const [name, pollAttempts, pollDelayMs, expectedError] of [
  ['zero attempts', '0', '0', 'Invalid registry poll attempt count.'],
  ['negative attempts', '-1', '0', 'Invalid registry poll attempt count.'],
  ['fractional attempts', '1.5', '0', 'Invalid registry poll attempt count.'],
  ['unsafe attempts', '9007199254740992', '0', 'Invalid registry poll attempt count.'],
  ['excessive attempts', '9007199254740991', '0', 'Invalid registry poll attempt limit.'],
  ['negative delay', '1', '-1', 'Invalid registry poll delay.'],
  ['fractional delay', '1', '0.5', 'Invalid registry poll delay.'],
  ['unsafe delay', '1', '9007199254740992', 'Invalid registry poll delay.'],
  ['unsafe total budget', '240', '6000', 'Invalid registry poll budget.'],
]) {
  runScenario(name, {
    pollAttempts,
    pollDelayMs,
    expectedError,
    expectNoPublishes: true,
  })
}

process.stdout.write('Release workflow isolation verified.\n')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function normalizeCondition(value) {
  return value.replace(/\s+/gu, ' ').trim()
}

function dedent(value) {
  const lines = value.split('\n')
  const indentation = Math.min(...lines.filter(Boolean).map((line) => line.match(/^\s*/)[0].length))
  return lines.map((line) => line.slice(indentation)).join('\n')
}

function digest(content, algorithm) {
  return createHash(algorithm).update(content).digest('hex')
}

function runScenario(name, options) {
  const root = mkdtempSync(join(tmpdir(), 'nuxt-photo-release-policy-'))
  try {
    const releaseDir = join(root, '.release')
    const binDir = join(root, 'bin')
    mkdirSync(releaseDir)
    mkdirSync(binDir)
    const sourceSha = 'a'.repeat(40)
    const version = '0.2.0'
    const channel = 'latest'
    const packageNames = ['@lupinum/vue-photo', '@lupinum/nuxt-photo']
    const packages = packageNames.map((packageName, index) => {
      const tarball = `package-${index + 1}.tgz`
      const content = Buffer.from(`${packageName}@${version}`)
      writeFileSync(join(releaseDir, tarball), content)
      return {
        name: packageName,
        version,
        tarball,
        sha1: digest(content, 'sha1'),
        sha256: digest(content, 'sha256'),
      }
    })
    writeFileSync(
      join(releaseDir, 'release-record.json'),
      JSON.stringify({
        schemaVersion: 2,
        sourceSha,
        version,
        channel,
        publishOrder: packageNames,
        packages,
      }),
    )
    writeFileSync(
      join(releaseDir, 'release-artifact.json'),
      JSON.stringify({ sourceSha, packageSetVersion: version }),
    )

    const existing = new Set(options.existing ?? [])
    const attested = new Set(options.attested ?? [])
    const registry = Object.fromEntries(
      packages.map((pkg) => {
        if (!existing.has(pkg.name)) return [pkg.name, null]
        const versions = [pkg.version]
        if (options.extraVersion === pkg.name) versions.push('0.2.1')
        return [
          pkg.name,
          {
            versions,
            versionViews: 0,
            addLaterVersion: options.laterVersionDuringVerification === pkg.name,
            tags: { [channel]: options.wrongTag === pkg.name ? '0.1.0' : pkg.version },
            releases: {
              [pkg.version]: {
                sha1: options.differentBytes === pkg.name ? '0'.repeat(40) : pkg.sha1,
                attestations: attested.has(pkg.name)
                  ? { url: 'https://registry.example/provenance' }
                  : null,
              },
            },
          },
        ]
      }),
    )
    const statePath = join(root, 'registry.json')
    writeFileSync(
      statePath,
      JSON.stringify({
        packages: registry,
        tarballs: Object.fromEntries(
          packages.map((pkg) => [
            basename(pkg.tarball),
            { ...pkg, path: join(releaseDir, pkg.tarball) },
          ]),
        ),
        publishProvenance: options.publishProvenance !== false,
        publishes: [],
      }),
    )
    const npmPath = join(binDir, 'npm')
    writeFileSync(npmPath, fakeNpmProgram())
    chmodSync(npmPath, 0o755)
    const runnerPath = join(root, 'publish.mjs')
    writeFileSync(runnerPath, publishScript)
    const outputPath = join(root, 'output.txt')
    const summaryPath = join(root, 'summary.md')
    const result = spawnSync(process.execPath, [runnerPath], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        ALLOW_BOOTSTRAP: options.allowBootstrap ? 'true' : 'false',
        PATH: `${binDir}:${process.env.PATH}`,
        FAKE_NPM_STATE: statePath,
        GITHUB_OUTPUT: outputPath,
        GITHUB_STEP_SUMMARY: summaryPath,
        RELEASE_VERSION: version,
        SOURCE_SHA: sourceSha,
        ...(options.useProductionPollingDefaults
          ? {}
          : {
              REGISTRY_POLL_ATTEMPTS: options.pollAttempts ?? '5',
              REGISTRY_POLL_DELAY_MS: options.pollDelayMs ?? '0',
            }),
      },
    })
    const diagnostic = `${result.stdout}\n${result.stderr}`
    if (options.expectedError) {
      assert(result.status !== 0, `${name} unexpectedly succeeded.`)
      assert(
        diagnostic.includes(options.expectedError),
        `${name} failed for the wrong reason: ${diagnostic}`,
      )
      if (options.expectNoPublishes) {
        const state = JSON.parse(readFileSync(statePath, 'utf8'))
        assert(state.publishes.length === 0, `${name} published before validation failed.`)
      }
      return
    }
    assert(result.status === 0, `${name} failed: ${diagnostic}`)
    const output = readFileSync(outputPath, 'utf8')
    assert(
      output.includes(`bootstrap=${String(options.expectedBootstrap)}`),
      `${name} reported the wrong publication mode.`,
    )
    assert(
      output.includes(`modes=${JSON.stringify(options.expectedModes)}`),
      `${name} reported the wrong package modes: ${output}`,
    )
    const expectedBootstrapPackages = Object.entries(options.expectedModes)
      .filter(([, mode]) => mode === 'bootstrap')
      .map(([packageName]) => packageName)
      .join(',')
    assert(
      output.includes(`bootstrap-packages=${expectedBootstrapPackages}`),
      `${name} reported the wrong bootstrap packages: ${output}`,
    )
    const state = JSON.parse(readFileSync(statePath, 'utf8'))
    assert(
      state.publishes.length === options.expectedPublishes,
      `${name} published the wrong package count.`,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function fakeNpmProgram() {
  return `#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const statePath = process.env.FAKE_NPM_STATE
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
const args = process.argv.slice(2)
const save = () => fs.writeFileSync(statePath, JSON.stringify(state))
const output = value => process.stdout.write(JSON.stringify(value) + '\\n')
if (args[0] === '--version') {
  process.stdout.write('11.5.0\\n')
  process.exit(0)
}
if (args[0] === 'view') {
  const spec = args[1]
  const field = args[2]
  const match = /^(@[^/]+\\/[^@]+)@(.+)$/.exec(spec)
  const name = match ? match[1] : spec
  const version = match?.[2]
  const pkg = state.packages[name]
  const release = version ? pkg?.releases?.[version] : null
  let value
  if (field === 'dist.shasum') value = release?.sha1
  else if (field === 'dist.attestations') value = release?.attestations
  else if (field === 'versions') {
    if (pkg?.addLaterVersion && pkg.versionViews > 0 && !pkg.versions.includes('0.2.1')) {
      pkg.versions.push('0.2.1')
    }
    if (pkg) pkg.versionViews += 1
    save()
    value = pkg?.versions
  }
  else if (field.startsWith('dist-tags.')) value = pkg?.tags?.[field.slice('dist-tags.'.length)]
  if (value === undefined || value === null) {
    process.stderr.write('E404 404 Not Found\\n')
    process.exit(1)
  }
  output(value)
  process.exit(0)
}
if (args[0] === 'publish') {
  const tarball = state.tarballs[path.basename(args[1])]
  if (!tarball) throw new Error('Unknown tarball')
  const tag = args[args.indexOf('--tag') + 1]
  const content = fs.readFileSync(tarball.path)
  const sha1 = crypto.createHash('sha1').update(content).digest('hex')
  state.packages[tarball.name] = {
    versions: [tarball.version],
    tags: { [tag]: tarball.version },
    releases: {
      [tarball.version]: {
        sha1,
        attestations: state.publishProvenance ? { url: 'https://registry.example/provenance' } : null,
      },
    },
  }
  state.publishes.push(tarball.name)
  save()
  process.exit(0)
}
throw new Error('Unsupported fake npm command: ' + args.join(' '))
`
}
