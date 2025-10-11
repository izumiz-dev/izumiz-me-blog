import type { APIContext } from 'astro';
import { getOgImage } from '../../components/OgImage';

export const prerender = false;

export async function GET({ url }: APIContext) {
  const text = url.searchParams.get('text')?.trim() ?? '';
  const ogText = text.length > 0 ? text : 'Preview Title';
  const buffer = await getOgImage(ogText);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}
