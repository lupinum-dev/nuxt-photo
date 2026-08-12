# Nuxt Photo writing guide

Nuxt Photo uses Lupinum Controlled English. This profile is based on ASD-STE100
Issue 9. It does not claim formal ASD-STE100 compliance.

The website is consumer documentation for Nuxt Photo. Package source and
public type tests define behavior; the pages under `docs/content/docs` explain
that behavior without exposing repository internals.

## Organize by reader intent

The sidebar has two primary areas:

1. **Documentation** starts with the quickstart, then moves through concepts,
   task guides, customization, and troubleshooting.
2. **Reference** contains exact options, symbols, components, exports, and
   upgrade notes.

Use `sidebar: section` only for those two area boundaries. Every folder between
them uses `sidebar: group`. Keep the tree flat enough to scan in one pass.

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
- Use the public Nuxt import path, `@nuxt-photo/nuxt/app`, in explicit app
  imports. Reserve `@nuxt-photo/vue` for plain Vue documentation.

Frontmatter supplies the page title. Do not add a body `#` heading.

Do not rewrite license text, code, API identifiers, command output, quotations,
changelog identifiers, or generated reports to match this profile.

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
[the photo model]($docs/concepts/photo-model)
```

Place a link in the sentence that creates the need for it. Do not append
generic headings such as "What's next", "Next step", "Related", "See also",
"Conclusion", or "Summary". End with the instruction, limitation, or check
that completes the page.

## Use interactive examples deliberately

An interactive example belongs on the one learning page where changing the
setting teaches the concept. Reference pages remain fast to scan.

Every playground must:

- control real public behavior;
- keep generated code synchronized with the preview;
- distinguish live runtime settings from build-time configuration;
- remount components when a setup-time option changes;
- use native labeled controls and complete keyboard behavior;
- avoid duplicate IDs and page-level horizontal overflow;
- work in light and dark mode and under reduced motion;
- expose a useful result on mobile without hiding essential controls.

Remove a playground when it merely decorates prose or simulates behavior that
the installed docs app cannot run.

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

Run `vp run docs:validate`, regenerate references with `vp run docs:agent`, and
build the production docs before handoff. Use the in-app browser to test every
canonical playground at desktop and phone widths.
