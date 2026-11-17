import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

// The lightbox moves its parts with the drag, the settle spring and the open and close motions.
// A CSS transition or animation of a layout property runs on a clock of its own beside them:
// a caption that eased its `top` after each photo change jumped and trailed its photo.
const files = ['lightbox-structure.css', 'lightbox-theme.css']
const layout =
  /^(all|top|right|bottom|left|inset(-.+)?|width|height|min-width|max-width|min-height|max-height|margin(-.+)?|padding(-.+)?)$/

/** Exceptions, each with its reason. None today. */
const allowed: string[] = []

function css(name: string) {
  return readFileSync(new URL(`../src/styles/${name}`, import.meta.url), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
}

/** The properties each `transition` or `transition-property` declaration names. */
function transitioned(source: string) {
  return [...source.matchAll(/(?:^|[;{\s])transition(?:-property)?\s*:\s*([^;}]+)/g)].flatMap(
    ([, value]) => value!.split(',').map((item) => item.trim().split(/\s+/)[0]!),
  )
}

/** The properties every `@keyframes` block sets; an animation can only run those. */
function animated(source: string) {
  return [...source.matchAll(/@keyframes[^{]+\{((?:[^{}]*\{[^}]*\})*)[^}]*\}/g)].flatMap(
    ([, body]) => [...body!.matchAll(/([a-z-]+)\s*:/g)].map(([, property]) => property!),
  )
}

describe('lightbox styles', () => {
  it.each(files)('%s transitions and animates no layout property', (name) => {
    const source = css(name)
    const found = [...transitioned(source), ...animated(source)].filter(
      (property) => layout.test(property) && !allowed.includes(`${name}: ${property}`),
    )
    expect(found).toEqual([])
  })
})
