# Changesets

Add a Changeset for user-visible changes with `pnpm changeset`. The Vue package
and Nuxt module form one fixed release group. Start with a short summary beginning
Fix, Add, Remove or Change. Major changes include a `Migration:` paragraph.

Changesets owns versions and package changelogs. The release workflow opens a
Version packages pull request; maintainers review it and approve the protected
npm deployment after merge. The current prerelease state remains in `pre.json`.
Follow the [OSS release procedure](https://oss.lupinum.com/docs/releasing) to exit
prerelease mode when preparing the stable version.
