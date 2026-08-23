import { createHash } from 'node:crypto'
import { basename, join } from 'node:path'
import { readFileSync } from 'node:fs'

import { hasAttestations } from './npm-registry.mjs'

export const PREDICATE_TYPE = 'https://slsa.dev/provenance/v1'
export const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1'
export const WORKFLOW = Object.freeze({
  repository: 'https://github.com/lupinum-dev/nuxt-photo',
  repositorySlug: 'lupinum-dev/nuxt-photo',
  path: '.github/workflows/release.yml',
  ref: 'refs/heads/main',
  identity:
    'https://github.com/lupinum-dev/nuxt-photo/.github/workflows/release.yml@refs/heads/main',
  sourceDependency: 'git+https://github.com/lupinum-dev/nuxt-photo@refs/heads/main',
})
const SIGSTORE_BASE_OPTIONS = Object.freeze({
  certificateIssuer: 'https://token.actions.githubusercontent.com',
  certificateIdentityURI:
    '^https://github\\.com/lupinum-dev/nuxt-photo/\\.github/workflows/release\\.yml@refs/heads/main$',
  ctLogThreshold: 1,
  tlogThreshold: 1,
})
export const CERTIFICATE_OIDS = Object.freeze({
  sourceSha: '1.3.6.1.4.1.57264.1.3',
  repository: '1.3.6.1.4.1.57264.1.5',
  ref: '1.3.6.1.4.1.57264.1.6',
})

const EXPECTED_PACKAGES = ['@lupinum/vue-photo', '@lupinum/nuxt-photo']

export async function createRegistryVerification({
  fetchAttestations,
  releaseDir,
  releaseRecord,
  releaseRecordBytes,
  verifyBundle,
  view,
}) {
  assert(releaseRecord.schemaVersion === 2, 'Unsupported release record.')
  assert(/^[0-9a-f]{40}$/.test(releaseRecord.sourceSha), 'Release record source SHA is invalid.')
  const sigstoreOptions = createSigstoreOptions(releaseRecord.sourceSha)
  assert(
    JSON.stringify(releaseRecord.publishOrder) === JSON.stringify(EXPECTED_PACKAGES),
    'Release record publish order differs.',
  )
  assert(
    Array.isArray(releaseRecord.packages) &&
      releaseRecord.packages.length === EXPECTED_PACKAGES.length,
    'Release record package set differs.',
  )

  const packages = []
  for (const name of EXPECTED_PACKAGES) {
    const matches = releaseRecord.packages.filter((candidate) => candidate.name === name)
    assert(matches.length === 1, `Release record must contain exactly one ${name} package.`)
    const pkg = matches[0]
    assert(pkg.version === releaseRecord.version, `${name} version differs from the package set.`)
    assert(
      pkg.tarball === basename(pkg.tarball) && pkg.tarball.endsWith('.tgz'),
      `${name} tarball path is invalid.`,
    )

    const bytes = readFileSync(join(releaseDir, pkg.tarball))
    assert(digest(bytes, 'sha1') === pkg.sha1, `${name} failed SHA-1 verification.`)
    assert(digest(bytes, 'sha256') === pkg.sha256, `${name} failed SHA-256 verification.`)
    const sha512 = digest(bytes, 'sha512')
    const spec = `${name}@${pkg.version}`
    const shasum = view(spec, 'dist.shasum', { allowMissing: true })
    const channelVersion = view(name, `dist-tags.${releaseRecord.channel}`, {
      allowMissing: true,
    })

    if (!shasum) {
      packages.push({
        ...pkg,
        sha512,
        mode: 'absent',
        channelVersion,
        provenanceBundleSha256: null,
      })
      continue
    }

    assert(shasum === pkg.sha1, `${spec} exists with different bytes.`)
    assert(
      channelVersion === pkg.version,
      `${spec} does not own the ${releaseRecord.channel} npm tag.`,
    )
    const attestations = view(spec, 'dist.attestations', { allowMissing: true })
    if (hasAttestations(attestations)) {
      const provenanceBundleSha256 = await verifyNpmProvenance({
        attestations,
        expectedSha512: sha512,
        fetchAttestations,
        pkg,
        sigstoreOptions,
        sourceSha: releaseRecord.sourceSha,
        verifyBundle,
      })
      packages.push({
        ...pkg,
        sha512,
        mode: 'oidc',
        channelVersion,
        provenanceBundleSha256,
      })
      continue
    }

    const published = view(name, 'versions')
    const versions = Array.isArray(published) ? published : [published]
    assert(
      versions.length === 1 && versions[0] === pkg.version,
      `${spec} is not the sole first package version and has no provenance.`,
    )
    packages.push({
      ...pkg,
      sha512,
      mode: 'bootstrap',
      channelVersion,
      provenanceBundleSha256: null,
    })
  }

  return {
    schemaVersion: 1,
    releaseRecordSha256: digest(releaseRecordBytes, 'sha256'),
    sourceSha: releaseRecord.sourceSha,
    version: releaseRecord.version,
    channel: releaseRecord.channel,
    sigstoreVersion: '5.0.0',
    workflow: {
      repository: WORKFLOW.repository,
      path: WORKFLOW.path,
      ref: WORKFLOW.ref,
      identity: WORKFLOW.identity,
      certificateIssuer: sigstoreOptions.certificateIssuer,
      certificateOIDs: sigstoreOptions.certificateOIDs,
    },
    packages,
  }
}

