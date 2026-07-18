import rss from '@astrojs/rss';
import { getAllContent, getDatabase } from '@lib/notion/client';
import { getPostLink, getBookReviewLink } from '@lib/blog-helpers';
import type { Post, BookReview } from '@lib/interfaces';

export async function GET() {
  const [entries, database] = await Promise.all([
    getAllContent(),
    getDatabase(),
  ]);

  // gallery items have no body text and no meaningful RSS content
  const items = entries.filter((entry) => entry.source !== 'gallery');

  return rss({
    title: database.Title,
    description: database.Description,
    site: import.meta.env.SITE,
    items: items.map(({ post, source }) => {
      const p = post as Post | BookReview;
      return {
        link: new URL(
          source === 'bookReview'
            ? getBookReviewLink(p.Slug)
            : getPostLink(p.Slug),
          import.meta.env.SITE
        ).toString(),
        title: p.Title,
        description: p.Excerpt,
        pubDate: new Date(p.Date),
      };
    }),
  });
}
