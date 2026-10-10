import { rm } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { getAllPosts, downloadFile } from '../lib/notion/client';
import { BOOKS_PUBLIC } from '../server-constants';

export default (): AstroIntegration => ({
  name: 'book-review-images-downloader',
  hooks: {
    'astro:build:start': async () => {
      if (!BOOKS_PUBLIC) {
        console.log('Book reviews are unpublished; skipping cover downloads');
        return;
      }

      console.log('Book review images downloader integration started');
      const posts = await getAllPosts('bookReview');

      await Promise.all(
        posts.map((post) => {
          if (!post.FeaturedImage || !post.FeaturedImage.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(post.FeaturedImage.Url);
            console.log(`Download Book Review: ${url} ${post.Title}`);
          } catch {
            console.log('Invalid FeaturedImage URL');
            return Promise.resolve();
          }

          return downloadFile(url);
        })
      );
    },
    'astro:build:done': async ({ dir }) => {
      if (BOOKS_PUBLIC) return;

      await rm(new URL('book-reviews/', dir), { recursive: true, force: true });
      await rm(new URL('book-reviews.html', dir), { force: true });
    },
  },
});