async function verifyNpmProvenance({
  attestations,
  expectedSha512,
  fetchAttestations,
  pkg,
  sigstoreOptions,
  sourceSha,
  verifyBundle,
}) {
  assert(typeof attestations.url === 'string', `${pkg.name}@${pkg.version} has no attestation URL.`)
  const document = await fetchAttestations(attestations.url)
  const candidates = document?.attestations?.filter(
    (attestation) => attestation.predicateType === PREDICATE_TYPE && attestation.bundle,
  )
  assert(
    Array.isArray(candidates) && candidates.length > 0,
    `${pkg.name}@${pkg.version} has no SLSA provenance bundle.`,
  )

  let lastError
  for (const candidate of candidates) {
    try {
      await verifyBundle(candidate.bundle, sigstoreOptions)
      const payload = candidate.bundle?.dsseEnvelope?.payload
      assert(typeof payload === 'string', 'The verified provenance bundle has no DSSE payload.')
      assert(
        candidate.bundle.dsseEnvelope.payloadType === 'application/vnd.in-toto+json',
        'The verified provenance bundle has the wrong DSSE payload type.',
      )
      const statement = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
      verifyStatement({ expectedSha512, pkg, sourceSha, statement })
      return digest(JSON.stringify(candidate.bundle), 'sha256')
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    `${pkg.name}@${pkg.version} provenance verification failed: ${lastError?.message ?? 'unknown error'}`,
    { cause: lastError },
  )
}

export function createSigstoreOptions(sourceSha) {
  assert(/^[0-9a-f]{40}$/.test(sourceSha), 'Sigstore certificate source SHA is invalid.')
  return Object.freeze({
    ...SIGSTORE_BASE_OPTIONS,
    certificateOIDs: Object.freeze({
      [CERTIFICATE_OIDS.sourceSha]: sourceSha,
      [CERTIFICATE_OIDS.repository]: WORKFLOW.repositorySlug,
      [CERTIFICATE_OIDS.ref]: WORKFLOW.ref,
    }),
  })
}

function verifyStatement({ expectedSha512, pkg, sourceSha, statement }) {
  const expectedSubject = `pkg:npm/${pkg.name.replaceAll('@', '%40')}@${pkg.version}`
  const workflow = statement.predicate?.buildDefinition?.externalParameters?.workflow
  const dependencies = statement.predicate?.buildDefinition?.resolvedDependencies ?? []
  assert(statement._type === STATEMENT_TYPE, 'Provenance statement type differs.')
  assert(statement.predicateType === PREDICATE_TYPE, 'Provenance predicate type differs.')
  assert(
    statement.subject?.length === 1 &&
      statement.subject[0].name === expectedSubject &&
      statement.subject[0].digest?.sha512 === expectedSha512,
    'Provenance subject does not match the exact npm tarball SHA-512.',
  )
  assert(
    workflow?.repository === WORKFLOW.repository &&
      workflow?.path === WORKFLOW.path &&
      workflow?.ref === WORKFLOW.ref,
    'Provenance workflow does not match the release workflow on main.',
  )
  assert(
    dependencies.some(
      (dependency) =>
        dependency.uri === WORKFLOW.sourceDependency && dependency.digest?.gitCommit === sourceSha,
    ),
    'Provenance source dependency does not match the certified source SHA.',
  )
}

function digest(value, algorithm) {
  return createHash(algorithm).update(value).digest('hex')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
