# Maintaining Nuxt Photo

This file defines the active maintenance and release contract. Executable truth
remains in manifests, tests, release scripts, and GitHub workflows.

## Just help me ship

You do not need to memorize this process. Tell a repository-aware agent:

> Help me release Nuxt Photo.

The agent must follow the release-concierge protocol in `AGENTS.md`, explain one
next action at a time, stop at every protected or 2FA boundary, and remain with
the release through verified completion or recovery.

That request starts assessment only. It does not authorize workflow dispatch,
GitHub deployment approval, npm staging approval, npm 2FA, dist-tag changes, or
GitHub Release creation.

Without an agent, begin with:

```sh
vp run release:notes
```

## Operational answers

| Question                            | Answer                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Fastest useful local check          | `vp check`                                                                               |
| Repository behavior tests           | `vp test`                                                                                |
| Complete local handoff gate         | `pnpm verify`                                                                            |
| Build documentation                 | `pnpm docs:build`                                                                        |
| Audit the full workspace            | `pnpm audit:all`                                                                         |
| Required before merge               | `PR gate`                                                                                |
| Proof that main is healthy          | `Main healthy` on the exact SHA                                                          |
| Proof package bytes work            | Reproducible package-set pack plus clean packed consumers                                |
| Authoritative release artifact      | The two tarballs in the successful main `release-candidate` artifact                     |
| Required before staging             | Current-main `Main healthy`, matching artifact digests, and reviewed release plan        |
| Publication authority               | `.github/workflows/release.yml` using trusted publishing in stage-only mode              |
| Human publication authority         | Protected GitHub deployment approvals plus personal npm 2FA stage approval and promotion |
| Public approval and promotion order | `@lupinum/vue-photo` before `@lupinum/nuxt-photo`                                        |
| Temporary channel                   | Unique per candidate: `lupinum-stage-<ci-run-id>`                                        |
| Stable channel                      | `latest`                                                                                 |
| Prerelease channel                  | `next`                                                                                   |
| Versioning owner                    | Changesets version pull request                                                          |
| Dependency updater                  | Renovate only                                                                            |
| Normal rollback                     | Restore both recorded dist-tags, deprecate the bad set, and fix forward                  |

Changesets is the only version and committed changelog owner. Use
`vp run changelog:preview` to inspect Conventional Commits without changing
versions, tags, or changelog files.

Vercel must deploy `docs/` from `main` to `nuxt-photo.lupinum.com` and create
pull-request previews. `docs/vercel.json` owns the exact pnpm installer because
Vercel does not provide pnpm 11 by default.

## Command contracts

### `vp check`

- Purpose: fastest useful formatting and lint feedback.
- Mutates: nothing.
- Runs: Oxfmt, general Oxlint rules, and type-aware Oxlint rules.
- Excludes: authoritative TypeScript compiler diagnostics for Vue SFCs and
  Nuxt-generated aliases, Vue-template ESLint, builds, packed consumers,
  browsers, and network audits.
- Used: continuously during local work and inside broader gates.
- Expected runtime: seconds.
- Requires: no browser, secret, or network.

Nuxt Photo deliberately does not treat Oxlint/TS-Go compiler diagnostics as the
framework type gate. `.vue` modules, `#app`, `#imports`, generated Nuxt
tsconfigs, and workspace distribution aliases require `vue-tsc`, Nuxt
preparation, and Nuxt Module Builder.

### `vp test`

- Purpose: repository unit, component, contract, SSR, and focused Nuxt
  integration behavior.
- Mutates: temporary Nuxt fixture output; generated output is ignored.
- Excludes: Playwright's full browser matrix, package publication, and
  deployment.
- Used: locally, pull requests, and compatibility lanes.
- Expected runtime: seconds to roughly one minute after required package output
  exists.
- Requires: no secret; the Nuxt integration fixture binds a local port.

Run a specific file while iterating:

```sh
vp test packages/vue/test/core/layout.test.ts
vp test packages/nuxt/test/module.test.ts
```

### `vp run lint:vue-template`

- Purpose: Vue template correctness that Oxlint does not yet implement.
- Mutates: nothing.
- Runs: `eslint-plugin-vue` on authored `.vue` files only.
- Excludes: general JavaScript/TypeScript linting and formatting.
- Used: through `verify`, and directly after template-heavy changes.
- Expected runtime: a few seconds.
- Requires: no browser, secret, or network.

