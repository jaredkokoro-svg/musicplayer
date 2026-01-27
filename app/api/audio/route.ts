import { NextResponse } from 'next/server';

const INSTANCES = [
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.projectsegfau.lt',
  'https://inv.us.projectsegfau.lt',
  'https://pipedapi.kavin.rocks',
  'https://api.piped.io',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  for (const domain of INSTANCES) {
    try {
      const isInvidious = !domain.includes('piped');
      const url = isInvidious 
        ? `${domain}/api/v1/videos/${id}`
        : `${domain}/streams/${id}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      let audioUrl = '';

      if (isInvidious) {
        // Lógica para Invidious: Buscar formatStreams (audio+video) o adaptiveFormats (solo audio)
        // Intentamos buscar "audio/mp4" o "audio/webm"
        const adaptive = data.adaptiveFormats || [];
        const audioOnly = adaptive.find((s: any) => s.type.includes('audio/mp4')) 
                       || adaptive.find((s: any) => s.type.includes('audio'));
        
        audioUrl = audioOnly?.url;
        
        // Si no hay audio separado, usaremos el stream normal (mp4 video) pero el tag <audio> solo reproducirá el sonido
        if (!audioUrl && data.formatStreams) {
           audioUrl = data.formatStreams[data.formatStreams.length - 1].url;
        }

      } else {
        // Lógica para Piped
        const audioStream = data.audioStreams.find((s: any) => s.quality === 'highest' || s.bitrate > 128000) 
                         || data.audioStreams[0];
        audioUrl = audioStream?.url;
      }

      if (audioUrl) {
        return NextResponse.json({
          url: audioUrl,
          title: data.title,
          uploader: isInvidious ? data.author : data.uploader,
          thumbnail: isInvidious ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : data.thumbnailUrl
        });
      }

    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ error: 'No se pudo obtener el audio' }, { status: 500 });
}