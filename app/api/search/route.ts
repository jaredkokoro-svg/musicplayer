import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  try {
    // 1. OBTENER CLIENT_ID DE SOUNDCLOUD (Dinámico)
    // Entramos a la web, buscamos el script de configuración y sacamos la ID.
    // Esto evita que la llave caduque.
    const homeRes = await fetch('https://soundcloud.com/discover', { 
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await homeRes.text();
    const scriptSrc = html.match(/<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)">/)?.[1];
    
    let clientId = '7K3O2f5l36p98r34a85b9'; // ID de respaldo por si falla el scraping
    
    if (scriptSrc) {
      const jsRes = await fetch(scriptSrc);
      const jsText = await jsRes.text();
      const match = jsText.match(/client_id:"([^"]+)"/);
      if (match) clientId = match[1];
    }

    // 2. BUSCAR EN SOUNDCLOUD API V2
    const scRes = await fetch(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=15`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const json = await scRes.json();
    const tracks = json.collection || [];

    // 3. MAPEAR RESULTADOS
    const items = tracks
      .filter((t: any) => t.duration > 30000) // Filtramos audios muy cortos (<30s)
      .map((t: any) => ({
        type: 'stream',
        // Guardamos el ID de SoundCloud y el permalink para el audio
        url: `/watch?v=sc:${t.id}`, 
        title: t.title,
        thumbnail: t.artwork_url ? t.artwork_url.replace('large', 't500x500') : '', // Mejor calidad
        uploaderName: t.user?.username || 'SoundCloud',
        duration: formatTime(t.duration / 1000), // SC da milisegundos
        views: t.playback_count ? formatViews(t.playback_count) : '',
        source: 'SoundCloud_Full'
      }));

    if (items.length > 0) return NextResponse.json(items);

  } catch (e) {
    console.error("SoundCloud error:", e);
  }

  // --- RESPALDO (SI TODO FALLA, AL MENOS ITUNES) ---
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5`);
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

// Helpers
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatViews(n: number) {
  if (n > 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n > 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}