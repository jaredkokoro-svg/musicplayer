import { NextResponse } from 'next/server';

const PIPED_SERVERS = [
  'https://api.piped.io',
  'https://pipedapi.kavin.rocks',
  'https://api.onionpiped.com',
  'https://pipedapi.drgns.space'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  for (const apiUrl of PIPED_SERVERS) {
    try {
      const res = await fetch(`${apiUrl}/streams/${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) throw new Error('Fallo fetch');

      const data = await res.json();
      
      // Buscamos audio de alta calidad (m4a suele ser mejor para web)
      const audioStream = data.audioStreams.find((s: any) => s.quality === 'highest' || s.bitrate > 128000) 
                       || data.audioStreams[0];

      if (!audioStream) throw new Error('No hay audio');

      return NextResponse.json({
        url: audioStream.url,
        title: data.title,
        uploader: data.uploader,
        thumbnail: data.thumbnailUrl
      });
      
    } catch (error) {
      console.error(`Fallo servidor ${apiUrl} para audio...`);
      continue;
    }
  }

  return NextResponse.json({ error: 'No se pudo obtener el audio' }, { status: 500 });
}