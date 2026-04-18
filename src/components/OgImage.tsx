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
          'linear-gradient(180deg, #6fb5ff 0%, #2b7fe0 55%, #1b5fb0 100%)',
      }}
    >
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '36px',
          color: '#f2f4fa',
          borderRadius: '24px',
          padding: '48px',
          backgroundImage:
            'linear-gradient(180deg, #4a5063 0%, #2b3040 48%, #13161f 52%, #252a38 100%)',
          width: '720px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 8px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            lineHeight: 1.22,
            fontWeight: 700,
            margin: 0,
            color: '#f2f4fa',
            textShadow: '0 -1px 0 rgba(0, 0, 0, 0.6)',
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
              color: '#6fb5ff',
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

  const resource = [
    ...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('([^']+)'\)/g),
  ].find((match) => {
    const format = match[2]?.toLowerCase();
    return (
      format === 'opentype' ||
      format === 'truetype' ||
      format === 'woff' ||
      format === 'woff2'
    );
  });

  if (!resource) {
    throw new Error(
      'Failed to locate downloadable font resource for OG image generation.'
    );
  }

  const fontUrl = resource[1].replace(/['"]/g, '').trim();

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(
      'Failed to download font resource for OG image generation.'
    );
  }

  fontDataCache = await fontResponse.arrayBuffer();

  return fontDataCache;
}
