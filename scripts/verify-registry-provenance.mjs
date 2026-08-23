import { createRequire } from 'node:module'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import { npmView } from './lib/npm-registry.mjs'
import { createRegistryVerification, createSigstoreOptions } from './lib/registry-provenance.mjs'

const args = process.argv.slice(2)
const releaseDir =
  args[0] && !args[0].startsWith('--') ? resolve(args.shift()) : resolve('.release')

function readArgument(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

const summaryPath = readArgument('--summary')
if (!process.env.SIGSTORE_PREFIX) {
  throw new Error('SIGSTORE_PREFIX must point to the isolated Sigstore installation.')
}
const requireSigstore = createRequire(join(resolve(process.env.SIGSTORE_PREFIX), 'package.json'))
const { createVerifier } = requireSigstore('sigstore')
const sigstoreVersion = requireSigstore('sigstore/package.json').version
if (sigstoreVersion !== '5.0.0') {
  throw new Error(`Expected sigstore 5.0.0, received ${sigstoreVersion}.`)
}

const releaseRecordBytes = readFileSync(join(releaseDir, 'release-record.json'))
const releaseRecord = JSON.parse(releaseRecordBytes.toString('utf8'))
const sigstoreOptions = createSigstoreOptions(releaseRecord.sourceSha)
const verifier = await createVerifier(sigstoreOptions)
const verification = await createRegistryVerification({
  releaseDir,
  releaseRecord,
  releaseRecordBytes,
  view: npmView,
  verifyBundle: (bundle, options) => {
    if (!isDeepStrictEqual(options, sigstoreOptions)) {
      throw new Error('Sigstore verification policy differs from the certified policy.')
    }
    return verifier.verify(bundle)
  },
  fetchAttestations: async (urlString) => {
    const url = new URL(urlString)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'registry.npmjs.org' ||
      !url.pathname.startsWith('/-/npm/v1/attestations/')
    ) {
      throw new Error(`Untrusted npm attestation URL for ${url.hostname}.`)
    }
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`npm attestation lookup failed with HTTP ${response.status}.`)
    }
    return response.json()
  },
})

writeFileSync(
  join(releaseDir, 'registry-verification.json'),
  `${JSON.stringify(verification, null, 2)}\n`,
)

if (summaryPath) {
  appendFileSync(
    summaryPath,
    `${[
      '',
      '## npm registry verification',
      '',
      ...verification.packages.map((pkg) => `- \`${pkg.name}@${pkg.version}\`: \`${pkg.mode}\``),
      '',
      'Existing OIDC packages were cryptographically verified with sigstore 5.0.0.',
      '',
    ].join('\n')}\n`,
  )
}

process.stdout.write(
  `npm registry verification recorded for ${verification.version}: ${verification.packages
    .map((pkg) => `${pkg.name}=${pkg.mode}`)
    .join(', ')}\n`,
)
