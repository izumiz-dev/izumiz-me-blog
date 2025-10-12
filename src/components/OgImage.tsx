import satori from 'satori';
import sharp from 'sharp';

let fontDataCache: ArrayBuffer | undefined;

export async function getOgImage(text: string) {
  const fontData = await getFontData();

  const svg = await satori(
    <main
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, #a5b4fc 0%, #7c83f9 40%, #475569 100%)',
      }}
    >
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '36px',
          color: '#f8fafc',
          borderRadius: '32px',
          padding: '48px',
          backgroundColor: 'rgba(15, 23, 42, 0.78)',
          width: '720px',
          border: '1px solid rgba(148, 163, 184, 0.25)',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            lineHeight: 1.22,
            fontWeight: 700,
            margin: 0,
            color: '#e2e8f0',
          }}
        >
          {text}
        </h1>
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#94a3f8',
            }}
          >
            blog by izumiz
          </span>
        </div>
      </section>
    </main>,
    {
      width: 800,
      height: 420,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function getFontData() {
  if (fontDataCache) return fontDataCache;

  const API = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700`;

  const css = await (
    await fetch(API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    })
  ).text();

  const resource = [...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('([^']+)'\)/g)].find((match) => {
    const format = match[2]?.toLowerCase();
    return (
      format === 'opentype' ||
      format === 'truetype' ||
      format === 'woff' ||
      format === 'woff2'
    );
  });

  if (!resource) {
    throw new Error('Failed to locate downloadable font resource for OG image generation.');
  }

  const fontUrl = resource[1].replace(/['"]/g, '').trim();

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error('Failed to download font resource for OG image generation.');
  }

  fontDataCache = await fontResponse.arrayBuffer();

  return fontDataCache;
}