This is a profile exception, not a second general lint stack. Remove it only
when the selected Oxlint version proves equivalent template semantics.

### `vp run typecheck`

- Purpose: authoritative framework-aware TypeScript verification.
- Mutates: ignored Nuxt preparation output.
- Runs:
  - `vue-tsc` for the Vue package and public API declarations;
  - Nuxt preparation plus `vue-tsc` for both playgrounds and the docs app;
  - package builds where the Nuxt module declaration contract requires them.
- Excludes: browser behavior and publication.
- Used: locally after public or framework changes and through `verify`.
- Expected runtime: under a few minutes.
- Requires: no secret; no live service.

### `vp run test:browser`

- Purpose: user-visible browser behavior.
- Mutates: ignored playground output and Playwright reports.
- Runs: the main playground build and the asymmetric Playwright matrix.
- Excludes: package publication.
- Used: through `verify` and for focused browser diagnosis.
- Expected runtime: a few minutes.
- Requires: installed Playwright browsers; no secret.

Full behavior belongs in Chromium. Mobile Chromium and Firefox/WebKit should
remain focused smoke lanes unless an engine-specific defect proves broader
coverage is necessary.

### `vp run release:pack`

- Purpose: create and certify the sole two-package release candidate.
- Mutates: ignored `dist` and `.release`.
- Runs:
  - clean package builds in dependency order;
  - two independent packs of both packages;
  - byte-reproducibility comparison;
  - source-versus-packed manifest parity;
  - file allowlist, exports, declarations, source-map, dependency-source, and
    lifecycle-script inspection;
  - workspace dependency rewrite checks;
  - strict Publint;
  - clean Vue and Nuxt packed-consumer verification.
- Excludes: registry mutation and deployment.
- Used: through `verify`, main CI, and focused package diagnosis.
- Expected runtime: a few minutes.
- Requires: no browser or secret; clean consumers may require registry access
  for declared external dependencies.

The output is one coordinated package set. A tarball from another command or
another SHA is not an equivalent candidate.

### `pnpm verify`

- Purpose: complete local and pull-request maintainer gate.
- Mutates: ignored `dist`, `.release`, `.nuxt`, `.output`, and temporary
  consumer/browser output.
- Runs:
  - `vp check`;
  - Vue-template lint;
  - repository metadata and documentation validation;
  - reproducible package-set certification;
  - framework typechecks;
  - Vitest;
  - size budgets;
  - Tailwind playground build;
  - docs production build;
  - Playwright.
- Excludes: live registry publication and application deployment.
- Used: once before handoff and by the authoritative pull-request lane.
- Expected runtime: several minutes.
- Requires: installed browsers; docs and consumer verification may use the
  network.

Do not run this after every edit. Use focused commands, then escalate once.

### `pnpm release:verify`

- Purpose: authoritative exact-SHA main release gate.
- Mutates: ignored and temporary output only.
- Runs: the complete `verify` contract plus the production dependency audit.
- Excludes: registry mutation.
- Used: clean main CI, not as a repetitive edit loop.
- Expected runtime: several minutes.
- Requires: installed browsers and registry/network access; no publication
  secret.

### `vp run release:notes`

- Purpose: read-only local release briefing with blockers and exactly one next
  action.
- Mutates: nothing.
- Runs: local package-set identity, Git state, Changesets, changelog state, and
  retained artifact checks when present.
- Excludes: builds, registry mutation, and claims about remote CI unless the
  agent separately inspects them.
- Used: at the start of every release assessment.
- Expected runtime: seconds.
- Requires: no browser, secret, or network.

## Pull-request and main gates

### `PR gate`

`PR gate` is the only required branch-protection check. It aggregates:

- the minimum-supported Node compatibility lane;
- the complete `Verify` lane on the maintainer Node release.

The full lane runs `pnpm verify`. It proves one reviewable commit satisfies
the repository's static, type, test, docs, browser, size, and packed-artifact
contracts.

Required branch settings:

- pull requests required;
- `PR gate` required;
- conversation resolution required;
- force pushes and branch deletion blocked.

Avoid an approval count that prevents a solo maintainer from merging.

### `Main healthy`

`Main healthy` is exact-SHA release evidence, not a merge requirement. It
aggregates:

- the minimum-supported Node compatibility lane;
- the `Release candidate` lane on the maintainer Node release.

