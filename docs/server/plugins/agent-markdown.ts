import { registerAgentMarkdownSerializers } from '@lupinum/ginko-content/agent-registry'
import type { AgentMarkdownSerializer } from '@lupinum/ginko-content/agent-registry'
import exampleSources from '#docs/example-sources'

// Agents read the Markdown version of each page (`/raw/...md`, `llms-full.txt`).
// A live example is useless there unless it becomes plain code, so this
// serializer writes the same source the page renders.

function fileName(name: string) {
  return (
    name
      .trim()
      .split('-')
      .map((part) => part[0]!.toUpperCase() + part.slice(1))
      .join('') + '.vue'
  )
}

function codeBlock(file: string) {
  const source = exampleSources[file]
  if (source === undefined) throw new Error(`[docs] No example named "${file}" in app/examples.`)
  return `\`\`\`vue [app/components/${file}]\n${source}\n\`\`\``
}

const example: AgentMarkdownSerializer = (_node, ctx) => {
  const files = [ctx.prop('name'), ...ctx.prop('also').split(',')]
    .filter((name) => name.trim())
    .map(fileName)
  const usage = `<${files[0]!.slice(0, -'.vue'.length)} :photos="photos" />`
  return [
    `Complete example in ${files.length === 1 ? 'one file' : `${files.length} files`}. ` +
      `Use it as \`${usage}\` with your own \`PhotoItem[]\`.`,
    ...files.map(codeBlock),
  ].join('\n\n')
}

// These demos only let a reader try settings that the surrounding prose and
// tables already state, so the Markdown version leaves them out.
const interactiveOnly = ['album-layout-lab']
const nothing: AgentMarkdownSerializer = () => ''

export default defineNitroPlugin(() => {
  registerAgentMarkdownSerializers(
    {
      example,
      ExampleBlock: example,
      ...Object.fromEntries(interactiveOnly.map((tag) => [tag, nothing])),
    },
    { override: true },
  )
})
