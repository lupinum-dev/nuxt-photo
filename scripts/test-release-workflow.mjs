import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { parse } from 'yaml'

import { listPendingChangesets } from './lib/changelog.mjs'

const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
const releaseConfig = parse(workflow)
const sigstoreManifest = JSON.parse(
  readFileSync(new URL('./sigstore-verifier/package.json', import.meta.url), 'utf8'),
)
const sigstoreLock = JSON.parse(
  readFileSync(new URL('./sigstore-verifier/package-lock.json', import.meta.url), 'utf8'),
)
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

const changesetFixture = mkdtempSync(join(tmpdir(), 'nuxt-photo-changesets-'))
try {
  const changesetDirectory = join(changesetFixture, '.changeset')
  mkdirSync(changesetDirectory)
  writeFileSync(join(changesetDirectory, 'released-change.md'), 'released')
  writeFileSync(join(changesetDirectory, 'new-change.md'), 'new')
  writeFileSync(
    join(changesetDirectory, 'pre.json'),
    `${JSON.stringify({ mode: 'pre', changesets: ['released-change'] })}\n`,
  )
  assert(
    JSON.stringify(listPendingChangesets(changesetFixture)) === '["new-change.md"]',
    'Prerelease Changesets must ignore consumed release notes and retain new work.',
  )

  writeFileSync(
    join(changesetDirectory, 'pre.json'),
    `${JSON.stringify({ mode: 'exit', changesets: ['released-change'] })}\n`,
  )
  assert(
    JSON.stringify(listPendingChangesets(changesetFixture)) ===
      '["new-change.md","released-change.md"]',
    'Changesets must remain pending outside active prerelease mode.',
  )
} finally {
  rmSync(changesetFixture, { recursive: true, force: true })
}

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
  versionAuthorizationJob.permissions.checks === 'write' &&
    versionAuthorizationJob.permissions.contents === 'read' &&
    versionAuthorizationJob.permissions['pull-requests'] === 'read' &&
    !Object.hasOwn(versionAuthorizationJob.permissions, 'statuses'),
  'Version PR authorization must receive only the permissions needed to verify and publish a check.',
)
const versionAuthorizationScript = versionAuthorizationJob.steps.find(
  (step) => step.name === 'Publish the exact verified check',
)?.with?.script
assert(versionAuthorizationScript, 'Version PR authorization must use the trusted GitHub API.')
for (const required of [
  "const branch = 'changeset-release/main'",
  'currentBranch.object.sha !== verifiedSha',
  'pullRequests.length !== 1',
  'pullRequests[0].head.sha !== verifiedSha',
  'github.rest.checks.create',
  "name: 'PR gate'",
  "status: 'completed'",
  "conclusion: 'success'",
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
const verifyJob = /^  verify:\n([\s\S]*?)(?=^  [a-z][a-z-]*:\n)/m.exec(workflow)?.[1]
assert(verifyJob, 'release.yml is missing the unprivileged verification job.')
for (const required of [
  'cp scripts/sigstore-verifier/package.json',
  'scripts/sigstore-verifier/package-lock.json',
  'npm ci --prefix "$SIGSTORE_PREFIX" --ignore-scripts --no-audit --no-fund',
  'node scripts/verify-registry-provenance.mjs',
  'node scripts/plan-reconciliation.mjs',
  '.release/registry-verification.json',
]) {
  assert(verifyJob.includes(required), `The verification job is missing: ${required}`)
}
assert(
  !verifyJob.includes('npm install') && !verifyJob.includes('npm view sigstore'),
  'The verification job must install only the committed lock with npm ci.',
)
assert(
  sigstoreManifest.private === true &&
    sigstoreManifest.engines.node === '^24.15.0' &&
    sigstoreManifest.dependencies.sigstore === '5.0.0' &&
    !sigstoreManifest.devDependencies,
  'The isolated verifier manifest must pin Sigstore without changing the public workspace contract.',
)
assert(
  sigstoreLock.lockfileVersion === 3 &&
    sigstoreLock.packages[''].dependencies.sigstore === '5.0.0' &&
    sigstoreLock.packages['node_modules/sigstore'].version === '5.0.0',
  'The isolated verifier lock must match the exact manifest dependency.',
)
const unlockedVerifierPackages = Object.entries(sigstoreLock.packages)
  .filter(([path]) => path)
  .filter(
    ([, pkg]) =>
      !pkg.version ||
      !pkg.resolved?.startsWith('https://registry.npmjs.org/') ||
      !pkg.integrity?.startsWith('sha512-'),
  )
assert(
  Object.keys(sigstoreLock.packages).length > 2 && unlockedVerifierPackages.length === 0,
  `Every isolated verifier package must have a locked version and integrity: ${unlockedVerifierPackages
    .map(([path]) => path)
    .join(', ')}`,
)
assert(
  verifyJob.includes('permissions:\n      actions: read\n      contents: read') &&
    !verifyJob.includes('id-token: write'),
  'Registry provenance verification must run without publish credentials.',
)
assert(
  releaseConfig.on.workflow_run.workflows.includes('ci') &&
    releaseConfig.on.workflow_run.types.includes('completed'),
  'Release reconciliation must follow successful current-main CI.',
)
assert(
  Object.keys(releaseConfig.on.workflow_dispatch.inputs ?? {}).length === 0,
  'Manual reconciliation must derive all release coordinates and accept no bypass inputs.',
)
assert(
  verifyJob.includes('Expected exactly one successful current-main CI run') &&
    verifyJob.includes("artifact.name === 'release-candidate' && !artifact.expired") &&
    verifyJob.includes('Number(process.env.RUN_ATTEMPT) > 1'),
  'Candidate selection must reject ambiguous or expired retained artifacts.',
)
assert(
  releaseConfig.jobs.publish.if === "needs.verify.outputs.action == 'publish'",
  'Completed and repair-only releases must not enter the npm environment.',
)
assert(
  verifyJob.includes('action=waiting') &&
    verifyJob.includes('Review and merge the generated version pull request') &&
    verifyJob.includes("if: steps.intent.outputs.ready == 'true'"),
  'Pending Changesets must wait for their reviewed version PR without a failed release run.',
)
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
  'npm ci',
  'pnpm install',
  'vp install',
  'fetch(',
  "from 'sigstore'",
  "require('sigstore')",
  'signedAccessSignatureUrl',
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
  'registry-verification.json',
  'verification.releaseRecordSha256',
  "hash(tarball, 'sha512') !== verified.sha512",
  'was absent during verification but now exists; rerun verification',
  'hasAttestations(attestations)',
]) {
  assert(publishJob.includes(required), `The publish job is missing: ${required}`)
}

