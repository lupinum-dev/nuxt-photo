# Baseline and rationale

Snapshot: `4b4b94a43d08d8fb0f7eaf74ecd374a4c2348ac0`

## Why Nuxt Photo was selected

Nuxt Photo was not the smallest possible first pilot. It was selected because
it exercises the maintenance contracts most likely to fail in real Lupinum
libraries:

- `@nuxt-photo/vue` must publish before `@nuxt-photo/nuxt`;
- the Nuxt package must reference the exact released Vue version after packing;
- Vue SFC output must remain consumable;
- Nuxt-generated declarations and aliases require framework-aware checks;
- browser interaction is a supported contract;
- Tailwind integration is materially distinct from the main playground;
- the docs app is a real downstream consumer;
- a partial two-package release needs an explicit recovery plan.

The package set was still pre-1.0 and had a modest public blast radius, which
made it a useful learning target without making the exercise artificial.

## Baseline strengths retained

The migration deliberately retained several well-designed capabilities:

- extensive Vue unit, component, SSR, and hydration tests;
- Nuxt module and runtime tests;
- a real Nuxt integration fixture;
- asymmetric Playwright coverage instead of tripling the complete suite;
- separate main and Tailwind playgrounds for distinct contracts;
- size budgets for Vue and Nuxt use;
- package-order discovery;
- tarball metadata, export, declaration, and workspace-rewrite checks;
- a clean Nuxt consumer built from packed tarballs;
- SHA-pinned GitHub Actions.

The migration is a hard cutover of maintenance paths, not a rewrite of working
product contracts.

## Baseline problems

### Local publication was authoritative

The repository published from a maintainer checkout. The local script rebuilt,
packed, authenticated, and published Vue before Nuxt.

Impact:

- published bytes were created after CI;
- maintainer-machine state could affect the release;
- provenance and trusted publishing were absent;
- a Vue success followed by a Nuxt failure created a partial public set;
- release recovery depended on local state and operator knowledge.

Target:

- main CI creates the sole retained package set;
- publication consumes those exact bytes;
- npm trusted publishing stages them;
- the maintainer personally approves and promotes both with 2FA;
- the local publication path is removed.

### Remote and local authority disagreed

Remote CI excluded the Ginko-backed docs app, while contributor guidance called
the docs-inclusive local command authoritative.

Impact:

- an exact SHA could not be proven release-ready by remote evidence;
- release success depended on unretained maintainer-local output;
- the public docs application could drift from the package set.

Target:

- all workspaces install portably;
- `PR gate` owns merge evidence;
- `Main healthy` owns exact-SHA release evidence;
- docs build in the full authoritative lane.

### Versioning was manual

Source was prepared as `0.2.0` while npm still served `0.1.2`. Package versions
and package changelog entries were reviewed, but release intent did not flow
through a reviewed version pull request.

Target:

- preserve and certify the prepared `0.2.0` candidate as a documented one-time
  migration transition;
- do not manufacture an empty Changeset or version the candidate again;
- require an explicit maintainer decision before choosing the alternative of
  resetting source to `0.1.2` for a prerelease rehearsal;
- Changesets owns release intent;
- one version pull request updates both coordinated packages and their
  canonical package changelogs after `0.2.0`;
- versions are not hand-edited during normal releases.

### Tooling was split

Formatting, general linting, Vue template linting, Vitest, pnpm workspace tasks,
Vue typechecking, and Nuxt typechecking all had separate entry points.

Target:

- Vite+ becomes the common developer interface;
- Oxfmt replaces Prettier;
- Oxlint replaces general ESLint;
- the small Vue-template and framework-type exceptions remain explicit;
- no second general tool path survives.

### Support promises were unbounded

The engine range promised an unbounded future Node major.

Impact:

- CI could not prove the declared promise;
- new majors could become “supported” without an intentional decision.

Target:

- bounded Node majors;
- one compatibility lane for every supported major;
- one exact maintainer runtime in `.node-version`.

### Repository settings did not enforce the process

The audit found no effective required aggregate gate or protected publication
environment.

Target:

- require `PR gate`;
- retain `Main healthy` evidence;
- protect staging and finalization deployments;
- enable trusted publishing, provenance, private vulnerability reporting,
  secret scanning, push protection, and CodeQL.

## What this pilot must teach us

The pilot is successful only if it answers:

- Is `vp check` genuinely useful during normal development?
- Does the Vue-template exception stay narrow and understandable?
- Can Nuxt, Vite+, Rolldown, and Vue typechecking coexist without duplicate
  runtimes?
- Can one main artifact represent two dependent packages safely?
- Can a maintainer release without remembering hidden commands?
- Does npm staged publishing and 2FA promotion recover cleanly from partial
  failure?
- Which pieces should feed back into the starter?
- Which Nuxt Photo-specific pieces must remain local?