The release-candidate lane runs `pnpm release:verify` and uploads one retained
`release-candidate` artifact containing both tarballs and their package-set
manifest. Publication must name the numeric successful `ci` run and consume
that artifact without rebuilding.

If main advances, the previous run remains historical evidence but is no longer
eligible for a first publication attempt.

## Required remote settings

Configure these once before the first release:

- protect `main` with pull requests, conversation resolution, and required
  `PR gate`; block force pushes and branch deletion;
- allow GitHub Actions to create pull requests so the Changesets workflow can
  open its version pull request;
- create one `npm` environment, restrict it to `main`, and require a human
  reviewer;
- for a solo-maintainer repository, leave **Prevent self-review** disabled so
  the maintainer who dispatched the workflow can perform the deliberate
  approval; enable it only when a second qualified reviewer is actually
  available;
- configure trusted publishing separately for `@lupinum/vue-photo` and
  `@lupinum/nuxt-photo`, restricted to `release.yml`, environment `npm`, and
  stage-publish only;
- keep default workflow permissions read-only;
- require every external GitHub Action to use a full commit SHA;
- keep Issues enabled for public reports, and disable Wikis and Discussions so
  versioned repository documentation remains authoritative;
- enable private vulnerability reporting, secret scanning, push protection,
  vulnerability alerts, and CodeQL;
- install Renovate with access to dependency files, workflows, pull requests,
  issues, and vulnerability alerts; do not enable Dependabot update pull
  requests beside it.

After the Changesets workflow opens or updates a version pull request, GitHub
requires a maintainer to click **Approve workflows to run** before `PR gate`
starts. This is expected for a pull request created by `GITHUB_TOKEN`; do not
add a PAT to bypass the approval.

## Versioning

### One-time `0.2.0` migration transition

The repository is already prepared as `0.2.0`: both package manifests and both
package changelogs contain that version, while npm currently serves `0.1.2`.
The default migration decision is to preserve that reviewed version and release
intent. The migration produces new tarball bytes, which must be certified from
their exact main SHA before `0.2.0` uses the staged-publication path.

For this one release only:

- do not create a fake Changeset for work that is already represented by the
  prepared versions and package changelogs;
- do not run Changesets versioning over `0.2.0` and accidentally create another
  version;
- do not add unrelated public features to the candidate;
- record the exception in the release plan and first-release retrospective.

If the maintainer instead wants a prerelease rehearsal from public version
`0.1.2`, stop and obtain an explicit decision to reset both source versions and
release history before changing files. Do not infer that strategy.

After `0.2.0` is published successfully, Changesets is the only normal version
and changelog path.

1. Every user-visible pull request adds a Changeset.
2. Successful main CI triggers `.github/workflows/version.yml`.
3. The workflow opens or updates one version pull request.
4. The fixed package group versions `@lupinum/vue-photo` and
   `@lupinum/nuxt-photo` together.
5. Maintainers review the generated versions and both package changelogs.
6. Merging the version pull request creates a new exact-SHA main candidate.

`packages/vue/CHANGELOG.md` and `packages/nuxt/CHANGELOG.md` are the canonical
Changesets-generated histories. Root `CHANGELOG.md` is an index only. Do not
edit one package version independently, add release entries to the root index,
or maintain hand-written release notes beside Changesets.

The repository setting **Allow GitHub Actions to create and approve pull
requests** must be enabled for the `GITHUB_TOKEN` version-PR path. Do not add a
PAT merely to bypass that setting.

### Prereleases

- Enter prerelease mode through a focused pull request using the Changesets
  prerelease command.
- Let the version pull request create SemVer prerelease versions.
- Prereleases promote to `next`.
- Stable versions promote to `latest`.
- Mark the corresponding GitHub Release as a prerelease.
- Exit prerelease mode through another focused pull request.

Do not hand-edit `-next` or `-rc` suffixes.

## Publication

Publication is a human authorization of already-certified bytes. It is not a
local build command.

### 1. Select the candidate

1. Open the successful current-main `ci` run.
2. Confirm `Main healthy`.
3. Confirm the run uploaded `release-candidate`.
4. Run `vp run release:notes`.
5. Verify both versions, source SHA, channel, and tarball digests.

### 2. Prepare the release plan

Dispatch the `release` workflow from `main`. It automatically selects the
successful `ci.yml` push run for the current `main` commit.

The prepare job is read-only. It:

