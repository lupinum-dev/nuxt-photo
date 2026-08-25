import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

export function classifyReconciliation({
  modes,
  tagState,
  releaseState,
  assetState,
  metadataState,
}) {
  assert(
    !modes.some((mode) => !['absent', 'oidc', 'bootstrap'].includes(mode)),
    'Unverified npm state.',
  )
  assert(tagState !== 'conflict', 'The release tag targets a different commit.')
  assert(
    !(tagState === 'absent' && releaseState === 'present'),
    'A GitHub Release exists without its certified tag.',
  )
  if (modes.includes('absent')) {
    assert(
      tagState === 'absent' && releaseState === 'absent',
      'GitHub release state exists before the fixed package set is complete.',
    )
    return 'publish'
  }
  if (
    tagState === 'absent' ||
    releaseState === 'absent' ||
    assetState !== 'verified' ||
    metadataState !== 'verified'
  )
    return 'repair'
  return 'complete'
}

export function releaseMetadataState(release, record, expectedBody) {
  return release.isPrerelease === (record.channel === 'next') &&
    release.name === record.tag &&
    typeof release.body === 'string' &&
    release.body.replace(/\r\n/gu, '\n').trimEnd() === expectedBody.trimEnd()
    ? 'verified'
    : 'conflict'
}

const run = (args) => {
  const result = spawnSync('gh', args, { encoding: 'utf8' })
  assert(result.status === 0, `gh ${args.join(' ')} failed: ${result.stderr.trim()}`)
  return result.stdout.trim()
}

