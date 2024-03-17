import type { APIContext } from 'astro';
import { getOgImage } from '../../components/OgImage';
import { getAllPosts, getPostBySlug } from '../../lib/notion/client';

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: post.Slug },
  }));
}

export async function GET({ params }: APIContext) {
  if (params.slug === undefined) return;
  const post = await getPostBySlug(params.slug);
  const buffer = await getOgImage(post?.Title ?? 'No title');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}