- downloads the retained package-set artifact;
- verifies both digests and package order;
- rejects a non-current main SHA for a first attempt;
- verifies versions are monotonic;
- derives `lupinum-stage-<ci-run-id>` from the selected numeric CI run;
- records previous `latest`/`next` and candidate-specific staging-tag targets;
- creates exact staging, promotion, cleanup, and rollback instructions.

Dispatch does not approve publication.

### 3. Stage the exact package set

Review the workflow summary. The protected OIDC stage job must publish no
locally rebuilt bytes and use npm trusted publishing in stage-only mode.

After exact maintainer authorization, approve the protected GitHub staging
deployment. A `fail-fast: false` matrix submits the two exact package tarballs
independently so one failed submission can be retried without replacing the
other package's bytes:

- `@lupinum/vue-photo@<version>`;
- `@lupinum/nuxt-photo@<version>`.

Submission order is not the public dependency-order gate. Neither submitted
stage becomes public until the maintainer approves it. The required
Vue-before-Nuxt order begins at npm stage approval and continues through
final-channel promotion.

Both use the unique temporary tag `lupinum-stage-<ci-run-id>` emitted by the
prepare job. A later release uses a different tag.

The stage job must not install dependencies, restore a dependency/build cache,
run package lifecycle scripts, or call a repository-local build.

### 4. Approve npm stages with personal 2FA

The workflow summary records both npm stage IDs. The maintainer personally
approves them in dependency order using npm's staged-publishing approval flow:

1. approve the Vue stage and complete npm 2FA;
2. wait until Vue is readable under the recorded
   `lupinum-stage-<ci-run-id>`;
3. approve the Nuxt stage and complete npm 2FA.

An agent may show the exact commands from the workflow summary. An agent must
never enter a 2FA code or approve/reject a stage.

### 5. Verify the temporary registry state

Before promotion, verify:

- both exact versions are readable;
- both registry SHA-1 values match the retained tarballs;
- both packages have provenance;
- the packed Nuxt dependency points to the released Vue version;
- both recorded candidate-specific staging tags point to the candidate
  versions.

Do not rerun the consumer matrix from npm. The retained tarballs already passed
the clean Vue and Nuxt consumers; matching registry SHA-1 values prove npm
serves those same bytes.

### 6. Promote the public channel with personal 2FA

Promote in dependency order:

```sh
npm dist-tag add @lupinum/vue-photo@<version> <latest|next>
npm dist-tag add @lupinum/nuxt-photo@<version> <latest|next>
```

Complete npm 2FA personally for each protected mutation.

Verify both final tags before cleaning the temporary channel. Run the exact
`rollbackStagingCommand` recorded for each package. It normally removes that
release's unique `lupinum-stage-<ci-run-id>` tag; if a target existed before
the release, it restores that target instead.

Do not remove the temporary tags while the package set is inconsistent.

### 7. Finalize GitHub evidence

Approve the pending protected finalization deployment only after both packages
are promoted and the temporary tags are clean.

The finalizer:

- re-verifies both npm versions, provenance, and final tags;
- creates one `v<version>` Git tag;
- creates one immutable GitHub Release;
- marks prereleases correctly;
- attaches both tarballs, the package-set manifest, and the release record.

Publication is complete only when npm, the Git tag, the GitHub Release, and the
durable evidence agree.

## Partial failure

### Before an npm stage is approved

No immutable version exists yet. An unwanted pending stage may be rejected
using the exact stage ID:

```sh
npm stage reject <stage-id>
```

Reject Vue or Nuxt independently only after checking whether the other stage or
version already exists.

### One npm stage approved, the other incomplete

- Do not rebuild or restage the approved version.
- Keep the approved package on the recorded
  `lupinum-stage-<ci-run-id>`.
- Continue recovery from the same workflow run and same retained artifact.
- Resolve or retry only the incomplete package.
- Do not promote either final channel until both staged packages are verified.

### One final channel promoted, the other incomplete

Immediately restore the first package's recorded previous channel target:

```sh
npm dist-tag add <package>@<previous-version> <latest|next>
```

If that channel previously had no target:

```sh
npm dist-tag rm <package> <latest|next>
```

Then fix or retry the remaining promotion using the already-approved versions.
Never leave `latest` or `next` pointing at a mixed package set.

### Temporary channel changed incorrectly

Run that package's exact `rollbackStagingCommand` from the release record. Do
not reconstruct it from memory. It restores the previous target when one
existed or removes the unique `lupinum-stage-<ci-run-id>` tag when none did.

