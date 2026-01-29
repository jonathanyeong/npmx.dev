import { defineContentConfig, defineCollection } from '@nuxt/content'
import { BlogPostSchema } from './shared/schemas/blog'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: BlogPostSchema,
    }),
  },
})
