---
source_of_truth: true
version: 1
---

# Design Philosophy

## The Contact Sheet

Nuxt Photo should feel like a well-edited contact sheet: the images provide the
emotion and proof, while the surrounding system is disciplined, neutral, and
fast to scan. The interface borrows the confidence of Nuxt's documentation
without imitating its decoration. Warm amber is used as a precise annotation
color, not as ambient mood.

## Principles

- **Photography is the evidence.** Prefer real gallery output over decorative
  illustration or feature-card theater.
- **Controls explain decisions.** A playground earns its place only when each
  input changes a real public setting and the generated code stays in sync.
- **Structure stays quiet.** Use spacing, type, and tonal surfaces for
  hierarchy. Borders are structural and complete, never decorative stripes.
- **Reading comes first.** Prose remains compact, examples are small, and
  reference pages avoid heavy interactive embeds.
- **One topic, one canonical demo.** Link through the sentence that creates the
  need; do not append generic navigation sections.

## Colors

Use the Ginko Docs semantic tokens as the base. Light mode uses the existing
cool-neutral page surfaces and dark ink; dark mode uses warm near-black
surfaces. `--primary`, `--ring`, and `--docs-accent` use the existing amber
accent (`oklch(0.68 0.17 65)` in light mode, `oklch(0.77 0.15 70)` in dark
mode). Amber is reserved for focus, selected settings, and small status cues.
Success and error states use semantic theme colors, never amber. The lightbox
and code output may use near-black surfaces because they represent the product
canvas rather than a raised card.

## Typography

Public Sans is the documentation typeface, with the system monospace stack for
code and measured values. Body copy uses comfortable line-height and a maximum
measure near 70 characters. Headings are compact and sentence-cased. Negative
letter spacing never exceeds `-0.04em`; labels do not use decorative uppercase
tracking. Controls stay at least 14px on compact layouts and 16px where text
entry could trigger mobile zoom.

## Layout

The documentation shell comes from Ginko Docs. Within articles, interactive
examples use one bounded surface with a preview and a 17rem control column at
large widths. They stack before the control column becomes cramped. Preview
surfaces use a subtle tonal change, and code is disclosed below the preview so
the reader can inspect it without losing context. Spacing follows a 4px base
and uses 8, 12, 16, 24, 32, and 48px steps. Avoid nested cards and avoid more
than two surface levels within a playground.

## Interaction

Prefer native fieldsets, radios, checkboxes, selects, ranges, buttons, and
`details` disclosures. Every setting has a visible label and a concise result.
Changing a setting updates the preview and generated code immediately; options
that only apply during setup remount the affected demo explicitly. Use short
opacity or dimension transitions only when they explain a state change, and
disable them under reduced motion. Lightbox demos must support Escape, arrow
keys, focus return, touch gestures, and zoom according to the actual library
runtime.

## Responsive Strategy

Treat the article column as the source of truth. At desktop widths, previews
and controls may sit side by side; below the large breakpoint they stack with
the preview first. Toolbars wrap without hiding labels. Canvas width controls
may scroll inside their own preview but must never create page-level overflow.
At small-phone widths, all controls become single-column, touch targets stay at
least 44px, code blocks scroll horizontally, and the product photos keep their
declared aspect ratios so the page remains stable.
