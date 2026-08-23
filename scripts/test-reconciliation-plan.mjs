import assert from 'node:assert/strict'

import { classifyReconciliation } from './plan-reconciliation.mjs'

const complete = {
  modes: ['oidc', 'oidc'],
  tagState: 'verified',
  releaseState: 'present',
  assetState: 'verified',
}

assert.equal(classifyReconciliation(complete), 'complete')
assert.equal(
  classifyReconciliation({ ...complete, releaseState: 'absent', assetState: 'absent' }),
  'repair',
)
assert.equal(classifyReconciliation({ ...complete, assetState: 'conflict' }), 'repair')
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
