import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { defineNuxtModule, useNuxt, createResolver } from 'nuxt/kit'
import { safeParse } from 'valibot'
import * as site from '../shared/types/lexicons/site'
import { BlogPostSchema } from '../shared/schemas/blog'
import { NPMX_SITE } from '../shared/utils/constants'
import { TID } from '@atproto/common'
import { Client } from '@atproto/lex'

const syncedDocuments = new Map<string, string>()

export default defineNuxtModule({
  meta: { name: 'standard-site-sync' },
  async setup() {
    const nuxt = useNuxt()
    const { resolve } = createResolver(import.meta.url)
    const contentDir = resolve('../app/pages/blog')

    if (nuxt.options._prepare) return

    nuxt.hook('build:before', async () => {
      const glob = await import('fast-glob').then(m => m.default)
      const files = await glob(`${contentDir}/**/*.md`)

      for (const file of files) {
        await syncFile(file, NPMX_SITE)
      }
    })

    nuxt.hook('builder:watch', async (_event, path) => {
      if (path.endsWith('.md')) {
        await syncFile(resolve(nuxt.options.rootDir, path), NPMX_SITE)
      }
    })
  },
})

// TODO: Placeholder algo, can likely be simplified
function parseBasicFrontmatter(fileContent: string): Record<string, any> {
  const match = fileContent.match(/^---\r?\n([\s\S]+?)\r?\n---/)
  if (!match) return {}

  const obj: Record<string, any> = {}
  const lines = match[1]?.split('\n')

  if (!lines) return {}

  for (const line of lines) {
    const [key, ...valParts] = line.split(':')
    if (key && valParts.length) {
      let value = valParts.join(':').trim()

      // Remove surrounding quotes
      value = value.replace(/^["']|["']$/g, '')

      // Handle Booleans
      if (value === 'true') {
        obj[key.trim()] = true
        continue
      }
      if (value === 'false') {
        obj[key.trim()] = false
        continue
      }

      // Handle basic array [tag1, tag2]
      if (value.startsWith('[') && value.endsWith(']')) {
        obj[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
      } else {
        obj[key.trim()] = value
      }
    }
  }
  return obj
}

const syncFile = async (filePath: string, siteUrl: string) => {
  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const frontmatter = parseBasicFrontmatter(fileContent)

    // Schema expects 'path' & frontmatter provides 'slug'
    if (frontmatter.slug) {
      frontmatter.path = `/blog/${frontmatter.slug}`
    }

    const result = safeParse(BlogPostSchema, frontmatter)
    if (!result.success) {
      console.warn(`[standard-site-sync] Validation failed for ${filePath}`, result.issues)
      return
    }

    const data = result.output

    // filter drafts
    if (data.draft) {
      if (process.env.DEBUG === 'true') {
        console.debug(`[standard-site-sync] Skipping draft: ${data.path}`)
      }
      return
    }

    const hash = createHash('sha1').update(JSON.stringify(data)).digest('hex')

    if (syncedDocuments.get(data.path) === hash) {
      return
    }

    // TODO: Review later
    const document = site.standard.document.$build({
      site: siteUrl as `${string}:${string}`,
      path: data.path,
      title: data.title,
      description: data.description ?? data.excerpt,
      tags: data.tags,
      // This can be extended to update the site.standard.document .updatedAt if it is changed and use the posts date here
      publishedAt: new Date(data.date).toISOString(),
    })

    const dateInMicroSeconds = new Date(result.output.date).getTime() * 1_000
    // Clock id(3) needs to be the same everytime to get the same TID from a timestamp
    const tid = TID.fromTime(dateInMicroSeconds, 3)
    //Authenticated via an app password to the PDS
    const client = new Client('https://pdsurl.com')
    // This will allow us to do an upsert on the date so we are always updating a record if it has the same published date instead of creating a new one everytime//
    //
    client.put(site.standard.document, document, {
      rkey: tid.str,
    })

    console.log('[standard-site-sync] Pushing:', JSON.stringify(document, null, 2))
    // TODO: Real PDS push

    syncedDocuments.set(data.path, hash)
  } catch (error) {
    console.error(`[standard-site-sync] Error in ${filePath}:`, error)
  }
}
