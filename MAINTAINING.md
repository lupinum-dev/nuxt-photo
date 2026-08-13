# Maintaining Nuxt Photo

This file is the operational source of truth for maintainers. `AGENTS.md`
defines architecture and agent rules. `CONTRIBUTING.md` defines contributor
scope. `docs/WRITING.md` defines public writing rules.

## Just help me ship

For a normal change:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

Add a Changeset when a change affects either public package. Open a pull
request. Merge only after the required checks pass.

Do not publish, tag, or promote from a workstation. The protected workflow is
the only release path.

## Quick fixes

Keep the change narrow. Add a regression test when behavior changed. Run
`pnpm verify`. Add a patch Changeset when users receive different package
bytes or behavior.

## Large changes

Open an issue first. State the user problem, compatibility effect, and test
plan. Split unrelated work. Update public documentation and package examples in
the same pull request.

## Documentation changes

Follow [docs/WRITING.md](./docs/WRITING.md). Keep commands executable and use
sentence-case headings. Run:

```sh
pnpm docs:build
pnpm verify
```

Vercel deploys the public app from `docs/`. The Vercel project settings must
use:

- Root Directory: `docs`
- Include source files outside the Root Directory: enabled
- Output Directory: no override
- Environment variable: `ENABLE_EXPERIMENTAL_COREPACK=1` for Production,
  Preview, and Development

The committed `docs/vercel.json` installs the frozen root workspace and builds
both packages before it builds the documentation app. The environment variable
is not secret. It lets Corepack activate the pinned pnpm version.

## Dependency automation

Renovate owns routine updates. Dependabot alerts remain enabled for security
visibility. Review lockfile changes and install scripts. Do not bypass the
24-hour release-age quarantine for a fresh external package.

Run:

```sh
pnpm install --frozen-lockfile
pnpm audit:all
pnpm verify
```

An emergency security update may use the documented pnpm security exception.
Record the package, reason, and removal date. Remove the exception after the
fixed release passes the normal age gate.

## Verification commands

- `pnpm verify` is the normal handoff gate.
- `pnpm docs:build` builds both packages and the public documentation app.
- `pnpm audit:all` audits the complete workspace.
- `pnpm release:verify` runs the complete release certification and verifies
  the exact package-set artifact.
- `vp run release:notes` shows the pending package set and release notes.

Run focused tests while editing. Run the relevant direct aliases before
handoff. Do not edit `dist/`, `.release/`, `.nuxt/`, or `.output/` by hand.

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
request consumes Changesets, updates both manifests, updates the exact Nuxt-to-
Vue dependency, and writes the changelog. Review and merge that pull request.

Use `next` for prereleases and `latest` for stable releases. Never move a
stable user channel to a prerelease.

## Publication

Publication is intentionally short:

1. Merge the reviewed version pull request.
2. Wait for the successful `ci.yml` push run on current `main`.
3. Dispatch the protected workflow with the exact fixed version:

   ```sh
   gh workflow run release.yml --repo lupinum-dev/nuxt-photo --ref main \
     -f version=<version>
   ```

4. Review the workflow summary and approve the `npm` environment deployment.
5. Wait for the workflow to finish.

The workflow selects the retained `release-candidate` from the successful
current-main CI run. It verifies the source SHA, package set, version, changelog,
and tarball digests. It publishes Vue before Nuxt with npm trusted publishing,
`--ignore-scripts`, and provenance. It then verifies the registry bytes,
provenance, and `next` or `latest` tags. Finally, it creates one GitHub release
from the certified notes and attaches both tarballs and the release evidence.

Never run `npm publish`, `pnpm publish`, `changelogen --release`, or a manual
Git tag command. Never rebuild a retained artifact during publication.

## Partial failure

npm versions are immutable after publication. If the first package succeeds
and the second package fails, rerun the same workflow for the same version. The
publish job skips an existing version only when its registry SHA-1 matches the
certified tarball. It then continues with the missing package.

Stop when an existing version has different bytes, the source SHA changed, or
registry state is ambiguous. Do not create replacement tarballs or a second
release workflow.

If npm publication completed but GitHub release creation failed, rerun the
failed GitHub job or create the release from the retained verified artifact in
the same workflow run. Do not create a new package version for a GitHub-only
failure.

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
- both packages expose npm provenance;
- both packages use the correct `next` or `latest` channel;
- the Git tag targets the certified main SHA;
- the GitHub release contains the exact notes and retained evidence;
- the public documentation deployment passes its main user journeys.
