import type { AstroIntegration } from 'astro';
import { getAllPosts, downloadFile } from '../lib/notion/client';

export default (): AstroIntegration => ({
  name: 'book-review-images-downloader',
  hooks: {
    'astro:build:start': async () => {
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
  },
});
