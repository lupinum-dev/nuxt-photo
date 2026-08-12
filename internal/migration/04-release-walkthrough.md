# First staged release walkthrough

This is a rehearsal and evidence worksheet. Active release rules live in
`MAINTAINING.md`.

## Candidate

Fill from authoritative evidence:

```text
Release:
Channel: latest | next
Source SHA:
CI run ID:
Staging tag: lupinum-stage-<ci-run-id>

@lupinum/vue-photo:
  version:
  tarball:
  SHA-256:

@lupinum/nuxt-photo:
  version:
  tarball:
  SHA-256:

Previous Vue final tag:
Previous Nuxt final tag:
Previous Vue target for this staging tag:
Previous Nuxt target for this staging tag:
```

## Before dispatch

- [ ] Version pull request was reviewed and merged, or this is the explicitly
      recorded prepared `0.2.0` transition from public `0.1.2`.
- [ ] The prepared `0.2.0` transition has not been given an empty Changeset or
      another version bump.
- [ ] Candidate SHA is current main.
- [ ] `Main healthy` passed.
- [ ] Both package tarballs exist in one `release-candidate` artifact.
- [ ] Package versions match.
- [ ] Nuxt packed dependency targets the candidate Vue version.
- [ ] `vp run release:notes` reports no local blocker.
- [ ] No active release run owns the same package versions.
- [ ] The protected `npm` environment requires human review for both
      stage-submission and final registry-verification deployments.
- [ ] npm trusted publisher is restricted to the release workflow and stage-only
      operation.
- [ ] Maintainer has npm 2FA access.

## Dispatch authorization

Record the maintainer's exact authorization:

```text
Authorize release workflow dispatch for:
- @lupinum/vue-photo@...
- @lupinum/nuxt-photo@...
- channel ...
- source SHA ...
- CI run ID ...
- digests ...
```

Dispatch:

```text
GitHub Actions → release → Run workflow
ci_run_id: <numeric current-main ci run>
```

Dispatch prepares a plan; it does not approve publication.

## Plan review

Copy the workflow summary:

```text
Vue stage ID:
Nuxt stage ID:
Vue previous final target:
Nuxt previous final target:
Vue previous temporary target:
Nuxt previous temporary target:
Exact rollback commands:
```

Confirm:

- [ ] downloaded artifact SHA and digests match;
- [ ] no rebuild is planned;
- [ ] stage submissions may run independently, while npm approval and final
      promotion order is Vue then Nuxt;
- [ ] temporary tag is the derived
      `lupinum-stage-<numeric-ci-run-id>`;
- [ ] final tag is correct for the SemVer channel;
- [ ] rollback targets are recorded.

## Protected staging approval

The maintainer personally reviews the GitHub deployment and approves it only
after the plan matches this worksheet.

Record:

```text
Approval time:
Approver:
Workflow run URL:
```

## npm stage approval

Use the exact stage IDs and commands from the workflow summary.

### Vue

- [ ] Approve the Vue npm stage.
- [ ] Complete npm 2FA personally.
- [ ] Verify the exact version is readable.
- [ ] Verify provenance.
- [ ] Verify the recorded candidate-specific staging tag points to it.

### Nuxt

Proceed only after Vue verification.

- [ ] Approve the Nuxt npm stage.
- [ ] Complete npm 2FA personally.
- [ ] Verify the exact version is readable.
- [ ] Verify provenance.
- [ ] Verify packed dependency on the Vue candidate.
- [ ] Verify the recorded candidate-specific staging tag points to it.

## Temporary registry verification

- [ ] Confirm registry SHA-1 values match the retained tarballs.
- [ ] Confirm both packages have provenance.
- [ ] Confirm the packed Nuxt dependency points to the released Vue version.
- [ ] Confirm both temporary tags point to the candidate versions.

Do not duplicate the retained-tarball consumer matrix here. Matching SHA-1
values prove npm serves the already-certified bytes.

## Final promotion

Promote Vue first:

```sh
npm dist-tag add @lupinum/vue-photo@<version> <latest|next>
```

Verify it, then promote Nuxt:

```sh
npm dist-tag add @lupinum/nuxt-photo@<version> <latest|next>
```

After both final tags agree, run each exact `rollbackStagingCommand` from the
workflow record. It normally removes the unique
`lupinum-stage-<ci-run-id>` tag; if that tag previously had a target, the
record restores it.

Record each 2FA-protected action and result:

```text
Vue promotion:
Nuxt promotion:
Temporary tag cleanup:
```

## Finalization

- [ ] Approve the pending GitHub finalization deployment.
- [ ] Workflow verifies both packages and provenance again.
- [ ] `v<version>` tag exists at the candidate SHA.
- [ ] One GitHub Release exists.
- [ ] Prerelease/latest state matches npm.
- [ ] Both tarballs, package-set manifest, and release record are attached.

## Terminal report

```text
RELEASE STATUS: COMPLETE | PARTIAL FAILURE | BLOCKED

Package set:
Channel:
Source SHA:
CI run:

Vue registry/provenance/tag:
Nuxt registry/provenance/tag:
Git tag:
GitHub Release:

Publication occurred: No | Partial | Yes
Rollback required: No | Yes, exact action
```

## Partial-promotion emergency

If Vue's final channel moved but Nuxt's did not, restore Vue immediately:

```sh
npm dist-tag add @lupinum/vue-photo@<previous-version> <latest|next>
```

If there was no previous target:

```sh
npm dist-tag rm @lupinum/vue-photo <latest|next>
```

Then investigate and retry Nuxt using the existing approved bytes. Do not
rebuild or restage Vue.
