import type { APIContext } from 'astro';
import { getOgImage } from '../../components/OgImage';

// Development-only preview endpoint. In dev it renders on demand so the
// ?text= query param reaches the endpoint and the preview page can change the
// title. In a production build it is prerendered to a single 404 so the tool
// never ships publicly. `import.meta.env.DEV` folds to a constant at build
// time, keeping the site's `output: 'static'` build adapter-free.
export const prerender = !import.meta.env.DEV;

export async function GET({ url }: APIContext) {
  if (!import.meta.env.DEV) {
    return new Response('Not found', { status: 404 });
  }

  const text = url.searchParams.get('text')?.trim() ?? '';
  const ogText =
    text.length > 0
      ? text
      : 'Gemini CLI のカスタムコマンドと Antigravity の Workflow を同期するツールをつくった';
  const buffer = await getOgImage(ogText);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}