const releaseJob = /^  github-release:\n([\s\S]*)$/m.exec(workflow)?.[1]
assert(releaseJob, 'release.yml is missing automatic GitHub release creation.')
assert(
  releaseJob.includes('needs:\n      - verify\n      - publish'),
  'GitHub release creation must wait for npm publication.',
)
for (const required of [
  '/releases/tags/$RELEASE_TAG',
  'gh release create',
  'gh release upload',
  'gh release edit',
  'release_exists=false',
  'gh api --silent --method POST',
  'while [ "$tag_type" = tag ]',
  'test "$tag_type" = commit',
  'test "$tag_sha" = "$SOURCE_SHA"',
  'HUMAN-ONLY: GitHub could not create historical tag',
  'rerun only this failed GitHub release job',
  '.release/registry-verification.json',
  '--clobber',
]) {
  assert(releaseJob.includes(required), `GitHub release recovery is missing: ${required}`)
}
const releaseCreateCommand =
  releaseJob.match(/gh release create[^\n]*\\\n(?:\s+[^\n]*\\\n)*\s+[^\n]*/u)?.[0] ?? ''
assert(
  releaseCreateCommand.includes('--repo "$GITHUB_REPOSITORY"') &&
    releaseCreateCommand.includes('--verify-tag'),
  'GitHub release commands must declare the repository when the job has no checkout.',
)
assert(
  releaseJob.indexOf('test "$tag_sha" = "$SOURCE_SHA"') < releaseJob.indexOf('gh release upload'),
  'The tag must be re-read and source-bound before any GitHub release repair.',
)
for (const forbidden of ['--method DELETE', '--method PATCH', 'git update-ref']) {
  assert(!releaseJob.includes(forbidden), `GitHub release recovery must not contain ${forbidden}.`)
}
assert(
  !releaseJob.includes('BOOTSTRAP_RELEASE') && !releaseJob.includes('BOOTSTRAP_PACKAGES'),
  'Automatic GitHub Release repair must not carry provenance-free bypass state.',
)
assert(
  workflow.includes('name: verified-nuxt-photo-release') && workflow.includes('retention-days: 14'),
  'The verified release plan must outlive short workflow-fix cycles.',
)

