import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const usesVercelOutput = process.env.VERCEL === '1' || process.env.NITRO_PRESET === 'vercel'
const outputDirectory = usesVercelOutput ? '.vercel/output/static' : '.output/public'
const routeOutput = fileURLToPath(
  new URL(`../docs/${outputDirectory}/docs/overview/why-nuxt-photo/index.html`, import.meta.url),
)

let html
try {
  html = await readFile(routeOutput, 'utf8')
} catch (error) {
  throw new Error(`Docs production build did not generate ${routeOutput}.`, { cause: error })
}

const requiredContent = [
  '<title>Why Nuxt Photo? - Nuxt Photo</title>',
  '<h1',
  'Why Nuxt Photo?',
  'One photo model for responsive albums',
]

for (const content of requiredContent) {
  if (!html.includes(content)) {
    throw new Error(`Docs production route is missing expected content: ${content}`)
  }
}

if (html.includes('Server Error') || html.includes('data-error="500"')) {
  throw new Error('Docs production route rendered an error page.')
}

console.log('✓ Docs production route rendered /docs/overview/why-nuxt-photo')
