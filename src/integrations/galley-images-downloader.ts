import type { AstroIntegration } from 'astro';
import { getAllPosts, downloadFile } from '../lib/notion/client';

export default (): AstroIntegration => ({
  name: 'galley-images-downloader',
  hooks: {
    'astro:build:start': async () => {
      const posts = await getAllPosts(true);

      await Promise.all(
        posts.map((post) => {
          if (!post.FeaturedImage || !post.FeaturedImage.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(post.FeaturedImage.Url);
            console.log(`Download Gallery: ${url} ${post.Title}`);
          } catch (err) {
            console.log('Invalid FeaturedImage URL');
            return Promise.resolve();
          }

          return downloadFile(url);
        })
      );
    },
  },
});
