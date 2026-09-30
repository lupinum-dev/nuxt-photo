import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const usesVercelOutput = process.env.VERCEL === '1' || process.env.NITRO_PRESET === 'vercel'
const outputDirectory = usesVercelOutput ? '.vercel/output/static' : '.output/public'
const routeOutput = fileURLToPath(
  new URL(`../docs/${outputDirectory}/docs/start/introduction/index.html`, import.meta.url),
)

let html
try {
  html = await readFile(routeOutput, 'utf8')
} catch (error) {
  throw new Error(`Docs production build did not generate ${routeOutput}.`, { cause: error })
}

const requiredContent = ['<title>Introduction - Nuxt Photo</title>', '<h1', 'Pick a component']

for (const content of requiredContent) {
  if (!html.includes(content)) {
    throw new Error(`Docs production route is missing expected content: ${content}`)
  }
}

if (html.includes('Server Error') || html.includes('data-error="500"')) {
  throw new Error('Docs production route rendered an error page.')
}

console.log('✓ Docs production route rendered /docs/start/introduction')

// Agents read the Markdown versions. Every page must reach them as complete
// text: no component placeholders and no examples without their code.
const publicOutput = fileURLToPath(new URL(`../docs/${outputDirectory}/`, import.meta.url))
const agentFiles = [
  'llms.txt',
  'llms-full.txt',
  ...(await readdir(`${publicOutput}raw`, { recursive: true }))
    .filter((file) => file.endsWith('.md'))
    .map((file) => `raw/${file}`),
]
const placeholders = ['Component omitted', '<example', '<pm-install']

for (const file of agentFiles) {
  const markdown = await readFile(`${publicOutput}${file}`, 'utf8')
  const found = placeholders.find((placeholder) => markdown.includes(placeholder))
  if (found) throw new Error(`Agent Markdown ${file} contains a placeholder: ${found}`)
}

console.log(`✓ ${agentFiles.length} agent Markdown files contain complete content`)
