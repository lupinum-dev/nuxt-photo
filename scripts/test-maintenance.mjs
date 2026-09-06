import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'yaml'
import { checkDependencyPolicy } from './check-dependency-policy.mjs'
import { assertFrameworkVersion, peerFloor } from './lib/packed-consumers.mjs'
import { collectAssets } from './size/assets.mjs'

const now = Date.parse('2026-09-06T12:00:00Z')
const base =
  'minimumReleaseAge: 1440\nminimumReleaseAgeStrict: true\nminimumReleaseAgeIgnoreMissingTime: false\n'
const exception = (expires) =>
  `minimumReleaseAgeExclude:\n  - 'example@1.2.3' # ${JSON.stringify({ reason: 'Reviewed urgent fix', owner: 'mat4m0', expires })}\n`
assert.deepEqual(checkDependencyPolicy(base, now), [])
assert.deepEqual(checkDependencyPolicy(base + exception('2026-09-06T13:00:00Z'), now), [])
for (const [source, message] of [
  [base + exception('2026-09-06T12:00:00Z'), /expired/],
  [base + exception('2026-09-08T12:00:00Z'), /within 24 hours/],
  [base + exception('2026-02-30T12:00:00Z'), /valid UTC/],
  [base + exception('2026-09-06T13:00:00Z').replace('example@1.2.3', 'example@*'), /exact/],
  [base + 'minimumReleaseAgeExclude: [example@1.2.3]\n', /inline JSON/],
  [base.replace('minimumReleaseAge: 1440', 'minimumReleaseAge: 0'), /1440/],
  [base + 'minimumReleaseAge: 1440\n', /unique/],
])
  assert.match(checkDependencyPolicy(source, now).join('\n'), message)

assert.equal(peerFloor('^4.4.8'), '4.4.8')
for (const range of ['latest', '*', '^4 || ^5', '>=4']) {
  assert.throws(() => peerFloor(range), /Unsupported peer range/)
}

const directory = mkdtempSync(join(tmpdir(), 'photo-maintenance-test-'))
try {
  assert.throws(() => collectAssets(join(directory, 'missing')), { code: 'ENOENT' })
  const assets = join(directory, 'assets')
  mkdirSync(assets)
  assert.throws(() => collectAssets(assets), /No JavaScript or CSS/)
  writeFileSync(join(assets, 'index.html'), '<p>Not a client asset</p>')
  assert.throws(() => collectAssets(assets), /No JavaScript or CSS/)
  writeFileSync(join(assets, 'entry.js'), 'export const photo = true\n')
  mkdirSync(join(assets, 'nested'))
  writeFileSync(join(assets, 'nested/style.css'), 'body { color: black }\n')
  const measured = collectAssets(assets)
  assert.equal(measured.files.length, 2)
  assert.equal(measured.totals.raw, 48)
  assert.ok(measured.totals.gzip > 0 && measured.totals.brotli > 0)
  symlinkSync(join(directory, 'missing.js'), join(assets, 'missing.js'))
  assert.throws(() => collectAssets(assets), { code: 'ENOENT' })

  const installedVue = join(directory, 'node_modules', 'vue')
  mkdirSync(installedVue, { recursive: true })
  writeFileSync(join(installedVue, 'package.json'), JSON.stringify({ version: '3.5.0' }))
  assertFrameworkVersion(directory, 'vue', '3.5.0')
  assert.throws(
    () => assertFrameworkVersion(directory, 'vue', '3.5.42'),
    /expected 3.5.42, installed 3.5.0/,
  )

  const generated = join(directory, 'pnpm-workspace.yaml')
  const runPolicy = () =>
    spawnSync(process.execPath, ['scripts/check-dependency-policy.mjs', generated], {
      encoding: 'utf8',
    })
  writeFileSync(generated, base)
  assert.equal(runPolicy().status, 0)
  writeFileSync(generated, base + exception('2020-01-01T00:00:00Z'))
  const expired = runPolicy()
  assert.equal(expired.status, 1)
  assert.match(expired.stderr, /quarantine exception expired/)
} finally {
  rmSync(directory, { recursive: true, force: true })
}

const workflow = parse(readFileSync('.github/workflows/dependency-policy.yml', 'utf8'))
assert.equal(workflow.on.schedule[0].cron, '23 4 * * *')
const commands = workflow.jobs.expiry.steps.flatMap((step) => step.run ?? [])
assert.deepEqual(commands, [
  'vp install --frozen-lockfile --ignore-scripts',
  'node scripts/check-dependency-policy.mjs',
])
console.log(
  'Maintenance checks passed: expiry, generated install policy, peer range recognition, and missing asset failures.',
)

const ci = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
assert.ok(
  ci.jobs.docs.steps.some((step) =>
    step.run?.startsWith('node scripts/check-dependency-policy.mjs &&'),
  ),
)
