# Target maintenance profile

## Repository classification

Nuxt Photo combines three maintenance profiles:

1. browser-heavy Vue UI library;
2. Nuxt module;
3. documentation/application consumer.

Its release unit is one coordinated multi-package set:

```text
@lupinum/vue-photo
  → @lupinum/nuxt-photo
    → playgrounds and docs
```

## Required outcomes

### Daily developer outcome

```sh
vp check
vp test
```

The commands must be fast, memorable, browser-free for ordinary work, and free
of release ceremony.

### Handoff outcome

```sh
vp run verify
```

This proves static checks, Vue and Nuxt types, tests, package bytes, clean
consumers, size, Tailwind, docs, and browser behavior.

### Main outcome

`Main healthy` proves the exact source SHA and retains the exact package set
eligible for publication.

### Release outcome

The protected release workflow stages the retained bytes. The maintainer
personally approves npm stages and final channel promotion with 2FA. No build
occurs under publication authority.

## Vite+ boundary

Vite+ is the default interface and owns:

- Oxfmt;
- Oxlint;
- type-aware lint rules;
- Vitest;
- task orchestration;
- package-manager delegation.

It does not erase framework contracts.

### Vue-template exception

Oxlint's selected Vue rules cover script-oriented behavior but not the complete
Vue template rule set used by this repository. A narrow
`eslint-plugin-vue` command therefore checks authored `.vue` files.

Accepted:

- Vue plugin rules;
- Vue parser;
- TypeScript parser only as required to parse SFC script blocks;
- formatter-conflict suppression.

Rejected:

- general JavaScript ESLint;
- general TypeScript ESLint;
- a second formatter;
- a second repository-wide lint command.

### Compiler exception

Oxlint's type-aware rules are useful. Its TS-Go compiler diagnostics are not
authoritative for:

- `.vue` module declarations;
- Nuxt `#app` and `#imports`;
- generated application tsconfigs;
- workspace package exports before a clean build;
- Nuxt module declaration generation.

The target keeps:

- `vue-tsc` for Vue source and public declarations;
- `nuxi prepare` plus `vue-tsc` for applications;
- Nuxt Module Builder for published module output.

This is not duplicate proof. The tools own different syntax and generated
contracts.

## One Vite runtime

The tested layout uses one workspace-wide Vite+ core alias. A root real Vite 7
beside Vite+ was rejected because Vite+ documents split Vite/Vitest instances as
unsafe.

Nuxt 4 accepted the Vite+ core's Vite 8 runtime after the root declared the
matching Rolldown peer. The direct Rolldown dependency solves Nuxt Vite
Builder's real runtime import; it does not create a second Vite path.

## TypeScript selection

The plain library starter used a newer TypeScript release. Nuxt Photo retains
the newest TypeScript version accepted by its current Nuxt Module Builder peer
range.

Standardize the guarantee, not the number:

- one exact TypeScript version across workspaces;
- accepted by framework tooling;
- covered by type, build, and packed-consumer checks.

Do not force a template version that violates a real peer contract.

## Package construction

Keep:

- `unbuild` for SFC-preserving Vue output;
- Nuxt Module Builder for the Nuxt module;
- manifest-owned exports and files allowlists.

The release packer owns:

- dependency order;
- two clean packs;
- digest equality;
- exact manifest parity;
- workspace rewrite verification;
- exports and declaration validation;
- clean Vue and Nuxt consumers;
- one package-set manifest.

## Browser profile

Keep:

- full Chromium behavior;
- focused mobile Chromium behavior;
- focused Firefox and WebKit smoke;
- failure traces rather than always-retained large reports.

Do not duplicate the entire suite across engines without evidence of a distinct
contract.

## Documentation profile

The docs application is a real consumer because it:

- installs the workspace Nuxt module;
- extends a published Ginko Docs package;
- consumes published Ginko Content;
- renders interactive Nuxt Photo examples;
- builds the canonical public documentation output.

It belongs in full verification. Deployment remains separate from npm package
publication.