const githubReleaseScript = releaseConfig.jobs['github-release'].steps.find(
  (step) => step.name === 'Create release from the exact certified package set',
)?.run
assert(githubReleaseScript, 'The GitHub release policy fixture is missing its shell program.')
runGitHubReleaseScenario('absent tag is created at the certified source', {
  expectedActions: ['create-tag', 'create-release'],
  expectedSuccess: true,
})
runGitHubReleaseScenario('historical tag denial gives an exact maintainer gate', {
  tagCreateFailure: true,
  expectedActions: [],
  expectedSuccess: false,
  expectedDiagnostic: 'HUMAN-ONLY: GitHub could not create historical tag v0.2.0',
})
runGitHubReleaseScenario('existing direct tag permits release repair', {
  releaseExists: true,
  tag: { type: 'commit', sha: 'a'.repeat(40) },
  expectedActions: ['upload-release', 'edit-release'],
  expectedSuccess: true,
})
runGitHubReleaseScenario('nested annotated tags are peeled', {
  tag: { type: 'tag', sha: '1'.repeat(40) },
  tagObjects: {
    ['1'.repeat(40)]: { type: 'tag', sha: '2'.repeat(40) },
    ['2'.repeat(40)]: { type: 'commit', sha: 'a'.repeat(40) },
  },
  expectedActions: ['create-release'],
  expectedSuccess: true,
})
runGitHubReleaseScenario('wrong tag appearance fails closed', {
  tag: { type: 'commit', sha: 'b'.repeat(40) },
  expectedActions: [],
  expectedSuccess: false,
})
runGitHubReleaseScenario('wrong annotated tag fails closed', {
  tag: { type: 'tag', sha: '1'.repeat(40) },
  tagObjects: {
    ['1'.repeat(40)]: { type: 'commit', sha: 'b'.repeat(40) },
  },
  expectedActions: [],
  expectedSuccess: false,
})
runGitHubReleaseScenario('release without a tag fails closed', {
  releaseExists: true,
  expectedActions: [],
  expectedSuccess: false,
})

const publishScriptMatch = /node --input-type=module <<'NODE'\n([\s\S]*?)\n\s+NODE/.exec(publishJob)
assert(publishScriptMatch, 'The publish job must contain one inline Node program.')
const publishScript = dedent(publishScriptMatch[1])

