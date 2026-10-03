# Nuxt Photo writing guide

Nuxt Photo uses Lupinum Controlled English. This profile is based on ASD-STE100
Issue 9. It does not claim formal ASD-STE100 compliance.

The website is consumer documentation for Nuxt Photo. Package source and
public type tests define behavior; the pages under `docs/content/docs` explain
that behavior without exposing repository internals.

## Write for three readers

Most readers do not read a page from top to bottom. Plan every page for these
readers, in this order:

1. **A coding agent in the user's app.** It writes most of the code. It reads
   the installed types first, then the skill, then one or two pages through
   `llms.txt` or `/raw/...md`. A page must let it finish the task alone.
2. **A developer who skims.** They decide, copy an example, and check what the
   agent built. They read the lead, the example, and the headings.
3. **A developer with a problem.** They search for an error message or a
   visible symptom.

This gives four rules:

- The package explains itself first. Public props and types carry JSDoc with
  the meaning, the default, and whether the value can change after mount.
  Errors name the fix and link to the page that explains it.
- Every task page is complete: the full files with paths, the rules that can
  break the task, and a check. Do not require a second page to finish.
- No fact exists only in an interactive block. Live examples are real files
  that also become code in the agent Markdown; demos repeat what the prose or
  a table already states.
- Write the decision and the trap, not a tour. Cut text that restates the code.

## Organize by task

The sidebar has four areas:

1. **Start** helps a reader decide, install, and see a first album: the
   introduction, get started, examples, AI agents, plain Vue, comparison, and
   performance.
2. **Guides** solve one task per page. A guide also explains the mechanism the
   task depends on; there is no separate concepts section.
3. **Reference** lists exact components, options, types, CSS, and exports,
   including lightbox behavior tables.
4. **Help** starts from an error message, a visible symptom, a known limit, or
   an upgrade.

Keep contributor architecture and CI procedures outside the consumer sidebar.
Use one canonical page for each fact. Another page may repeat a rule in one
sentence when the task breaks without it, and links to the canonical page for
detail.

## Shape a guide

1. **Lead:** one or two sentences with the result and when to use it.
2. **Result:** the live example, when one exists.
3. **Code:** the complete files with real paths, early on the page.
4. **Rules:** the constraints that can break this task, next to the code they
   affect.
5. **Check:** what the reader should see when the task works.

Headings name what the reader does or decides, such as "Share one lightbox
across albums", so the table of contents works as a summary. Keep frontmatter
`description` specific: `llms.txt` shows it to agents to choose a page, so name
the capabilities on the page, such as fade, crossfade, captions, or Cloudinary.
When a page moves, add its old path to `redirectFrom`.

## Write like Nuxt

- Lead with the result, decision, or constraint.
- Use active voice and address the reader as "you" only when it clarifies an
  action.
- Prefer a short working example over a long preamble.
- Explain one concept per example.
- Use sentence case for titles and headings.
- Keep paragraphs compact and remove meta prose such as "this page will".
- Put one instruction in each sentence.
- Use one term for one concept.
- Define a technical term before you use it.
- Use American English spelling.
- Use the public Nuxt import path, `@lupinum/nuxt-photo/app`, in explicit app
  imports. Reserve `@lupinum/vue-photo` for plain Vue documentation.

## Use direct, literal language

- Write like an experienced maintainer helping a capable junior developer.
- State the result or constraint in the first sentence.
- Prefer common words that preserve their meaning in translation.
- Describe observable behavior instead of making broad quality claims.
- Use "ready-made components" for `Photo`, `PhotoAlbum`, `PhotoGroup`, and
  `PhotoCarousel`.
- Use "lower-level components" for primitives.
- Use "component options" instead of "shallow props".
- Say "opening animation" until FLIP has been defined.
- Avoid metaphors, slang, cultural comparisons, hype, and exclamation marks.
- Avoid "simply", "just", "obviously", and wording that minimizes work.
- Do not open with meta prose about what the page will explain.
- Split a sentence when it gives more than one instruction.

Frontmatter supplies the page title. Do not add a body `#` heading.

Do not rewrite license text, code, API identifiers, command output, quotations,
changelog identifiers, or generated reports to match this profile.

## Structure public READMEs

Use the same public header in the root README and each published package README:

1. Center the 128 px product icon.
2. Center the product name and one-sentence value proposition.
3. Show npm, CI, and MIT badges.
4. State the release status when the package is not stable.

The root README then explains why and when to use the product, requirements,
installation, the smallest useful example, core concepts, packages,
documentation, contribution, support, security, and license. Package READMEs
use a compact version of the same order. Explain user outcomes before internal
architecture. Keep fixture, benchmark, license, migration, and proof READMEs
technical and unbranded.

## Build examples that can be copied

Label application files with a real path:

````md
```vue [app/pages/gallery.vue]
<!-- example -->
```

```ts [nuxt.config.ts]
// example
```
````

Use `[Terminal]` for shell sessions and type or symbol names for isolated API
shapes. Keep filenames consistent with the Nuxt 4 `app/` directory.

Every photo example needs a stable string `id`, `src`, and accurate intrinsic
`width` and `height`. Do not invent public options, internal imports, CSS hooks,
or migration layers. When an option is setup-time, say so next to the example
that might tempt a reader to change it at runtime.

## Link in context

Use canonical collection references for internal links:

```md
[use your own photos](/docs/guides/use-your-photos)
```

Place a link in the sentence that creates the need for it. Do not append
generic headings such as "What's next", "Next step", "Related", "See also",
"Conclusion", or "Summary". End with the instruction, limitation, or check
that completes the page.

## Use live examples

A live example is a real component in `docs/app/examples`. The page renders it,
shows its source under it, and the agent Markdown writes the same source as a
code block. Add one with `::example{name="portfolio-grid"}`; name extra files
with `also`, and use `code="open"` when the code is the point of the guide.

Every example:

- takes a `photos: PhotoItem[]` prop and contains no demo-only code, because
  readers copy it unchanged;
- uses only public imports from `@lupinum/nuxt-photo/app`;
- works in light and dark mode, at phone width, and under reduced motion;
- uses native labeled controls and complete keyboard behavior.

A small interactive demo (a `*-lab` component) may let a reader try settings,
but it never carries a fact alone. Register it in the agent Markdown serializer
as interactive-only, or remove it when it merely decorates prose. The docs
build fails when an agent page still contains a component placeholder.

## Keep source truth visible

Before publishing a behavior claim, check the owning package source, manifest,
and public export tests. Keep these facts aligned:

- package and peer versions;
- module defaults and registered components;
- public root and subpath exports;
- component props, slots, events, and setup-time options;
- CSS variables and supported stylesheet entry points;
- image adapter and SSR behavior;
- generated agent references.

Run `pnpm docs:check`, regenerate references with `pnpm docs:agent`, and
run `pnpm docs:build` before handoff. Read at least one changed page as an
agent sees it, under `/raw/docs/...md`. Use the in-app browser to test every
live example at desktop and phone widths.
