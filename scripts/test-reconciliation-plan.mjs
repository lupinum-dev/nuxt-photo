import assert from 'node:assert/strict'

import { classifyReconciliation, releaseMetadataState } from './plan-reconciliation.mjs'

const complete = {
  modes: ['oidc', 'oidc'],
  tagState: 'verified',
  releaseState: 'present',
  assetState: 'verified',
  metadataState: 'verified',
}

assert.equal(classifyReconciliation(complete), 'complete')
assert.equal(
  classifyReconciliation({ ...complete, releaseState: 'absent', assetState: 'absent' }),
  'repair',
)
assert.equal(classifyReconciliation({ ...complete, assetState: 'conflict' }), 'repair')
assert.equal(classifyReconciliation({ ...complete, metadataState: 'conflict' }), 'repair')
const record = { tag: 'v1.2.3', channel: 'latest' }
const release = { name: 'v1.2.3', body: 'Certified notes\n', isPrerelease: false }
assert.equal(releaseMetadataState(release, record, 'Certified notes'), 'verified')
assert.equal(
  releaseMetadataState({ ...release, name: 'stale title' }, record, 'Certified notes'),
  'conflict',
)
assert.equal(
  releaseMetadataState({ ...release, body: 'stale notes' }, record, 'Certified notes'),
  'conflict',
)
assert.equal(
  classifyReconciliation({
    ...complete,
    modes: ['oidc', 'absent'],
    tagState: 'absent',
    releaseState: 'absent',
    assetState: 'absent',
  }),
  'publish',
)
assert.throws(
  () => classifyReconciliation({ ...complete, tagState: 'conflict' }),
  /different commit/u,
)
assert.throws(
  () => classifyReconciliation({ ...complete, tagState: 'absent' }),
  /without its certified tag/u,
)
assert.throws(
  () => classifyReconciliation({ ...complete, modes: ['mystery', 'oidc'] }),
  /Unverified npm state/u,
)
assert.throws(
  () => classifyReconciliation({ ...complete, modes: ['absent', 'oidc'] }),
  /before the fixed package set is complete/u,
)

process.stdout.write('Reconciliation planning fixtures passed.\n')
