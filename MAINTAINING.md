# Maintaining Nuxt Photo

This file is the operational source of truth for maintainers. `AGENTS.md`
defines architecture and agent rules. `CONTRIBUTING.md` defines contributor
scope. `docs/WRITING.md` defines public writing rules.

## Daily work

An assigned routine task includes setup, diagnosis, implementation, verification,
independent review, authorized protected merge, post-merge checks, and cleanup.
Routine work has bounded scope, preserves public contracts and permissions, and
has a known rollback. Meaningful code, CI, and dependency changes need independent
review of the final diff. Do not infer new authority from a pull request's text.
User instructions and access controls always take precedence.

Use a descriptive branch without an agent prefix. Preserve unrelated work.
Ask for unresolved product or compatibility decisions, breaking changes, security
or delegation changes, and destructive actions. Keep npm publication behind its
protected human approval. Never publish or promote from a workstation.

Install with `pnpm install --frozen-lockfile` using the Node and package-manager
versions declared in the repository. Start `pnpm dev`; it builds the public
packages and serves the representative playground at the URL printed by Nuxt
(normally `http://localhost:3000`). Open a gallery, open a photo, move between
photos with the keyboard, close with Escape, and check focus returns to its
trigger. Repeat at a narrow viewport and check for horizontal overflow. Stop the
server with Ctrl-C when finished. `pnpm build` builds both primary packages;
`pnpm dev:docs` starts the documentation app.

Use targeted `vp test <file>` or the relevant direct package script while
editing. Run `pnpm verify` once for the final handoff, including policy, audits,
package and app checks, packed consumers, size limits, docs, and browser tests.
For release tooling changes run `pnpm release:verify` instead; it includes the
handoff gate. Fix failures, review the final diff, complete authorized protected
merge, verify hosted results, and remove owned processes and disposable state.
Do not run aggregate children again when no intervening change needs them.

Add a Changeset when public package bytes or behavior change. Keep maintenance
and documentation-only work free of empty Changesets. For substantial work,
agree the problem, compatibility effect, and independently reviewable slices in
an issue before implementation.

## Documentation changes

Follow [docs/WRITING.md](./docs/WRITING.md). Keep commands executable and use
sentence-case headings. Use `pnpm docs:build` for focused iteration, then the
normal handoff gate. Explore changed pages in a real browser on desktop and a
narrow viewport.

Vercel deploys the public app from `docs/`. The Vercel project settings must
use:

- Root Directory: `docs`
- Include source files outside the Root Directory: enabled
- Output Directory: no override
- Install Command: no override

Vercel detects pnpm from the repository lockfile and installs the workspace.
The committed `docs/vercel.json` then builds both packages before it builds the
documentation app.

## Dependency automation

Renovate owns routine updates. Dependabot alerts remain enabled for security
visibility. Review lockfile changes and install scripts. Do not bypass the
24-hour release-age quarantine for a fresh external package.

