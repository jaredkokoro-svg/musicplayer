import { NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',      // Clásico
  'https://api.piped.io',              // Oficial
  'https://pipedapi.drgns.space',      // Rápido
  'https://piped-api.garudalinux.org', // Linux community (estable)
  'https://pa.il.ax',                  // Mirror
  'https://p.euten.eu',                // Europa
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.wglab.net'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // 1. INTENTO CON PIPED (Rotación)
  for (const api of PIPED_INSTANCES) {
    try {
      console.log(`Probando search en: ${api}`);
      
      // Timeout corto (2s) para pasar rápido al siguiente si falla
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const items = data.items;

      if (items && items.length > 0) {
        return NextResponse.json(items.map((item: any) => ({
          type: 'stream',
          url: `/watch?v=${item.url.split('v=')[1]}`, // Extraemos ID
          title: item.title,
          thumbnail: item.thumbnail,
          uploaderName: item.uploaderName,
          source: 'Piped_API'
        })));
      }

    } catch (e) {
      continue; // Si falla, siguiente servidor
    }
  }

  // 2. RESPALDO: iTunes (Si los 8 servidores de Piped fallan)
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`);
    const json = await res.json();
    return NextResponse.json(json.results.map((song: any) => ({
      type: 'stream',
      url: `/watch?v=itunes:${song.trackId}`,
      title: song.trackName,
      thumbnail: song.artworkUrl100,
      uploaderName: song.artistName,
      source: 'iTunes_Preview'
    })));
  } catch(e) { return NextResponse.json([]); }
}