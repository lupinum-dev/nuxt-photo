# Changesets

Changesets are the sole source of release intent for the two public Nuxt Photo
packages.

Add a Changeset when a pull request changes shipped behavior, public types,
package exports, runtime compatibility, or user-facing documentation:

```bash
vp run changeset
```

`@lupinum/vue-photo` and `@lupinum/nuxt-photo` are a fixed release group. They always
receive the same version even when a change affects only one package.

The source tree already contains the prepared, unpublished `0.2.0` candidate.
That version predates this Changesets cutover and deliberately has no pending
Changeset. Do not add a retroactive minor Changeset: it would calculate
`0.3.0`. After the `0.2.0` release decision, every new user-facing change must
use the normal Changesets path.

Do not edit package versions or generated package changelogs by hand. The
version workflow consumes pending Changesets and opens the reviewed version pull
request.
