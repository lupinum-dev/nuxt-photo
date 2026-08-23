import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CERTIFICATE_OIDS,
  createRegistryVerification,
  PREDICATE_TYPE,
  STATEMENT_TYPE,
  WORKFLOW,
} from './lib/registry-provenance.mjs'

await runValidFixture()
await expectFailure('invalid signature', { invalidSignature: true }, 'signature is invalid')
await expectFailure(
  'missing certificate source SHA',
  { missingCertificateOid: CERTIFICATE_OIDS.sourceSha },
  'certificate OID differs',
)
await expectFailure(
  'mismatched certificate source SHA',
  { wrongCertificateOid: CERTIFICATE_OIDS.sourceSha },
  'certificate OID differs',
)
await expectFailure(
  'mismatched certificate repository',
  { wrongCertificateOid: CERTIFICATE_OIDS.repository },
  'certificate OID differs',
)
await expectFailure(
  'mismatched certificate ref',
  { wrongCertificateOid: CERTIFICATE_OIDS.ref },
  'certificate OID differs',
)
await expectFailure(
  'wrong source SHA',
  { wrongSource: '@lupinum/vue-photo' },
  'source dependency does not match',
)
await expectFailure(
  'wrong tarball SHA-512',
  { wrongSha512: '@lupinum/vue-photo' },
  'exact npm tarball SHA-512',
)
await expectFailure(
  'wrong workflow',
  { wrongWorkflow: '@lupinum/vue-photo' },
  'workflow does not match',
)
await expectFailure(
  'later provenance-free version',
  {
    modes: {
      '@lupinum/vue-photo': 'bootstrap',
      '@lupinum/nuxt-photo': 'bootstrap',
    },
    extraVersion: '@lupinum/vue-photo',
  },
  'sole first package version',
)

process.stdout.write('Registry provenance fixtures verified.\n')

async function runValidFixture() {
  const fixture = createFixture({})
  try {
    const verification = await fixture.verify()
    assert(
      JSON.stringify(verification.packages.map((pkg) => pkg.mode)) ===
        JSON.stringify(['oidc', 'absent']),
      'The valid fixture recorded the wrong verification modes.',
    )
    assert(
      verification.releaseRecordSha256 === digest(fixture.releaseRecordBytes, 'sha256'),
      'The verification record is not bound to the exact release record.',
    )
    assert(
      verification.packages.every(
        (pkg, index) => pkg.sha512 === digest(fixture.packageBytes[index], 'sha512'),
      ),
      'The verification record is missing an exact tarball SHA-512.',
    )
    assert(
      verification.packages[0].provenanceBundleSha256 ===
        digest(JSON.stringify(fixture.bundles[0]), 'sha256'),
      'The verification record is not bound to the verified provenance bundle.',
    )
    assert(fixture.verifyCalls.length === 1, 'Sigstore must verify the existing OIDC package.')
    const sigstoreOptions = fixture.verifyCalls[0]
    const expectedCertificateOIDs = {
      [CERTIFICATE_OIDS.sourceSha]: 'a'.repeat(40),
      [CERTIFICATE_OIDS.repository]: WORKFLOW.repositorySlug,
      [CERTIFICATE_OIDS.ref]: WORKFLOW.ref,
    }
    assert(
      sigstoreOptions.certificateIssuer === 'https://token.actions.githubusercontent.com' &&
        sigstoreOptions.certificateIdentityURI ===
          '^https://github\\.com/lupinum-dev/nuxt-photo/\\.github/workflows/release\\.yml@refs/heads/main$',
      'Sigstore must enforce the exact GitHub Actions issuer and workflow identity.',
    )
    assert(
      JSON.stringify(sigstoreOptions.certificateOIDs) === JSON.stringify(expectedCertificateOIDs) &&
        JSON.stringify(verification.workflow.certificateOIDs) ===
          JSON.stringify(expectedCertificateOIDs),
      'Sigstore and the retained record must bind the certificate source SHA, repository, and ref.',
    )
    assert(
      fixture.documents[0].attestations[0].signedAccessSignatureUrl === '',
      "The regression fixture must preserve npm's empty signedAccessSignatureUrl.",
    )
  } finally {
    fixture.cleanup()
  }

  const bootstrapFixture = createFixture({
    modes: {
      '@lupinum/vue-photo': 'bootstrap',
      '@lupinum/nuxt-photo': 'bootstrap',
    },
  })
  try {
    const verification = await bootstrapFixture.verify()
    assert(
      verification.packages.every(
        (pkg) => pkg.mode === 'bootstrap' && pkg.provenanceBundleSha256 === null,
      ),
      'The historical sole-version fixture must remain an explicit bootstrap mode.',
    )
    assert(
      bootstrapFixture.verifyCalls.length === 0,
      'Bootstrap eligibility must not pretend to have cryptographic provenance.',
    )
  } finally {
    bootstrapFixture.cleanup()
  }
}

async function expectFailure(name, options, expectedMessage) {
  const fixture = createFixture(options)
  try {
    let error
    try {
      await fixture.verify()
    } catch (caught) {
      error = caught
    }
    assert(error, `${name} unexpectedly succeeded.`)
    assert(
      error.message.includes(expectedMessage),
      `${name} failed for the wrong reason: ${error.message}`,
    )
  } finally {
    fixture.cleanup()
  }
}

