import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idRaw = searchParams.get('id');

  if (!idRaw) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  // 1. Manejo de iTunes (Respaldo)
  if (idRaw.startsWith('itunes:')) {
    const realId = idRaw.split(':')[1];
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${realId}`);
      const json = await res.json();
      const song = json.results?.[0];
      return NextResponse.json({
        url: song.previewUrl,
        title: song.trackName,
        uploader: song.artistName,
        thumbnail: song.artworkUrl100
      });
    } catch (e) { return NextResponse.json({ error: 'iTunes Error' }, { status: 500 }); }
  }

  // 2. Manejo de YouTube/Invidious (Audio Completo)
  // Probamos 3 instancias robustas en rotación
  const INSTANCES = [
    'https://invidious.fdn.fr',
    'https://yewtu.be',
    'https://inv.tux.pizza'
  ];

  for (const base of INSTANCES) {
    try {
      // TRUCO: Endpoint "latest_version" con itag=140 (Audio M4A)
      // fetch con redirect: 'manual' para leer la URL de destino sin descargar el archivo
      const res = await fetch(`${base}/latest_version?id=${idRaw}&itag=140`, {
        method: 'GET',
        redirect: 'manual', // <--- IMPORTANTE: No seguir la redirección automáticamente
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      // Si nos da un 302 (Redirección), esa es la URL del audio real de Google
      if (res.status === 302 || res.status === 301) {
        const audioUrl = res.headers.get('location');
        if (audioUrl) {
          return NextResponse.json({
            url: audioUrl, // Este es el link directo a googlevideo.com
            title: 'Audio Stream',
            uploader: 'Invidious Direct',
            thumbnail: `https://i.ytimg.com/vi/${idRaw}/mqdefault.jpg`
          });
        }
      }

      // Si no redirige pero devuelve OK, tal vez devolvió el archivo directo (raro pero posible)
      if (res.ok) {
         // En este caso, probablemente falló la estrategia de redirección manual
         continue; 
      }

    } catch (e) {
      console.error(`Fallo instancia ${base}`, e);
      continue;
    }
  }

  return NextResponse.json({ error: 'Audio no disponible' }, { status: 500 });
}