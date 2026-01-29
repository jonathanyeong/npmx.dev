import { object, string, boolean, array, optional } from 'valibot'
import type { InferOutput } from 'valibot'

/**
 * Schema for blog post frontmatter
 * Uses simple Valibot primitives (required by Nuxt Content's JSON Schema conversion)
 */
export const BlogPostSchema = object({
  title: string(),
  date: string(),
  description: string(),
  slug: string(),
  excerpt: optional(string()),
  author: optional(string()),
  tags: optional(array(string())),
  draft: optional(boolean()),
})

/**
 * Inferred type for blog post frontmatter
 */
export type BlogPostFrontmatter = InferOutput<typeof BlogPostSchema>
