import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const Button = z.object({
  label: z.string(),
  icon: z.string().optional(),
  trailingIcon: z.string().optional(),
  to: z.string(),
  color: z.enum(['primary', 'neutral']).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'link']).optional(),
  id: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional()
})

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*',
      schema: z.object({
        links: z.array(Button).optional()
      })
    }),
    pages: defineCollection({
      type: 'page',
      source: '*.md'
    })
  }
})
