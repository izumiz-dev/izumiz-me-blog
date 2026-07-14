import rss from '@astrojs/rss';
import { getAllPosts, getDatabase } from '@lib/notion/client';
import { getPostLink, getBookReviewLink } from '@lib/blog-helpers';
import type { ContentSource, Post, BookReview } from '@lib/interfaces';

export async function GET() {
  const [posts, bookReviews, database] = await Promise.all([
    getAllPosts('blog'),
    getAllPosts('bookReview'),
    getDatabase(),
  ]);

  const items: { post: Post | BookReview; source: ContentSource }[] = [
    ...(posts as Post[]).map((post) => ({ post, source: 'blog' as const })),
    ...(bookReviews as BookReview[]).map((post) => ({
      post,
      source: 'bookReview' as const,
    })),
  ].sort(
    (a, b) => new Date(b.post.Date).getTime() - new Date(a.post.Date).getTime()
  );

  return rss({
    title: database.Title,
    description: database.Description,
    site: import.meta.env.SITE,
    items: items.map(({ post, source }) => ({
      link: new URL(
        source === 'bookReview'
          ? getBookReviewLink(post.Slug)
          : getPostLink(post.Slug),
        import.meta.env.SITE
      ).toString(),
      title: post.Title,
      description: post.Excerpt,
      pubDate: new Date(post.Date),
    })),
  });
}
