#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(root, '.package-preview')
const releaseDirectory = resolve(root, '.release')

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

const initialStatus = git('status', '--porcelain')
if (initialStatus) throw new Error(`Package preview requires a clean worktree:\n${initialStatus}`)

rmSync(outputDirectory, { force: true, recursive: true })
mkdirSync(outputDirectory)
execFileSync('vp', ['run', 'release:pack'], { cwd: root, stdio: 'inherit' })

const artifact = JSON.parse(
  readFileSync(resolve(releaseDirectory, 'release-artifact.json'), 'utf8'),
)
if (artifact.sourceSha !== git('rev-parse', 'HEAD')) {
  throw new Error('Preview artifact commit does not match HEAD.')
}

const packages = artifact.packages.map((pkg) => {
  const source = resolve(releaseDirectory, pkg.tarball)
  const target = resolve(outputDirectory, basename(source))
  copyFileSync(source, target)
  return {
    name: pkg.name,
    sha256: pkg.sha256,
    tarball: relative(root, target),
  }
})

const manifestPath = resolve(outputDirectory, 'preview-manifest.json')
writeFileSync(
  manifestPath,
  `${JSON.stringify({ sourceSha: artifact.sourceSha, packages }, null, 2)}\n`,
)
rmSync(releaseDirectory, { force: true, recursive: true })

const output = [
  `directory=${relative(root, outputDirectory)}`,
  `manifest=${relative(root, manifestPath)}`,
].join('\n')
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`)
console.log(output)

const finalStatus = git('status', '--porcelain')
if (finalStatus) throw new Error(`Preview build changed tracked files:\n${finalStatus}`)
