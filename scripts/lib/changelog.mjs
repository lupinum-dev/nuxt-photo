import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { assert } from './package-set.mjs'

export function listPendingChangesets(rootDir) {
  const changesetDir = join(rootDir, '.changeset')
  if (!existsSync(changesetDir)) {
    return []
  }
  const changesets = readdirSync(changesetDir)
    .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
    .toSorted()
  const prereleasePath = join(changesetDir, 'pre.json')
  if (!existsSync(prereleasePath)) {
    return changesets
  }

  const prerelease = JSON.parse(readFileSync(prereleasePath, 'utf8'))
  if (prerelease.mode !== 'pre') {
    return changesets
  }

  const consumed = new Set(prerelease.changesets ?? [])
  return changesets.filter((entry) => !consumed.has(entry.slice(0, -3)))
}

export function extractChangelogSection(path, version) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const headingPattern = new RegExp(
    `^## (?:\\[${escapedVersion}\\]|${escapedVersion})(?:\\s+-\\s+\\d{4}-\\d{2}-\\d{2})?\\s*$`,
  )
  const start = lines.findIndex((line) => headingPattern.test(line.trim()))
  assert(start !== -1, `${path} has no exact release section for ${version}.`)

  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith('## ')) {
      end = index
      break
    }
  }
  return `${lines.slice(start, end).join('\n').trim()}\n`
}

export function extractPackageSetReleaseNotes(rootDir, packageSet) {
  const packageChangelogs = packageSet.packages.map((pkg) => ({
    name: pkg.name,
    path: join(pkg.absoluteDirectory, 'CHANGELOG.md'),
  }))
  const existingPackageChangelogs = packageChangelogs.filter(({ path }) => existsSync(path))

  if (existingPackageChangelogs.length > 0) {
    assert(
      existingPackageChangelogs.length === packageChangelogs.length,
      'Package changelogs must exist for every public package or none of them.',
    )
    return `${existingPackageChangelogs
      .map(
        ({ name, path }) =>
          `# ${name}\n\n${extractChangelogSection(path, packageSet.packageSetVersion).trim()}`,
      )
      .join('\n\n')}\n`
  }

  return extractChangelogSection(join(rootDir, 'CHANGELOG.md'), packageSet.packageSetVersion)
}
