# Security policy

## Supported versions

Nuxt Photo is pre-1.0. The current minor release receives security fixes. Older
minor lines receive fixes only when a maintainer explicitly announces an
extended support window.

| Version line  | Support                             |
| ------------- | ----------------------------------- |
| Current minor | Supported                           |
| Older minors  | Not supported unless announced      |
| Prereleases   | Best effort; not production support |

Users should reproduce an issue on the newest published package set before
reporting a vulnerability that may already be fixed.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:

`https://github.com/lupinum-dev/nuxt-photo/security/advisories/new`

Do not open a public issue for an undisclosed vulnerability. If private
reporting is temporarily unavailable, open a public issue without exploit
details and request a private disclosure channel.

Include:

- affected `@lupinum/vue-photo` and `@lupinum/nuxt-photo` versions;
- Node, Nuxt, Vue, and browser versions involved;
- reproduction or proof of concept;
- realistic impact;
- known mitigations;
- whether secrets, user data, or package consumers may have been exposed.

Maintainers aim to acknowledge a complete report within three business days and
provide a remediation plan or status update within seven business days.

Please do not disclose exploit details until a fix or coordinated mitigation is
available.

## Publication security

- Local publication is unsupported.
- The release workflow consumes retained exact-SHA tarballs and does not rebuild
  during publication.
- npm trusted publishing is restricted to `release.yml` and the protected
  `npm` environment.
- One protected GitHub deployment approval is required before publication.
- npm provenance must be visible for both packages.
- The isolated job publishes the certified Vue tarball before the dependent
  Nuxt tarball.
- Prereleases use `next`. Stable releases use `latest`.
- GitHub release finalization has no npm OIDC authority.

Maintainer npm accounts should require strong 2FA or passkeys and disallow
long-lived token publication.

## Supply-chain controls

- GitHub Actions are pinned to immutable commit SHAs.
- Dependency installs use the committed lockfile and the declared pnpm release.
- Newly published dependencies are delayed by the repository release-age
  policy.
- Renovate consumes GitHub vulnerability alerts immediately; security fixes do
  not wait for the ordinary weekly update window.
- Dependency lifecycle scripts are denied unless reviewed in `allowBuilds`.
- Packed manifests reject workspace, local-path, Git, and URL dependency
  sources.
- Clean consumers install the packed artifacts rather than relying only on
  workspace behavior.
- Release jobs do not restore dependency or build caches.
- Secret scanning, push protection, private vulnerability reporting, and
  CodeQL should remain enabled.

These controls prove origin and reduce common compromise paths; they cannot make
malicious reviewed source safe. Focused review and protected maintainer accounts
remain required.

## Emergency release response

For a vulnerable release:

1. Restore `latest` or `next` for both packages to the last known-good package
   set.
2. Deprecate the affected versions with a concise warning.
3. Mark the GitHub Release as affected.
4. Prepare and publish a fixed package set through the protected workflow.

If a release exposes a secret, introduces malware, or creates an urgent legal
risk, contact npm support and follow the exceptional unpublish process described
in `MAINTAINING.md`.