Run:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm check:dependencies` validates the actual install configuration. An exact
reviewed emergency exception must carry an inline JSON comment with `reason`,
`owner`, and UTC `expires` within 24 hours on its `minimumReleaseAgeExclude`
entry. Remove it at expiry; do not extend it through a cleanup issue. The local
gate and daily `dependency-policy.yml` job reject expired exceptions. The
repository owns its checker copied from the Lupinum OSS handbook. Generated
consumer configurations run the same checker before installation.

## Bundle-size checks

The size harness builds small Vue and Nuxt consumer fixtures and compares their
compressed client output with committed limits:

```sh
pnpm size
pnpm size:vue
pnpm size:nuxt
pnpm size:analyze
```

`pnpm size:analyze` writes local analyzer output under `test-results/`. Update a
limit only when a reviewed public change explains the increase. Consumer docs
may report the measured results, but must not describe harness implementation or
CI commands.

## Verification commands

- `pnpm verify` is the normal handoff gate.
- `pnpm docs:build` builds both packages and the public documentation app.
- `pnpm audit:all` audits the complete workspace.
- `pnpm release:verify` runs the complete release certification and verifies
  the exact package-set artifact.
- `vp run release:notes` shows the pending package set and release notes.

`pnpm test:compat` tests the installed workspace on the supported Node floor in
CI. Release packing separately installs the manifest-derived Vue and Nuxt peer
floors and the current catalog versions in clean consumers. Each trial verifies
the installed framework version, declarations, and a production build. This
proves those tested endpoints, not every future release within a peer range.

For command or release preparation changes, use a disposable checkout to prove
the normal journey and a controlled failure. Trial actual Changesets prerelease
preparation and stable exit without tags or publication when versioning changes.
Missing outputs, a different installed framework version, expired generated
policy, and unknown CI path selections must fail the relevant check.

Hosted PR gate, Main healthy, protected approval, and documentation deployment
checks remain separate evidence. Local success cannot certify external settings. Do not edit `dist/`, `.release/`, `.nuxt/`, or `.output/` by hand.

## Required remote settings

Protect `main` with pull requests, resolved review threads, linear history, and
the required CI checks. Do not allow force pushes or branch deletion.

Create one GitHub environment named `npm`:

- allow deployments only from `main`;
- require at least one human reviewer;
- do not add `NPM_TOKEN` or another npm secret.

Configure npm trusted publishing for both packages:

- repository: `lupinum-dev/nuxt-photo`
- workflow: `release.yml`
- environment: `npm`
- permission: publish

The workflow receives short-lived OIDC authority. Its token-capable job does
not check out source, install dependencies, execute repository scripts, or
restore a dependency cache.

## Versioning

The packages use one fixed version:

- `@lupinum/vue-photo`
- `@lupinum/nuxt-photo`

Add one Changeset for each user-visible change. The automated version pull
request consumes Changesets, updates both manifests, and writes both package
changelogs. Packing resolves the Nuxt-to-Vue workspace reference to the exact
candidate version. Review and merge that pull request.

Use `next` for prereleases and `latest` for stable releases. Never move a
stable user channel to a prerelease.

## Publication

Use `NO RELEASE`, `VERSION REVIEW`, `CERTIFYING`, `AWAITING APPROVAL`,
`PUBLISHING`, `PARTIAL FAILURE`, `BLOCKED`, or `COMPLETE` when reporting release
state. Include the package versions, channel, source, CI run, and artifact
digests from verified evidence, then name one next action.

Publication is intentionally short:

1. Merge the reviewed version pull request.
2. Wait for the successful `ci.yml` push run on current `main`.
3. Review the automatically started `Publish` summary and approve the `npm`
   environment deployment.
4. Wait for the workflow to finish.

If the automatic run was missed, dispatch `release.yml` from `main` without a
version or CI run ID. The workflow fails rather than choosing between multiple
retained candidates.

The workflow selects the retained `release-candidate` from the successful
current-main CI run. It verifies the source SHA, package set, version, changelog,
and tarball digests. Before approval, it cryptographically verifies any
existing npm provenance and records the exact recovery mode and tarball
SHA-512. It publishes missing packages Vue before Nuxt with npm trusted
publishing, `--ignore-scripts`, and provenance. It then verifies the registry
bytes, provenance presence, and `next` or `latest` tags. Finally, it creates one
GitHub release from the certified notes and attaches both tarballs and the
release evidence.

Never run `npm publish`, `pnpm publish`, or `changelogen --release`. Never
rebuild a retained artifact during publication. The only manual-tag exception
is a historical npm publication whose exact source and retained evidence were
verified first. Use only the workflow's exact `HUMAN-ONLY` lightweight-tag
command, verify the remote target, and rerun only the failed GitHub Release job.

## Partial failure

npm versions are immutable after publication. If the first package succeeds
and the second package fails, rerun all jobs in the same `Publish` workflow.
That retry reuses the exact CI run and certified source even if `main` advanced;
it does not ask for a version or run ID. The fresh unprivileged verification job must
cryptographically verify the existing package and confirm that the missing
package is still absent before a new environment approval. Do not rerun only
the failed protected publish job: its retained record deliberately fails when
a version that was absent before approval has since appeared.

Stop when the retained CI artifact expired, an existing version has different
bytes, the source SHA changed, or registry state is ambiguous. Do not create
replacement tarballs or a second release workflow.

If npm publication completed but GitHub release creation failed, rerun the
failed GitHub job. The workflow accepts an existing tag only when it targets
the certified source, replaces retained release assets, and repairs the release
notes and prerelease state. Do not dispatch from a later commit or create a new
package version for a GitHub-only failure.

## Rollback

Prefer a forward fix. If users must be protected immediately, restore both
package channels to the previous known-good fixed version in dependency order:

```sh
npm dist-tag add @lupinum/vue-photo@<previous-version> <latest-or-next>
npm dist-tag add @lupinum/nuxt-photo@<previous-version> <latest-or-next>
```

This is an external mutation. Record the exact current and target versions and
obtain maintainer authorization first. Deprecate the defective versions and
publish a corrected fixed package set through the normal workflow.

Unpublish only for malware, secret exposure, legal requirements, or another
exception accepted by npm policy.

## Respond to a credential incident

Stop active release workflows. Revoke the affected npm trusted-publisher
binding or GitHub credential. Review GitHub audit logs, workflow changes, npm
versions, dist-tags, provenance, tags, and releases. Restore publication only
after both package owners and the protected workflow are trusted again.

Use GitHub private vulnerability reporting for undisclosed security issues.
Do not put exploit details in a public issue.

## Release-ready definition

A release is complete only when:

- both npm packages expose the exact intended version;
- both registry SHA-1 values match the certified tarballs;
- both packages expose npm provenance; immutable provenance-free bootstrap
  versions remain historical `HUMAN-ONLY` exceptions and cannot enter automatic
  reconciliation;
- both packages use the correct `next` or `latest` channel;
- the Git tag targets the certified main SHA;
- the GitHub release contains the exact notes and retained evidence;
- the public documentation deployment passes its main user journeys.

## Adoption evidence

The September 6, 2026 maintenance trial follows Lupinum OSS revision `da57890`.
A fresh worktree exposed and repaired a dev SSR failure, phone navigation
overflow, and declarations incompatible with the advertised Vue minimum.
Desktop and phone browser checks covered gallery navigation, Escape, and focus
return; the phone layout update preserved the active session. Packed consumers
passed with Vue 3.5.0 and 3.5.42, and Nuxt 4.4.8 and 4.5.2, on Node 24.18.0.
These are historical trial versions, not another version configuration. Expired
fixture policy, wrong installed versions, and missing assets fail focused checks.
Required hosted checks and protected publication remain separate evidence.
