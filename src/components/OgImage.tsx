import satori from 'satori';
import sharp from 'sharp';

export async function getOgImage(text: string) {
  const fontData = (await getFontData()) as ArrayBuffer;

  const svg = await satori(
    <main
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#6568c3',
      }}
    >
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: 'column',
          color: '#2e2e2e',
          border: '0px solid',
          borderRadius: '24px',
          margin: '24px',
          padding: '32px',
          backgroundColor: '#fefefe',
          width: '752px',
        }}
      >
        <h1 style={{ fontSize: '40px' }}>{text}</h1>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'flex-end',
          }}
        >
          <h2 style={{ fontSize: '32px' }}>izumiz.me</h2>
        </div>
      </section>
    </main>,
    {
      width: 800,
      height: 400,
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
  const API = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700`;

  const css = await (
    await fetch(API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    })
  ).text();

  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (!resource) return;

  return await fetch(resource[1]).then((res) => res.arrayBuffer());
}
