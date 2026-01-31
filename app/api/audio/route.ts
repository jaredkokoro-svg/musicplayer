import { NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://piped-api.garudalinux.org',
  'https://pipedapi.drgns.space',
  'https://pa.il.ax',
  'https://p.euten.eu',
  'https://api.piped.io',
  'https://pipedapi.kavin.rocks',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idRaw = searchParams.get('id');

  if (!idRaw) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  // Si por alguna razón llega un ID de iTunes viejo, lo ignoramos
  if (idRaw.startsWith('itunes:')) {
    return NextResponse.json({ error: 'iTunes deshabilitado' }, { status: 400 });
  }

  for (const api of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${api}/streams/${idRaw}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' 
        }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      
      // Prioridad: M4A > WebM (M4A es nativo para Mac/Windows/Chrome)
      const audioStream = data.audioStreams.find((s: any) => s.format === 'M4A' && s.quality === 'highest') 
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

  return NextResponse.json({ error: 'Audio no encontrado' }, { status: 500 });
}