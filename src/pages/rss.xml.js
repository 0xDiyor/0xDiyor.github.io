import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog')).sort(
    (a, b) => +b.data.date - +a.data.date
  );
  return rss({
    title: '0xDiyor',
    description: 'Cybersecurity portfolio, projects, and writeups by 0xDiyor',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
