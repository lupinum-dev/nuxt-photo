import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractPackageSetReleaseNotes, listPendingChangesets } from './lib/changelog.mjs'
import { releaseChannel } from './lib/npm-registry.mjs'
import { assert, discoverPackageSet } from './lib/package-set.mjs'
import { verifyReleaseArtifact } from './lib/release-artifact.mjs'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
assert(
  args.every((argument) => argument === '--json'),
  'Usage: node scripts/release-notes.mjs [--json]',
)
const jsonOutput = args.includes('--json')
const packageSet = discoverPackageSet(rootDir)
const pendingChangesets = listPendingChangesets(rootDir)

function readGit(gitArgs) {
  try {
    return execFileSync('git', gitArgs, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

let releaseNotes = null
let releaseNotesError = null
try {
  releaseNotes = extractPackageSetReleaseNotes(rootDir, packageSet)
} catch (error) {
  releaseNotesError = error instanceof Error ? error.message : String(error)
}

const releaseDirectory = join(rootDir, '.release')
const artifactPresent = existsSync(join(releaseDirectory, 'release-artifact.json'))
let artifact = {
  present: artifactPresent,
  valid: false,
  error: null,
  metadata: null,
}
if (artifactPresent) {
  try {
    const verified = verifyReleaseArtifact(releaseDirectory, { rootDir })
    artifact = {
      present: true,
      valid: true,
      error: null,
      metadata: verified.metadata,
    }
  } catch (error) {
    artifact.error = error instanceof Error ? error.message : String(error)
  }
}

const worktreeStatus = readGit(['status', '--porcelain=v1', '--untracked-files=all'])
const git = {
  sha: readGit(['rev-parse', 'HEAD']),
  branch: readGit(['branch', '--show-current']),
  clean: worktreeStatus === null ? null : worktreeStatus.length === 0,
}
const blockers = []
const warnings = []
const confirmed = []

if (!git.sha) {
  blockers.push('The current source has no verifiable Git commit.')
} else {
  confirmed.push('The current source has a Git commit.')
}
if (git.clean === false) {
  blockers.push(
    'The worktree has local changes and is not a release candidate. Preserve the changes; do not create publication evidence here.',
  )
} else if (git.clean === true) {
  confirmed.push('The worktree is clean.')
}
if (pendingChangesets.length > 0) {
  blockers.push(
    `${pendingChangesets.length} pending Changeset${
      pendingChangesets.length === 1 ? '' : 's'
    } must flow through the version pull request.`,
  )
} else {
  confirmed.push('No pending Changesets remain.')
}
if (!releaseNotes) {
  blockers.push(releaseNotesError ?? 'The current version has no release notes.')
} else {
  confirmed.push('The changelog contains the current package-set version.')
}
if (artifact.present && !artifact.valid) {
  blockers.push(`The local release artifact is invalid: ${artifact.error}`)
}
if (artifact.valid) {
  confirmed.push('The retained local package set has valid digests and metadata.')
  if (!artifact.metadata.releaseEligible) {
    blockers.push(
      'The retained package set is not publication-eligible. Regenerate it from a clean commit with the declared Node, pnpm, and Vite+ versions.',
    )
  }
  if (artifact.metadata.sourceSha !== git.sha) {
    blockers.push('The retained package set belongs to another source commit.')
  }
  if (artifact.metadata.packageSetVersion !== packageSet.packageSetVersion) {
    blockers.push('The retained package set has another version.')
  }
}

let status = 'REMOTE STATE REQUIRED'
let nextAction =
  'Confirm this exact SHA is current main and Main healthy passed, then use that CI run ID for the release workflow.'
if (git.clean === false) {
  status = 'LOCAL CHANGES NOT RELEASE CANDIDATE'
  nextAction = 'Finish and verify the current change; do not start a release from this worktree.'
} else if (pendingChangesets.length > 0) {
  status = 'VERSION PR REQUIRED'
  nextAction =
    'Review and merge the Changesets version pull request; do not edit package versions by hand.'
} else if (blockers.length > 0) {
  status = 'LOCAL EVIDENCE INVALID'
  nextAction = 'Resolve the first local blocker, then regenerate evidence with vp run release:pack.'
} else if (artifact.valid && artifact.metadata.sourceSha === git.sha && git.clean === true) {
  status = 'LOCAL EVIDENCE VERIFIED'
}

const briefing = {
  schemaVersion: 1,
  status,
  packageSet: {
    version: packageSet.packageSetVersion,
    channel: releaseChannel(packageSet.packageSetVersion),
    publishOrder: packageSet.publishOrder,
  },
  git,
  artifact: {
    status: artifact.present ? (artifact.valid ? 'valid' : 'invalid') : 'absent',
    sourceSha: artifact.metadata?.sourceSha ?? null,
    packages:
      artifact.metadata?.packages.map((pkg) => ({
        name: pkg.name,
        tarball: pkg.tarball,
        sha256: pkg.sha256,
      })) ?? [],
  },
  pendingChangesets,
  confirmed,
  warnings,
  blockers,
  releaseNotes,
  publicationPerformed: false,
  nextAction,
}

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(briefing, null, 2)}\n`)
} else {
  const lines = [
    `# Release briefing: Nuxt Photo ${packageSet.packageSetVersion}`,
    '',
    `RELEASE STATUS: ${status}`,
    '',
    `Candidate version: ${packageSet.packageSetVersion}`,
    `Channel: ${briefing.packageSet.channel}`,
    `Source SHA: ${git.sha ?? 'unavailable'}`,
    `Worktree: ${git.clean === null ? 'unknown' : git.clean ? 'clean' : 'dirty'}`,
    '',
    'Package order:',
    ...packageSet.publishOrder.map((name, index) => `${index + 1}. ${name}`),
    '',
    'Confirmed:',
    ...(confirmed.length > 0 ? confirmed.map((item) => `- ${item}`) : ['- None.']),
    '',
    'Warnings:',
    ...(warnings.length > 0 ? warnings.map((item) => `- ${item}`) : ['- None.']),
    '',
    'Blocked:',
    ...(blockers.length > 0 ? blockers.map((item) => `- ${item}`) : ['- None locally.']),
    '',
    'Publication performed: No',
    '',
    'Next action:',
    nextAction,
    '',
    'Release contents:',
    '',
    releaseNotes?.trim() ?? 'No exact release notes are available.',
    '',
  ]
  process.stdout.write(`${lines.join('\n')}\n`)
}

if (artifact.present && !artifact.valid) {
  process.exitCode = 1
}
