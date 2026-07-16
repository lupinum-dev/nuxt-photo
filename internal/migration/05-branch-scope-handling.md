# Branch scope handling

This document addresses a common move-fast failure mode:

> I started a small feature branch, then added more and more unrelated work.

The answer is not shame, arbitrary limits, or destructive Git surgery. The
answer is one review decision and one rollback decision at a time.

## The scope test

Write the branch outcome in one sentence.

Good:

> Add keyboard navigation to the lightbox and prove it in unit and browser
> tests.

Likely too broad:

> Add keyboard navigation and redesign captions and migrate dependencies and
> rewrite the docs site.

The word “and” is a signal to inspect scope, not an automatic failure. Tests,
documentation, and cleanup required for keyboard navigation belong with the
feature. An independent caption redesign does not.

## Classify new work immediately

When another idea appears, put it in one category.

### Required here

Keep it when the current outcome would otherwise be incorrect:

- a bug exposed by the feature;
- a missing test needed to prove the feature;
- documentation required for the public behavior;
- a type or package-contract change required for the feature;
- cleanup necessary to remove the old implementation after a hard cutover.

### Dependent follow-up

Defer it when it depends on the current branch but is independently releasable:

- a second public feature using the new primitive;
- a larger refactor enabled by the feature;
- docs expansion beyond the required migration note;
- another package adopting the new contract.

Record the dependency explicitly:

```text
Follow-up: redesign caption layout after keyboard-navigation PR merges.
Depends on: new lightbox focus contract.
```

### Independent follow-up

Defer it when it merely became interesting:

- unrelated dependency cleanup;
- naming changes outside the feature;
- another component's visual polish;
- a new abstraction with no current acceptance criterion.

## Five-minute rescue protocol

If the branch already grew:

1. Stop adding code.
2. Write the original intended outcome.
3. List the outcomes now present.
4. Mark each as required, dependent, or independent.
5. Draw the dependency order.
6. Choose the smallest dependency-first outcome that can be reviewed and
   reverted on its own.
7. Make that outcome green.
8. Ask the maintainer before moving or reverting already-written work.

Example:

```text
Original:
- add a new PhotoAlbum spacing option

Now present:
- spacing option and tests — required
- new shared CSS token naming — required if public option uses it
- caption redesign — independent
- Vite dependency update — independent

First PR:
- spacing option, required CSS token, tests, docs, Changeset

Follow-ups:
- caption redesign
- Vite dependency update
```

## Do not lose work

Agents must preserve unrelated work already in the worktree.

Do not:

- reset or delete changes to make the branch appear clean;
- move commits between branches without approval;
- rewrite reviewed history for aesthetics;
- silently leave half of a public contract behind;
- create compatibility shims merely to avoid finishing a hard cutover.

Safe options:

- leave independent changes untouched and report them;
- prepare a proposed split plan;
- make the current dependency-first subset green;
- ask the maintainer to authorize branch creation or movement;
- use follow-up issues or a written checklist.

## Agent handholding contract

When an agent notices scope growth, it should not merely say “split the PR.”
It should present:

```text
Intended outcome:

Required on this branch:
- ...

Independent work found:
- ...

Recommended first review:

Follow-up order:
1. ...
2. ...

Git changes proposed:
- none until approved
```

The maintainer should receive one concrete recommendation, not a menu of vague
options.

## When not to split

Do not split:

- implementation from the test that proves it;
- a public API change from its required docs and Changeset;
- a new path from deletion of the unreleased old path;
- a package dependency change from the clean packed-consumer proof;
- a security fix from the validation that closes the vulnerability.

Splitting required correctness creates more coordination and weaker commits.

## When a stacked branch is useful

A dependent follow-up may branch from an unmerged foundation when:

- the dependency is explicit;
- each pull request remains independently reviewable;
- the follow-up will be rebased after the foundation merges;
- the maintainer authorizes the Git operation.

Do not use stacked branches to hide one oversized review.

## Completion questions

Before review:

- Can the outcome be described in one sentence?
- Would rollback normally revert the whole pull request?
- Does it change one public contract?
- Are all required tests, docs, and Changesets present?
- Is independent work clearly deferred?
- Did we preserve unrelated user work?
