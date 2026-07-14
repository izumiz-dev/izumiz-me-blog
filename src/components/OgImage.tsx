import satori from 'satori';
import sharp from 'sharp';

const fontDataCache = new Map<string, ArrayBuffer>();

export async function getOgImage(text: string) {
  const [notoSansJP, mPlusRounded, jetBrainsMono] = await Promise.all([
    getFontData(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700'
    ),
    getFontData(
      'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@800'
    ),
    getFontData(
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600'
    ),
  ]);

  // Fit the title to the text column. Character count alone is a poor proxy
  // for width — a full-width JP glyph is ~2x the advance of a Latin one — so
  // a fixed threshold makes an all-kana title wrap to 3 lines while a
  // Latin-heavy one of the same length fits in 2. Instead measure an
  // approximate visual width (full-width glyphs ≈ 1em, half-width ≈ 0.5em)
  // and pick the largest size whose title stays within ~2 lines of the
  // ~590px column, which keeps a lone trailing glyph off its own line.
  const visualWidthEm = estimateWidthEm(text);
  const titleFontSize =
    visualWidthEm <= 9.5
      ? 52
      : visualWidthEm <= 13
        ? 46
        : visualWidthEm <= 17
          ? 40
          : visualWidthEm <= 22
            ? 36
            : visualWidthEm <= 27
              ? 32
              : 28;

  const svg = await satori(
    <main
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        // Signature background: soft Frutiger bubbles over a sky gradient
        // (satori 0.10 has no repeating-linear-gradient, so the technical
        //  grid is dropped here and the aero glow carries the signature)
        backgroundImage: [
          // soft Frutiger bubbles (circular, satori-safe syntax) — toned down
          'radial-gradient(circle at 10% 8%, rgba(255,255,255,0.5), rgba(255,255,255,0) 22%)',
          'radial-gradient(circle at 92% 12%, rgba(255,255,255,0.4), rgba(255,255,255,0) 20%)',
          // lime nature note (quiet)
          'radial-gradient(circle at 88% 84%, rgba(143,220,78,0.18), rgba(143,220,78,0) 24%)',
          'radial-gradient(circle at 6% 88%, rgba(255,255,255,0.32), rgba(255,255,255,0) 20%)',
          // sky gradient base
          'linear-gradient(180deg, #c3e0f5 0%, #d9eef9 45%, #eaf4fa 100%)',
        ].join(', '),
      }}
    >
      {/* Bold brushed-chrome frame */}
      <div
        style={{
          display: 'flex',
          padding: '11px',
          borderRadius: '26px',
          // matte brushed metal: soft top rim, gentle mid, quiet shade
          // (no hard central specular band — keeps it blunt, not glossy)
          backgroundImage:
            'linear-gradient(180deg, #f6f8fa 0%, #dfe4ec 40%, #c3cad7 60%, #a6aebd 100%)',
          border: '1px solid #8f98a8',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.22), 0 16px 38px rgba(20,40,80,0.3)',
        }}
      >
        {/* Glass panel (translucent so the signature background shows through) */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '676px',
            minHeight: '312px',
            padding: '38px 44px',
            borderRadius: '16px',
            color: '#2b3040',
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(232,242,251,0.46) 100%)',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          {/* Title zone: vertically centered so the visual weight stays put
              regardless of how many lines the article title wraps to. */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontSize: `${titleFontSize}px`,
                lineHeight: 1.32,
                fontWeight: 700,
                margin: 0,
                color: '#232733',
              }}
            >
              {text}
            </h1>
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
            }}
          >
            {/* Address label: quiet monospace, terminal-prompt vernacular.
                Kept deliberately light so the signature plate stays the
                single memorable element. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontFamily: 'JetBrains Mono',
                fontSize: '17px',
                fontWeight: 600,
                color: '#4a5568',
              }}
            >
              {/* lime prompt caret — the one nature note, small */}
              <span
                style={{
                  color: '#5bb524',
                  textShadow: '0 0 5px rgba(143,220,78,0.45)',
                }}
              >
                ▸
              </span>
              <span style={{ letterSpacing: '0.01em' }}>izumiz.me</span>
            </div>
            {/* Site-title header replica: chrome frame + rivets wrapping a
                lit gunmetal tube plate (matches main header h1 exactly) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '4px 6px',
                borderRadius: '10px',
                // silver chrome frame (--chrome-gradient)
                backgroundImage:
                  'linear-gradient(180deg, #fdfefe 0%, #d8dde6 48%, #a7afbe 52%, #d8dde6 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 14px rgba(20,40,80,0.22)',
              }}
            >
              {/* left metal rivet */}
              <div
                style={{
                  display: 'flex',
                  width: '5px',
                  height: '5px',
                  borderRadius: '5px',
                  backgroundImage:
                    'radial-gradient(circle at 35% 30%, #fff, #8b96a8 60%, #4a5063)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
              {/* inner gunmetal tube plate */}
              <div
                style={{
                  display: 'flex',
                  padding: '8px 26px',
                  borderRadius: '7px',
                  backgroundImage:
                    'linear-gradient(180deg, #4a5063 0%, #2b3040 48%, #13161f 52%, #252a38 100%)',
                  border: '1px solid rgba(0,0,0,0.4)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 6px rgba(0,0,0,0.6)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'M PLUS Rounded 1c',
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    // lit tube: cool blue-white glow like the header title
                    color: '#eaf2fb',
                    textShadow:
                      '0 -1px 0 rgba(0,0,0,0.6), 0 0 6px rgba(200,235,255,0.55), 0 0 14px rgba(140,210,255,0.3)',
                  }}
                >
                  blog by izumiz
                </span>
              </div>
              {/* right metal rivet */}
              <div
                style={{
                  display: 'flex',
                  width: '5px',
                  height: '5px',
                  borderRadius: '5px',
                  backgroundImage:
                    'radial-gradient(circle at 35% 30%, #fff, #8b96a8 60%, #4a5063)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>,
    {
      width: 800,
      height: 420,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: notoSansJP,
          style: 'normal',
        },
        {
          name: 'M PLUS Rounded 1c',
          data: mPlusRounded,
          style: 'normal',
        },
        {
          name: 'JetBrains Mono',
          data: jetBrainsMono,
          style: 'normal',
        },
      ],
    }
  );

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// Approximate rendered width of a title in em units: CJK / full-width glyphs
// advance ~1em, Latin / half-width ~0.5em. Good enough to choose a font size
// tier without measuring glyphs, and far more accurate than a raw char count.
function estimateWidthEm(text: string): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const isFullWidth =
      (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0x303e) || // CJK radicals, Kangxi, punctuation
      (code >= 0x3041 && code <= 0x33ff) || // Hiragana, Katakana, CJK symbols
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Ext A
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility
      (code >= 0xff00 && code <= 0xff60) || // Fullwidth forms
      (code >= 0xffe0 && code <= 0xffe6);
    width += isFullWidth ? 1 : 0.5;
  }
  return width;
}

async function getFontData(cssUrl: string) {
  const cached = fontDataCache.get(cssUrl);
  if (cached) return cached;

  const css = await (
    await fetch(cssUrl, {
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

  const data = await fontResponse.arrayBuffer();
  fontDataCache.set(cssUrl, data);

  return data;
}