function createFixture(options) {
  const root = mkdtempSync(join(tmpdir(), 'nuxt-photo-provenance-'))
  const releaseDir = join(root, '.release')
  mkdirSync(releaseDir)
  const sourceSha = 'a'.repeat(40)
  const version = '0.2.0'
  const channel = 'latest'
  const packageNames = ['@lupinum/vue-photo', '@lupinum/nuxt-photo']
  const packageBytes = packageNames.map((name) => Buffer.from(`${name}@${version}`))
  const packages = packageNames.map((name, index) => {
    const tarball = `package-${index + 1}.tgz`
    writeFileSync(join(releaseDir, tarball), packageBytes[index])
    return {
      name,
      version,
      tarball,
      sha1: digest(packageBytes[index], 'sha1'),
      sha256: digest(packageBytes[index], 'sha256'),
    }
  })
  const releaseRecordBytes = Buffer.from(
    `${JSON.stringify({
      schemaVersion: 2,
      sourceSha,
      version,
      channel,
      publishOrder: packageNames,
      packages,
    })}\n`,
  )
  const modes = options.modes ?? {
    '@lupinum/vue-photo': 'oidc',
    '@lupinum/nuxt-photo': 'absent',
  }
  const bundles = []
  const documents = []
  const registry = new Map()

  for (const [index, pkg] of packages.entries()) {
    const mode = modes[pkg.name]
    if (mode === 'absent') {
      registry.set(pkg.name, null)
      continue
    }
    const versions = [pkg.version]
    if (options.extraVersion === pkg.name) versions.push('0.2.1')
    const attestation =
      mode === 'oidc'
        ? provenanceFixture({
            bytes: packageBytes[index],
            missingCertificateOid: options.missingCertificateOid,
            pkg,
            sourceSha,
            wrongCertificateOid: options.wrongCertificateOid,
            wrongSha512: options.wrongSha512 === pkg.name,
            wrongSource: options.wrongSource === pkg.name,
            wrongWorkflow: options.wrongWorkflow === pkg.name,
          })
        : null
    if (attestation) {
      bundles.push(attestation.bundle)
      documents.push(attestation.document)
    }
    registry.set(pkg.name, {
      versions,
      tags: { [channel]: pkg.version },
      releases: {
        [pkg.version]: {
          sha1: pkg.sha1,
          attestations: attestation
            ? { url: `https://registry.npmjs.org/-/npm/v1/attestations/${index}` }
            : null,
          document: attestation?.document,
        },
      },
    })
  }

  const verifyCalls = []
  return {
    bundles,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
    documents,
    packageBytes,
    releaseRecordBytes,
    verifyCalls,
    verify: () =>
      createRegistryVerification({
        releaseDir,
        releaseRecord: JSON.parse(releaseRecordBytes.toString('utf8')),
        releaseRecordBytes,
        view: (spec, field) => fixtureView(registry, spec, field),
        fetchAttestations: async (url) => {
          const index = Number(url.split('/').at(-1))
          return registry.get(packages[index].name).releases[version].document
        },
        verifyBundle: async (bundle, verificationOptions) => {
          verifyCalls.push(verificationOptions)
          if (options.invalidSignature) throw new Error('signature is invalid')
          for (const [oid, expected] of Object.entries(verificationOptions.certificateOIDs ?? {})) {
            if (bundle.fixtureCertificateOIDs?.[oid] !== expected) {
              throw new Error(`certificate OID differs: ${oid}`)
            }
          }
        },
      }),
  }
}

function fixtureView(registry, spec, field) {
  const match = /^(@[^/]+\/[^@]+)@(.+)$/.exec(spec)
  const name = match?.[1] ?? spec
  const version = match?.[2]
  const pkg = registry.get(name)
  const release = version ? pkg?.releases?.[version] : null
  if (field === 'dist.shasum') return release?.sha1 ?? null
  if (field === 'dist.attestations') return release?.attestations ?? null
  if (field === 'versions') return pkg?.versions ?? null
  if (field.startsWith('dist-tags.')) return pkg?.tags?.[field.slice('dist-tags.'.length)] ?? null
  throw new Error(`Unsupported npm view fixture: ${spec} ${field}`)
}

function provenanceFixture({
  bytes,
  missingCertificateOid,
  pkg,
  sourceSha,
  wrongCertificateOid,
  wrongSha512,
  wrongSource,
  wrongWorkflow,
}) {
  const statement = {
    _type: STATEMENT_TYPE,
    predicateType: PREDICATE_TYPE,
    subject: [
      {
        name: `pkg:npm/${pkg.name.replaceAll('@', '%40')}@${pkg.version}`,
        digest: { sha512: wrongSha512 ? '0'.repeat(128) : digest(bytes, 'sha512') },
      },
    ],
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            repository: WORKFLOW.repository,
            path: wrongWorkflow ? '.github/workflows/other.yml' : WORKFLOW.path,
            ref: WORKFLOW.ref,
          },
        },
        resolvedDependencies: [
          {
            uri: WORKFLOW.sourceDependency,
            digest: { gitCommit: wrongSource ? 'b'.repeat(40) : sourceSha },
          },
        ],
      },
    },
  }
  const fixtureCertificateOIDs = {
    [CERTIFICATE_OIDS.sourceSha]: sourceSha,
    [CERTIFICATE_OIDS.repository]: WORKFLOW.repositorySlug,
    [CERTIFICATE_OIDS.ref]: WORKFLOW.ref,
  }
  if (missingCertificateOid) delete fixtureCertificateOIDs[missingCertificateOid]
  if (wrongCertificateOid) fixtureCertificateOIDs[wrongCertificateOid] = 'mismatched-value'
  const bundle = {
    dsseEnvelope: {
      payload: Buffer.from(JSON.stringify(statement)).toString('base64'),
      payloadType: 'application/vnd.in-toto+json',
    },
    fixtureCertificateOIDs,
  }
  return {
    bundle,
    document: {
      attestations: [
        {
          predicateType: PREDICATE_TYPE,
          signedAccessSignatureUrl: '',
          bundle,
        },
      ],
    },
  }
}

function digest(value, algorithm) {
  return createHash(algorithm).update(value).digest('hex')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
