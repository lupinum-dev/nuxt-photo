import { readFileSync } from 'node:fs'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const manifests = [
  readJson('packages/vue/package.json'),
  readJson('packages/nuxt/package.json'),
]
const versions = new Set(manifests.map((manifest) => manifest.version))
assert(versions.size === 1, 'Public package versions must match')

const [version] = versions
const changelog = readFileSync('CHANGELOG.md', 'utf8')
assert(
  changelog.includes(`## [${version}]`),
  `CHANGELOG.md has no ${version} release heading`,
)

if (process.env.GITHUB_REF_TYPE === 'tag') {
  const expectedTag = `v${version}`
  assert(
    process.env.GITHUB_REF_NAME === expectedTag,
    `Release tag ${process.env.GITHUB_REF_NAME} does not match ${expectedTag}`,
  )
}

process.stdout.write(`Verified release identity ${version}.\n`)
