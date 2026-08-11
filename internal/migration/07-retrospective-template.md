# Migration and first-release retrospective

Complete this after:

1. the first migrated package set is published;
2. the first ordinary feature pull request uses the new workflow;
3. the first Renovate pull request exercises the dependency policy.

## Release identity

```text
Version:
Channel:
Source SHA:
CI run:
Release workflow:
Vue digest:
Nuxt digest:
GitHub Release:
```

## Timeline

Record wall time and runner time separately.

| Event                     | Time | Human wait | Runner time | Notes |
| ------------------------- | ---- | ---------- | ----------- | ----- |
| Version PR opened         |      |            |             |       |
| Version PR merged         |      |            |             |       |
| Main healthy              |      |            |             |       |
| Release dispatched        |      |            |             |       |
| Plan reviewed             |      |            |             |       |
| Vue stage approved        |      |            |             |       |
| Nuxt stage approved       |      |            |             |       |
| Temporary set verified    |      |            |             |       |
| Vue promoted              |      |            |             |       |
| Nuxt promoted             |      |            |             |       |
| GitHub finalized          |      |            |             |       |
| Published consumer passed |      |            |             |       |

## Developer experience

- Was `vp check` the obvious fast command?
- Was its output actionable?
- Did the framework-type exception make sense?
- Did a normal change require too many commands?
- Did `vp run verify` run duplicate work?
- Which check was expensive without increasing confidence?
- Did generated state affect a clean checkout?

## Agent experience

- Did the agent identify exactly one next action?
- Did it distinguish local evidence from remote authority?
- Did it stop for exact workflow dispatch approval?
- Did it stop for protected GitHub approvals?
- Did it make clear that npm 2FA must be performed personally?
- Did it stay through terminal verification?
- Did it report whether publication occurred?
- Was any instruction duplicated or contradictory?

## Changesets experience

- Was it obvious when a Changeset was required?
- Did the fixed package group produce the intended versions?
- Was the generated changelog understandable?
- Did the version workflow require unexpected repository settings?
- Did the one-time transition from the prepared baseline create confusion?

## Package evidence

- Were the two packs byte-identical?
- Did the package-set manifest contain enough recovery information?
- Did clean Vue and Nuxt consumers catch anything workspace tests missed?
- Did package order and dependency rewriting work?
- Could the candidate be reproduced and diagnosed locally?

## CI experience

- Was `PR gate` stable and understandable?
- Was `Main healthy` tied to the exact eligible SHA?
- Were compatibility lanes meaningfully distinct?
- Did browser installation or caching behave reliably?
- Was artifact retention sufficient?
- Did docs network behavior affect determinism?

## Publication experience

- Was the prepared plan complete?
- Was stage-only trusted publishing clear?
- Were stage IDs and npm approval commands obvious?
- Could stage submissions recover independently while Vue-before-Nuxt npm
  approval and final promotion remained enforced?
- Was temporary-set verification sufficient?
- Were final promotion and temporary-tag cleanup easy to follow?
- Was GitHub finalization clearly separated from npm authority?

## Failure and recovery

```text
Failure:
First visible symptom:
Authoritative state:
Publication occurred:
Recovery action:
Did recovery reuse the same artifacts:
Could documentation have prevented it:
```

If no real failure occurred, rehearse these tabletop cases:

- Vue stage approved, Nuxt stage rejected;
- both staged, Vue final tag moved, Nuxt promotion fails;
- npm complete, GitHub finalization fails;
- main advances while release waits for approval;
- the candidate-specific temporary tag unexpectedly had a previous target or
  was overwritten.

## Security review

- Were any long-lived npm tokens present?
- Did any OIDC-bearing job install or build?
- Were repository actions pinned?
- Did the release-age policy create useful friction or pointless bypasses?
- Were install scripts limited to reviewed packages?
- Did provenance appear for both packages?
- Did any agent or automation attempt to cross a human approval boundary?

## What to keep

- ...

## What to simplify or delete

- ...

## What to change in Nuxt Photo only

- ...

## What to feed back into the starter

Include only behavior now proven across a real release:

- ...

## What not to share yet

- ...

## Decisions

| Decision | Owner | Deadline | Active file or issue |
| -------- | ----- | -------- | -------------------- |
|          |       |          |                      |

## Final assessment

```text
Confidence before migration:
Confidence after release:
Fast local gate:
Merge gate:
Main gate:
Release time:
Biggest remaining risk:
Next repository recommendation:
```
