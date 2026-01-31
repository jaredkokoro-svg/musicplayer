import { NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.io',
  'https://pipedapi.drgns.space',
  'https://piped-api.garudalinux.org',
  'https://pa.il.ax',
  'https://p.euten.eu',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.wglab.net'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idRaw = searchParams.get('id');

  if (!idRaw) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  // CASO ITUNES
  if (idRaw.startsWith('itunes:')) {
    const realId = idRaw.split(':')[1];
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${realId}`);
      const json = await res.json();
      return NextResponse.json({
        url: json.results?.[0]?.previewUrl,
        title: json.results?.[0]?.trackName,
        uploader: json.results?.[0]?.artistName,
        thumbnail: json.results?.[0]?.artworkUrl100
      });
    } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
  }

  // CASO PIPED (YouTube)
  for (const api of PIPED_INSTANCES) {
    try {
      // Timeout un poco más largo para audio (4s)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${api}/streams/${idRaw}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      
      // Buscamos audio M4A (mejor compatibilidad web)
      const audioStream = data.audioStreams.find((s: any) => s.quality === 'highest' && s.format === 'M4A') 
                       || data.audioStreams.find((s: any) => s.format === 'M4A')
                       || data.audioStreams[0];

      if (audioStream) {
        return NextResponse.json({
          url: audioStream.url,
          title: data.title,
          uploader: data.uploader,
          thumbnail: data.thumbnailUrl
        });
      }

    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ error: 'Audio no disponible en ningún servidor' }, { status: 500 });
}