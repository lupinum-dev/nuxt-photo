import { appendFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assert, readJson } from './lib/package-set.mjs'
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
const summaryPath = readArgument('--summary')
const { record } = verifyReleaseRecord(releaseDir, {
  expectedSha,
  publishable: true,
  rootDir,
})
const stagesDir = join(releaseDir, 'stages')
assert(existsSync(stagesDir), `Missing staged-package evidence: ${stagesDir}`)

const stageFiles = readdirSync(stagesDir)
  .filter((entry) => entry.endsWith('.json'))
  .toSorted()
const stageByPackage = new Map()
for (const filename of stageFiles) {
  const stage = readJson(join(stagesDir, filename))
  assert(stage.schemaVersion === 1, `Unsupported stage schema in ${filename}.`)
  assert(!stageByPackage.has(stage.package), `Duplicate stage for ${stage.package}.`)
  stageByPackage.set(stage.package, stage)
}
assert(
  stageByPackage.size === record.packages.length,
  'Stage evidence does not cover the complete package set.',
)

const packageByName = new Map(record.packages.map((pkg) => [pkg.name, pkg]))
const stages = record.publishOrder.map((packageName) => {
  const stage = stageByPackage.get(packageName)
  const pkg = packageByName.get(packageName)
  assert(stage, `Missing stage evidence for ${packageName}.`)
  for (const [field, expected] of [
    ['sourceSha', record.sourceSha],
    ['ciRunId', record.ciRunId],
    ['version', pkg.version],
    ['stagingTag', record.stagingTag],
    ['tarball', pkg.tarball],
    ['sha1', pkg.sha1],
    ['sha256', pkg.sha256],
  ]) {
    assert(stage[field] === expected, `${packageName} stage ${field} differs.`)
  }
  assert(
    typeof stage.stageId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        stage.stageId,
      ),
    `${packageName} stage ID is invalid.`,
  )
  return stage
})

const stageRecord = {
  schemaVersion: 1,
  sourceSha: record.sourceSha,
  ciRunId: record.ciRunId,
  version: record.version,
  stagingTag: record.stagingTag,
  publishOrder: record.publishOrder,
  stages,
}
const stageRecordPath = join(releaseDir, 'stage-record.json')
writeFileSync(stageRecordPath, `${JSON.stringify(stageRecord, null, 2)}\n`)

const summary = [
  `# npm stages ready: ${record.tag}`,
  '',
  `Nothing is on \`${record.channel}\` yet.`,
  `Approve the npm stages with 2FA in this order:`,
  '',
  ...stages.flatMap((stage, index) => [
    `${index + 1}. \`${stage.package}@${stage.version}\``,
    `   - Inspect: \`npm stage view ${stage.stageId}\``,
    `   - Approve: \`npm stage approve ${stage.stageId}\``,
  ]),
  '',
  `After both packages are readable under \`${record.stagingTag}\`, promote in order:`,
  '',
  ...record.publishOrder.map((name) => {
    const pkg = packageByName.get(name)
    return `- \`${pkg.promoteCommand}\``
  }),
  '',
  'Then restore the temporary staging tags:',
  '',
  ...record.publishOrder.map((name) => {
    const pkg = packageByName.get(name)
    return `- \`${pkg.rollbackStagingCommand}\``
  }),
  '',
  'Only after those registry checks pass should the waiting finalization job be approved.',
  '',
]

if (summaryPath) {
  appendFileSync(summaryPath, `${summary.join('\n')}\n`)
}
process.stdout.write(`stage record prepared for ${record.tag} (${stages.length} packages)\n`)
