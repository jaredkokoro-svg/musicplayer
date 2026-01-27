import { NextResponse } from 'next/server';

const PIPED_SERVERS = [
  'https://piped-api.garudalinux.org', // Ponemos el de Garuda primero aquí
  'https://api.piped.io',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.drgns.space',
  'https://pa.il.ax',
  'https://p.euten.eu'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  for (const apiUrl of PIPED_SERVERS) {
    try {
      // Timeout de 4 segundos para el detalle del video
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${apiUrl}/streams/${id}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Fallo fetch');

      const data = await res.json();
      
      // Buscamos audio
      const audioStream = data.audioStreams.find((s: any) => s.quality === 'highest' || s.bitrate > 128000) 
                       || data.audioStreams[0];

      if (!audioStream) continue; // Si este servidor no dio audio, probamos el siguiente

      return NextResponse.json({
        url: audioStream.url,
        title: data.title,
        uploader: data.uploader,
        thumbnail: data.thumbnailUrl
      });
      
    } catch (error) {
      continue;
    }
  }

  return NextResponse.json({ error: 'No se pudo obtener el audio' }, { status: 500 });
}