runScenario('missing packages use OIDC', {
  useProductionPollingDefaults: true,
  expectedPublishes: 2,
})
runScenario('mixed package sets recover safely', {
  verificationModes: {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'absent',
  },
  expectedPublishes: 1,
})
runScenario('different bytes fail', {
  verificationModes: {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'oidc',
  },
  differentBytes: '@lupinum/vue-photo',
  expectedError: 'changed after verification',
})
runScenario('wrong dist-tags fail', {
  verificationModes: {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'oidc',
  },
  wrongTag: '@lupinum/nuxt-photo',
  expectedError: 'tag changed after verification',
})
runScenario('provenance-free registry records fail', {
  verificationModes: {
    '@lupinum/vue-photo': 'bootstrap',
    '@lupinum/nuxt-photo': 'oidc',
  },
  expectedError: 'invalid registry verification mode',
})
runScenario('absent package appearing after verification fails closed', {
  appearedAfterVerification: '@lupinum/vue-photo',
  expectedError: 'was absent during verification but now exists; rerun verification',
  expectNoPublishes: true,
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
    const releaseRecordText = JSON.stringify({
      schemaVersion: 2,
      sourceSha,
      version,
      channel,
      publishOrder: packageNames,
      packages,
    })
    writeFileSync(join(releaseDir, 'release-record.json'), releaseRecordText)
    writeFileSync(
      join(releaseDir, 'release-artifact.json'),
      JSON.stringify({ sourceSha, packageSetVersion: version }),
    )

    const verificationModes =
      options.verificationModes ??
      Object.fromEntries(packageNames.map((packageName) => [packageName, 'absent']))
    const verificationPackages = packages.map((pkg) => {
      const mode = verificationModes[pkg.name]
      return {
        ...pkg,
        sha512: digest(Buffer.from(`${pkg.name}@${pkg.version}`), 'sha512'),
        mode,
        channelVersion: mode === 'absent' ? null : pkg.version,
        provenanceBundleSha256: mode === 'oidc' ? 'c'.repeat(64) : null,
      }
    })
    writeFileSync(
      join(releaseDir, 'registry-verification.json'),
      JSON.stringify({
        schemaVersion: 1,
        releaseRecordSha256: digest(releaseRecordText, 'sha256'),
        sourceSha,
        version,
        channel,
        sigstoreVersion: '5.0.0',
        workflow: {
          repository: 'https://github.com/lupinum-dev/nuxt-photo',
          path: '.github/workflows/release.yml',
          ref: 'refs/heads/main',
          identity:
            'https://github.com/lupinum-dev/nuxt-photo/.github/workflows/release.yml@refs/heads/main',
          certificateIssuer: 'https://token.actions.githubusercontent.com',
          certificateOIDs: {
            '1.3.6.1.4.1.57264.1.3': sourceSha,
            '1.3.6.1.4.1.57264.1.5': 'lupinum-dev/nuxt-photo',
            '1.3.6.1.4.1.57264.1.6': 'refs/heads/main',
          },
        },
        packages: verificationPackages,
      }),
    )

    const registry = Object.fromEntries(
      packages.map((pkg) => {
        const mode = verificationModes[pkg.name]
        const appeared = options.appearedAfterVerification === pkg.name
        if (mode === 'absent' && !appeared) return [pkg.name, null]
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
                attestations:
                  mode === 'oidc' || appeared
                    ? { url: 'https://registry.npmjs.org/-/npm/v1/attestations/fixture' }
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
    const state = JSON.parse(readFileSync(statePath, 'utf8'))
    assert(
      state.publishes.length === options.expectedPublishes,
      `${name} published the wrong package count.`,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function runGitHubReleaseScenario(name, options) {
  const root = mkdtempSync(join(tmpdir(), 'nuxt-photo-github-release-policy-'))
  try {
    const releaseDir = join(root, '.release')
    const binDir = join(root, 'bin')
    mkdirSync(releaseDir)
    mkdirSync(binDir)
    writeFileSync(join(releaseDir, 'github-release-notes.md'), 'Release notes.\n')
    writeFileSync(join(releaseDir, 'package.tgz'), 'package')
    const statePath = join(root, 'github.json')
    writeFileSync(
      statePath,
      JSON.stringify({
        actions: [],
        releaseExists: options.releaseExists ?? false,
        sourceSha: 'a'.repeat(40),
        tagCreateFailure: options.tagCreateFailure ?? false,
        tag: options.tag ?? null,
        tagObjects: options.tagObjects ?? {},
      }),
    )
    for (const [command, program] of [
      ['curl', fakeCurlProgram()],
      ['gh', fakeGhProgram()],
    ]) {
      const path = join(binDir, command)
      writeFileSync(path, program)
      chmodSync(path, 0o755)
    }
    const runnerPath = join(root, 'github-release.sh')
    writeFileSync(runnerPath, githubReleaseScript)
    const result = spawnSync('/bin/bash', ['-e', '-o', 'pipefail', runnerPath], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        BOOTSTRAP_PACKAGES: '',
        BOOTSTRAP_RELEASE: 'false',
        FAKE_GITHUB_STATE: statePath,
        GH_TOKEN: 'fixture-token',
        GITHUB_API_URL: 'https://api.github.test',
        GITHUB_REPOSITORY: 'lupinum-dev/nuxt-photo',
        PATH: `${binDir}:${process.env.PATH}`,
        RELEASE_CHANNEL: 'latest',
        RELEASE_TAG: 'v0.2.0',
        SOURCE_SHA: 'a'.repeat(40),
      },
    })
    const diagnostic = `${result.stdout}\n${result.stderr}`
    assert(
      (result.status === 0) === options.expectedSuccess,
      `${name} returned the wrong status: ${diagnostic}`,
    )
    if (options.expectedDiagnostic) {
      assert(
        diagnostic.includes(options.expectedDiagnostic),
        `${name} omitted its HUMAN-ONLY instruction: ${diagnostic}`,
      )
    }
    const state = JSON.parse(readFileSync(statePath, 'utf8'))
    assert(
      JSON.stringify(state.actions) === JSON.stringify(options.expectedActions),
      `${name} performed the wrong GitHub mutations: ${JSON.stringify(state.actions)}`,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function fakeCurlProgram() {
  return `#!/usr/bin/env node
const fs = require('node:fs')
const state = JSON.parse(fs.readFileSync(process.env.FAKE_GITHUB_STATE, 'utf8'))
const url = process.argv.at(-1)
if (url.includes('/releases/tags/')) process.stdout.write(state.releaseExists ? '200' : '404')
else process.stdout.write(state.tag ? '200' : '404')
`
}

function fakeGhProgram() {
  return `#!/usr/bin/env node
const fs = require('node:fs')
const statePath = process.env.FAKE_GITHUB_STATE
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
const args = process.argv.slice(2)
const save = () => fs.writeFileSync(statePath, JSON.stringify(state))
const fail = message => { process.stderr.write(message + '\\n'); process.exit(1) }
const output = value => process.stdout.write(String(value) + '\\n')

if (args[0] === 'release') {
  const operation = args[1]
  if (operation === 'view') process.exit(state.releaseExists ? 0 : 1)
  if (operation === 'upload') {
    if (!state.releaseExists) fail('release does not exist')
    state.actions.push('upload-release')
    save()
    process.exit(0)
  }
  if (operation === 'edit') {
    if (!state.releaseExists) fail('release does not exist')
    state.actions.push('edit-release')
    save()
    process.exit(0)
  }
  if (operation === 'create') {
    if (state.releaseExists) fail('release already exists')
    if (!state.tag || !args.includes('--verify-tag')) fail('verified tag is required')
    state.releaseExists = true
    state.actions.push('create-release')
    save()
    process.exit(0)
  }
}

if (args[0] === 'api') {
  const endpoint = args.find(value => value.startsWith('repos/'))
  const methodIndex = args.indexOf('--method')
  const method = methodIndex === -1 ? 'GET' : args[methodIndex + 1]
  if (method === 'POST' && endpoint.endsWith('/git/refs')) {
    if (state.tag) fail('tag already exists')
    if (state.tagCreateFailure) fail('gh: Resource not accessible by integration (HTTP 403)')
    const ref = args.find(value => value.startsWith('ref='))?.slice(4)
    const sha = args.find(value => value.startsWith('sha='))?.slice(4)
    if (ref !== 'refs/tags/v0.2.0' || sha !== state.sourceSha) fail('wrong tag creation')
    state.tag = { type: 'commit', sha }
    state.actions.push('create-tag')
    save()
    process.exit(0)
  }
  const jq = args[args.indexOf('--jq') + 1]
  let object
  if (endpoint.includes('/git/ref/tags/')) object = state.tag
  else if (endpoint.includes('/git/tags/')) object = state.tagObjects[endpoint.split('/').at(-1)]
  if (!object) fail('git object does not exist')
  if (jq === '.object.type') output(object.type)
  else if (jq === '.object.sha') output(object.sha)
  else fail('unsupported jq expression')
  process.exit(0)
}

fail('unsupported gh command: ' + args.join(' '))
`
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