### npm complete, GitHub finalization failed

- Do not republish or create another candidate.
- Re-run failed jobs in the same release workflow when supported.
- Verify the existing npm digests and provenance.
- Create or repair only the missing Git tag, GitHub Release, or evidence.
- Do not overwrite a mismatched public release automatically.

## Rollback

npm versions are immutable. Normal rollback is channel correction:

1. Identify the previous known-good Vue and Nuxt versions recorded in the
   release plan.
2. Restore `latest` or `next` for both packages.
3. Verify the restored set in a clean consumer.
4. Deprecate the bad versions with a concise migration or warning message.
5. Mark the GitHub Release as affected.
6. Open a fix-forward pull request and publish a new package set.

Unpublish only for a security, malware, legal, or secret-exposure requirement
and follow npm policy.

## Branch scope

A branch represents one review and rollback decision. Required tests, docs, and
cleanup stay with the outcome; independent features and opportunistic refactors
do not.

When a branch grows:

1. Write its intended outcome in one sentence.
2. Separate required work from interesting independent work.
3. Identify dependency order.
4. Finish the smallest coherent dependency first.
5. Move follow-ups only with maintainer approval.
6. Do not use destructive history surgery after review begins.

The detailed practical playbook is in `AGENTS.md`. Historical examples are in
`internal/migration/05-branch-scope-handling.md`.

## Dependency automation

Renovate is the sole update owner:

- consume GitHub vulnerability alerts and open reviewed remediation pull
  requests without waiting for the ordinary weekly window;
- group Vite+, Vite core, Rolldown, Vitest, TypeScript, Vue, Nuxt, and related
  type tooling where compatibility requires coordinated review;
- group GitHub Actions separately;
- maintain the lockfile;
- do not blanket-automerge;
- require manual review for majors, peers, Nuxt/Vue stacks, native packages,
  browser tooling, and security-sensitive tuples.

The pnpm and Renovate release-age policies must agree. Keep exceptions narrow,
dated, and removable. Security remediations may bypass the ordinary cooldown;
they still require CI and human review.

## Security operations

- Keep private vulnerability reporting enabled.
- Keep secret scanning and push protection enabled.
- Keep CodeQL on main, pull requests where appropriate, and a schedule.
- Keep default workflow permissions read-only.
- Keep publication authority only in the protected stage job.
- Require a public source repository for npm provenance.
- Require strong 2FA/passkeys on GitHub and npm maintainer accounts.
- Reject Git, URL, workspace, local-path, and unreviewed lifecycle-script
  dependency sources from packed manifests.
- Treat a production audit as a release signal, not proof of safety.
- Do not add a local publication fallback.

## Generated artifacts

Derived output must be ignored unless a consumer contract requires it committed.
It must be reproducible from a named command and never hand-edited.

Do not commit:

- `dist/`;
- `.release/`;
- `.nuxt/`;
- `.output/`;
- Playwright reports;
- generated tarballs.

Main CI retains the release candidate long enough for release authorization.
Completed GitHub Releases permanently retain the exact package-set evidence.

## Support and deprecation

- The current minor release receives security fixes.
- Older minors are unsupported unless a maintainer announces an exception.
- Prereleases receive best-effort support.
- Announce Node, Nuxt, Vue, or peer-support removals before a breaking release
  when practical.
- Deprecate superseded package names with an exact replacement command.

## Release-ready definition

A package set is release-ready only when:

- the versions and package changelogs came from the reviewed Changesets version
  pull request, except for the recorded one-time prepared `0.2.0` migration
  transition;
- both package versions match;
- the exact source SHA is current main;
- `PR gate` passed before merge;
- `Main healthy` passed on that exact SHA;
- every supported Node major passed its intended lane;
- package packs are byte-reproducible;
- manifest parity, exports, declarations, source maps, files, dependencies,
  lifecycle hooks, and local-path invariants passed;
- clean Vue and Nuxt consumers exercised the retained tarballs;
- the Tailwind playground, docs application, size budgets, and browser matrix
  passed;
- the production dependency audit passed;
- both retained tarballs and digests are present in one candidate artifact;
- the protected `npm` environment requires human review and guards both stage
  submission and final registry verification deployments;
- npm trusted publishing is restricted to the stage-only workflow;
- rollback targets for final and temporary channels are recorded;
- the maintainer understands that two personal npm 2FA approvals and two
  personal channel promotions remain.
