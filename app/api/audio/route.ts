import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  // CASO RESPALDO: Si es un ID de iTunes (preview)
  if (id.startsWith('itunes:')) {
    const realId = id.split(':')[1];
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${realId}`);
      const json = await res.json();
      const song = json.results?.[0];
      if (song) {
        return NextResponse.json({
          url: song.previewUrl, // Solo 30seg, pero funciona 100% seguro
          title: song.trackName,
          uploader: song.artistName,
          thumbnail: song.artworkUrl100
        });
      }
    } catch (e) { return NextResponse.json({ error: 'iTunes Error' }, { status: 500 }); }
  }

  // CASO NORMAL: Saavn (Música completa)
  const urls = [
    `https://saavn.me/songs?id=${id}`,
    `https://saavn.dev/api/songs/${id}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        // @ts-ignore
        duplex: 'half',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) continue;

      const json = await res.json();
      let song = json.data?.[0] || json.data;

      if (!song) continue;

      const links = song.downloadUrl || song.download_links;
      let streamUrl = '';

      if (Array.isArray(links)) {
        // Intentamos calidad media (160) o alta (320)
        const best = links.find((l: any) => l.quality === '160kbps') || links[links.length - 1];
        streamUrl = typeof best === 'string' ? best : (best.url || best.link);
      } else {
        streamUrl = links;
      }

      if (streamUrl) {
        return NextResponse.json({
          url: streamUrl,
          title: decodeHtml(song.name),
          uploader: song.primaryArtists,
          thumbnail: getImage(song.image)
        });
      }

    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ error: 'Audio no encontrado' }, { status: 500 });
}

function getImage(img: any) {
  if (Array.isArray(img)) return img[img.length - 1]?.link || img[img.length - 1]?.url;
  return img || '';
}

function decodeHtml(html: string) {
  return html ? html.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'") : '';
}