function resolveTag(record) {
  const result = spawnSync(
    'gh',
    [
      'api',
      `repos/${process.env.GITHUB_REPOSITORY}/git/ref/tags/${record.tag}`,
      '--jq',
      '[.object.type, .object.sha] | @tsv',
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0 && /HTTP 404|Not Found/u.test(result.stderr)) return 'absent'
  assert(result.status === 0, `Could not read ${record.tag}: ${result.stderr.trim()}`)
  let [type, sha] = result.stdout.trim().split('\t')
  while (type === 'tag') {
    ;[type, sha] = run([
      'api',
      `repos/${process.env.GITHUB_REPOSITORY}/git/tags/${sha}`,
      '--jq',
      '[.object.type, .object.sha] | @tsv',
    ]).split('\t')
  }
  return type === 'commit' && sha === record.sourceSha ? 'verified' : 'conflict'
}

function inspectRelease(record, releaseDir, expectedBody) {
  const view = spawnSync(
    'gh',
    [
      'release',
      'view',
      record.tag,
      '--repo',
      process.env.GITHUB_REPOSITORY,
      '--json',
      'assets,body,isPrerelease,name',
    ],
    { encoding: 'utf8' },
  )
  if (view.status !== 0 && /HTTP 404|release not found/iu.test(view.stderr)) {
    return { releaseState: 'absent', assetState: 'absent', metadataState: 'absent' }
  }
  assert(view.status === 0, `Could not read ${record.tag} Release: ${view.stderr.trim()}`)
  const expected = [
    ...record.packages.map((pkg) => pkg.tarball),
    'release-artifact.json',
    'release-record.json',
    'registry-verification.json',
  ]
  const release = JSON.parse(view.stdout)
  const metadataState = releaseMetadataState(release, record, expectedBody)
  const assets = new Set(release.assets.map((asset) => asset.name))
  if (!expected.every((file) => assets.has(basename(file)))) {
    return { releaseState: 'present', assetState: 'absent', metadataState }
  }
  const directory = mkdtempSync(join(tmpdir(), 'nuxt-photo-release-'))
  try {
    const download = spawnSync(
      'gh',
      [
        'release',
        'download',
        record.tag,
        '--repo',
        process.env.GITHUB_REPOSITORY,
        '--dir',
        directory,
      ],
      { encoding: 'utf8' },
    )
    assert(
      download.status === 0,
      `Could not download ${record.tag} assets: ${download.stderr.trim()}`,
    )
    const downloaded = new Set(readdirSync(directory))
    const matches = expected.every((file) => {
      if (!downloaded.has(basename(file))) return false
      const local = createHash('sha256')
        .update(readFileSync(join(releaseDir, file)))
        .digest('hex')
      const remote = createHash('sha256')
        .update(readFileSync(join(directory, basename(file))))
        .digest('hex')
      return local === remote
    })
    return {
      releaseState: 'present',
      assetState: matches ? 'verified' : 'conflict',
      metadataState,
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const releaseDir =
    args[0] && !args[0].startsWith('--') ? resolve(args.shift()) : resolve('.release')
  const argument = (name) => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args[index + 1]
  }

  const record = JSON.parse(readFileSync(join(releaseDir, 'release-record.json'), 'utf8'))
  const verification = JSON.parse(
    readFileSync(join(releaseDir, 'registry-verification.json'), 'utf8'),
  )
  assert(
    record.version === verification.version && record.sourceSha === verification.sourceSha,
    'Registry evidence differs from the release record.',
  )
  assert(
    record.packages.length === verification.packages.length,
    'Registry evidence does not cover the fixed package set.',
  )
  assert(
    JSON.stringify(record.packages.map(({ name, version }) => ({ name, version }))) ===
      JSON.stringify(verification.packages.map(({ name, version }) => ({ name, version }))),
    'Registry evidence package coordinates differ from the fixed package set.',
  )
  const tagState = resolveTag(record)
  const modes = verification.packages.map((pkg) => pkg.mode)
  const bootstrapPackages = verification.packages
    .filter((pkg) => pkg.mode === 'bootstrap')
    .map((pkg) => pkg.name)
  const baseNotes = readFileSync(join(releaseDir, 'github-release-notes.md'), 'utf8').trimEnd()
  const expectedBody =
    bootstrapPackages.length === 0
      ? baseNotes
      : `${baseNotes}\n\n> [!NOTE]\n> This first npm version was created from the exact CI-certified artifact before npm trusted publishing could be configured. npm does not provide GitHub OIDC provenance for this bootstrap publication. The protected workflow verified the registry bytes. Later versions use trusted publishing with provenance.\n> Bootstrap packages: ${bootstrapPackages.join(',')}`
  const { releaseState, assetState, metadataState } = inspectRelease(
    record,
    releaseDir,
    expectedBody,
  )
  const action = classifyReconciliation({
    modes,
    tagState,
    releaseState,
    assetState,
    metadataState,
  })
  if (action !== 'complete' && bootstrapPackages.length > 0) {
    assert(
      false,
      'HUMAN-ONLY: historical provenance-free packages cannot use automatic reconciliation.',
    )
  }
  const modeMap = Object.fromEntries(verification.packages.map((pkg) => [pkg.name, pkg.mode]))
  const summary = argument('--summary')
  if (summary) {
    appendFileSync(
      summary,
      `${[
        '',
        '## Reconciliation',
        '',
        `- Action: \`${action}\``,
        `- Tag: \`${tagState}\``,
        `- GitHub Release: \`${releaseState}\``,
        `- Release assets: \`${assetState}\``,
        `- Release metadata: \`${metadataState}\``,
        `- Workflow: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        `- Approval: ${action === 'publish' ? 'awaiting protected npm approval' : 'not required'}`,
        '',
        '| Package | Version | Channel | Provenance | Artifact |',
        '|---|---|---|---|---|',
        ...verification.packages.map(
          (pkg) =>
            `| \`${pkg.name}\` | \`${pkg.version}\` | \`${record.channel}\` | \`${pkg.mode}\` | \`verified\` |`,
        ),
        '',
        `**Next action:** ${
          action === 'publish'
            ? 'Approve the protected npm environment for this exact package set.'
            : action === 'repair'
              ? 'Repair only the tag or GitHub Release; follow an exact HUMAN-ONLY instruction if GitHub rejects a historical tag.'
              : 'None. npm, tag, Release, and retained assets are complete.'
        }`,
        '',
      ].join('\n')}\n`,
    )
  }
  const output = argument('--github-output')
  if (output) {
    appendFileSync(output, `action=${action}\n`)
    appendFileSync(output, `bootstrap=${String(bootstrapPackages.length > 0)}\n`)
    appendFileSync(output, `bootstrap-packages=${bootstrapPackages.join(',')}\n`)
    appendFileSync(output, `modes=${JSON.stringify(modeMap)}\n`)
  }

  process.stdout.write(`release reconciliation: ${action}\n`)
}
