import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every .md file in src/content/blog/ becomes a post.
// The schema validates frontmatter at build time — a typo'd or missing
// field fails the build instead of silently breaking the site.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
  }),
});

export const collections = { blog };
