import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export async function getSortedPosts(): Promise<Post[]> {
  return (await getCollection('blog')).sort((a, b) => +b.data.date - +a.data.date);
}

// Minutes to read the raw Markdown body at ~220 words per minute
export function readingTime(post: Post): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
