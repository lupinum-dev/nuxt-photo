import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const packages = [
  ['@nuxt-photo/core', 'packages/core'],
  ['@nuxt-photo/engine', 'packages/engine'],
  ['@nuxt-photo/vue', 'packages/vue'],
  ['@nuxt-photo/recipes', 'packages/recipes'],
  ['@nuxt-photo/nuxt', 'packages/nuxt'],
]

const requiredPackageFiles = ['package.json', 'README.md']

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })
}

function readPackedPackageJson(tarball) {
  const raw = run('tar', ['-xOf', tarball, 'package/package.json'])
  return JSON.parse(raw)
}

function listPackedFiles(tarball) {
  return run('tar', ['-tf', tarball]).trim().split('\n').filter(Boolean)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const packDir = mkdtempSync(join(tmpdir(), 'nuxt-photo-pack-'))

try {
  for (const [packageName, packageDir] of packages) {
    const before = new Set(readdirSync(packDir))
    run('pnpm', ['pack', '--pack-destination', packDir], {
      cwd: packageDir,
    })

    const tarballName = readdirSync(packDir).find((file) => !before.has(file))
    assert(tarballName, `No tarball produced for ${packageName}`)

    const tarball = join(packDir, tarballName)
    const packageJson = readPackedPackageJson(tarball)
    const files = listPackedFiles(tarball)

    assert(
      packageJson.name === packageName,
      `Packed ${packageName} produced ${packageJson.name}`,
    )
    assert(
      packageJson.version === '0.1.0',
      `${packageName} package version is ${packageJson.version}`,
    )
    assert(
      packageJson.license === 'MIT',
      `${packageName} package license is ${packageJson.license}`,
    )
    assert(
      files.some((file) => file.startsWith('package/dist/')),
      `${packageName} tarball is missing dist files`,
    )

    for (const required of requiredPackageFiles) {
      assert(
        files.includes(`package/${required}`),
        `${packageName} tarball is missing ${required}`,
      )
    }

    const dependencyBlocks = [
      packageJson.dependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies,
    ].filter(Boolean)

    for (const block of dependencyBlocks) {
      for (const [dependency, range] of Object.entries(block)) {
        assert(
          !String(range).startsWith('workspace:'),
          `${packageName} dependency ${dependency} was not rewritten: ${range}`,
        )
      }
    }

    process.stdout.write(`packed ${packageName}: ${tarballName}\n`)
  }
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
