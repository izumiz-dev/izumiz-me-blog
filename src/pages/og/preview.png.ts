import type { APIContext } from 'astro';
import { getOgImage } from '../../components/OgImage';

// In dev, render on demand so the ?text= query param actually reaches the
// endpoint and the preview page can change the title. In a production build
// this must stay prerendered — the site uses `output: 'static'` with no SSR
// adapter, so `import.meta.env.DEV` (folded to a constant at build time)
// keeps the build static while unlocking live preview during development.
export const prerender = !import.meta.env.DEV;

export async function GET({ url }: APIContext) {
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
