# Internal migration archive

This directory preserves the Nuxt Photo maintenance migration research,
decisions, evidence, and first-release retrospective.

It is not:

- package source;
- public documentation;
- an executable release dependency;
- an active policy source;
- shipped in either npm package.

Active instructions live in `AGENTS.md`, `CONTRIBUTING.md`, and
`MAINTAINING.md`. Executable truth lives in manifests, tests, scripts, and
workflows.

## Downstream deletion rule

Repositories created from a starter or copied from Nuxt Photo should delete the
complete `internal/` directory unless they are actively performing and
recording their own migration.

Delete it atomically:

1. Confirm no active file depends on or links to `internal/`.
2. Move any unresolved operational decision into `MAINTAINING.md` or an issue.
3. Delete the complete directory in one focused pull request.
4. Run `vp run verify`.

Do not keep a partial archive that could be mistaken for current policy.
