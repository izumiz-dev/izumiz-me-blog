import type { APIContext } from 'astro';
import { getOgImage } from '../../../components/OgImage';
import { getAllPosts, getPostBySlug } from '../../../lib/notion/client';
import type { Post, BookReview } from '../../../lib/interfaces';

type OgSource = 'blog' | 'bookReview';
const OG_SOURCES: OgSource[] = ['blog', 'bookReview'];

export async function getStaticPaths() {
  const postsBySource = await Promise.all(
    OG_SOURCES.map(
      (source) => getAllPosts(source) as Promise<(Post | BookReview)[]>
    )
  );
  return OG_SOURCES.flatMap((source, i) =>
    postsBySource[i].map((post) => ({
      params: { source, slug: post.Slug },
    }))
  );
}

export async function GET({ params }: APIContext) {
  if (params.slug === undefined) return;
  const source = OG_SOURCES.includes(params.source as OgSource)
    ? (params.source as OgSource)
    : 'blog';
  const post = await getPostBySlug(params.slug, source);
  const buffer = await getOgImage(post?.Title ?? 'No title');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}
