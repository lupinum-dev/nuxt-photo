import { execFileSync } from 'node:child_process'

function parseJsonOutput(output) {
  const value = output.trim()
  return value ? JSON.parse(value) : null
}

export function npmView(spec, field, { allowMissing = false } = {}) {
  try {
    const output = execFileSync('npm', ['view', spec, field, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return parseJsonOutput(output)
  } catch (error) {
    const stderr = String(error.stderr ?? '')
    if (allowMissing && (stderr.includes('E404') || stderr.includes('404 Not Found'))) {
      return null
    }
    throw new Error(`npm view failed for ${spec} ${field}: ${stderr.trim()}`, {
      cause: error,
    })
  }
}

export function readRegistryState(packageName, version) {
  const publishedVersion = npmView(`${packageName}@${version}`, 'version', {
    allowMissing: true,
  })
  const distTags = npmView(packageName, 'dist-tags', { allowMissing: true }) ?? {}

  if (!publishedVersion) {
    return {
      attestations: null,
      distTags,
      published: false,
      shasum: null,
    }
  }

  return {
    attestations: npmView(`${packageName}@${version}`, 'dist.attestations'),
    distTags,
    published: true,
    shasum: npmView(`${packageName}@${version}`, 'dist.shasum'),
  }
}

function parseSemver(version) {
  const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
    version,
  )
  if (!match) {
    throw new Error(`Invalid SemVer: ${version}`)
  }
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]?.split('.') ?? [],
  }
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) return 0
  if (left.length === 0) return 1
  if (right.length === 0) return -1

  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index]
    const rightValue = right[index]
    if (leftValue === undefined) return -1
    if (rightValue === undefined) return 1
    if (leftValue === rightValue) continue

    const leftNumeric = /^\d+$/.test(leftValue)
    const rightNumeric = /^\d+$/.test(rightValue)
    if (leftNumeric && rightNumeric) {
      const normalizedLeft = leftValue.replace(/^0+(?=\d)/, '')
      const normalizedRight = rightValue.replace(/^0+(?=\d)/, '')
      if (normalizedLeft.length !== normalizedRight.length) {
        return normalizedLeft.length > normalizedRight.length ? 1 : -1
      }
      return normalizedLeft > normalizedRight ? 1 : -1
    }
    if (leftNumeric) return -1
    if (rightNumeric) return 1
    return leftValue > rightValue ? 1 : -1
  }
  return 0
}

export function compareSemver(leftVersion, rightVersion) {
  const left = parseSemver(leftVersion)
  const right = parseSemver(rightVersion)

  for (let index = 0; index < left.core.length; index += 1) {
    const difference = left.core[index] - right.core[index]
    if (difference !== 0) {
      return difference > 0 ? 1 : -1
    }
  }
  return comparePrerelease(left.prerelease, right.prerelease)
}

export function releaseChannel(version) {
  return parseSemver(version).prerelease.length > 0 ? 'next' : 'latest'
}

export function hasAttestations(value) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object' && Object.keys(value).length)
}
