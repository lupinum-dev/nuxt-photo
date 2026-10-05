// Used by .github/workflows/release.yml. Never publishes anything itself.
//   node scripts/release.mjs check  prints publish=true when a public workspace package version is not on npm
//                                   yet, or when its release tag is missing (a run that failed after npm)
//   node scripts/release.mjs pack   packs every public package into release/ with releases.json (run `pnpm build`
//                                   first); publish skips versions already on npm, and the packed tests cover the set
// Tags: `v<version>` when every public package shares one version (one package, or a Changesets
// fixed group); otherwise one `<name>@<version>` tag and GitHub release per package.
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const command = process.argv[2]
if (!['check', 'pack'].includes(command)) throw new Error('Usage: node scripts/release.mjs check|pack')

function run(program, args, options = {}) {
  const result = spawnSync(program, args, { encoding: 'utf8', ...options })
  if (result.status !== 0) throw new Error(`${program} ${args.join(' ')} failed:\n${result.stderr}`)
  return result.stdout
}

function isOnNpm({ name, version }) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--json'], { encoding: 'utf8' })
  let response
  try { response = JSON.parse(result.stdout) } catch { /* Invalid JSON fails closed below. */ }
  if (result.status === 0 && response === version) return true
  if (result.status !== 0 && response?.error?.code === 'E404') return false
  throw new Error(`Could not verify npm version ${name}@${version}:\n${result.stderr || result.error?.message || 'Unexpected registry response'}`)
}

// Every package in pnpm-workspace.yaml (and the root), wherever it lives.
const packages = JSON.parse(run('pnpm', ['-r', 'ls', '--json', '--depth', '-1'])).filter(pkg => !pkg.private)
const unpublished = packages.filter(pkg => !isOnNpm(pkg))
const { version } = packages[0]
const fixedGroup = packages.every(pkg => pkg.version === version)
const tags = fixedGroup ? [`v${version}`] : packages.map(pkg => `${pkg.name}@${pkg.version}`)
const missingTags = tags.filter(tag => !run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]).trim())

// npm versions are immutable. When part of this release is already on npm, a fresh run may build the
// rest only from the package source that was versioned; otherwise re-run the original release run.
if (unpublished.length > 0 && unpublished.length < packages.length) {
  const versionCommit = run('git', ['log', '-1', '--format=%H', `-G"version": "${version}"`, '--', ...packages.map(pkg => join(pkg.path, 'package.json'))]).trim()
  const changed = spawnSync('git', ['diff', '--quiet', versionCommit, 'HEAD', '--', 'packages', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
  if (!versionCommit || changed.status !== 0) {
    throw new Error(`Part of ${version} is on npm and the package source changed since ${versionCommit || 'its version commit'}. Re-run all jobs of the original release run instead.`)
  }
}

if (command === 'check') {
  const line = `publish=${unpublished.length > 0 || missingTags.length > 0}\n`
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line)
  process.stdout.write(line)
  process.exit(0)
}

const destination = resolve('release')
rmSync(destination, { recursive: true, force: true })
mkdirSync(destination)

const notes = packages.map((pkg) => {
  run('pnpm', ['pack', '--pack-destination', destination], { cwd: pkg.path })
  // Changesets writes `## <version>` sections into each package's CHANGELOG.md.
  const changelogPath = join(pkg.path, 'CHANGELOG.md')
  const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : ''
  const section = changelog.split(/^## /m).find(part => part.startsWith(`${pkg.version}\n`))
  return { ...pkg, body: section ? section.slice(pkg.version.length).trim() : `Release ${pkg.version}.` }
})

const entry = (tag, version, text) => ({ tag, notes: text, prerelease: version.includes('-') })
const releases = fixedGroup
  ? [entry(`v${version}`, version, notes.map(n => (notes.length > 1 ? `## ${n.name}\n\n${n.body}` : n.body)).join('\n\n'))]
  : notes.map(n => entry(`${n.name}@${n.version}`, n.version, n.body))
writeFileSync(join(destination, 'releases.json'), `${JSON.stringify(releases, null, 2)}\n`)
console.log(releases.map(r => r.tag).join('\n'))
