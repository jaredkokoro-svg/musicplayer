import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // 1. Intentamos Saavn (Música completa)
  try {
    const res = await fetch(`https://saavn.me/search/songs?query=${encodeURIComponent(query)}&limit=10`, {
      cache: 'no-store',
      // @ts-ignore
      duplex: 'half',
      headers: {
        // CAMBIO CLAVE: Fingimos ser un Chrome real, no Wget
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (res.ok) {
      const json = await res.json();
      const results = json.data?.results || json.results;
      
      if (results && Array.isArray(results) && results.length > 0) {
        return NextResponse.json(results.map((song: any) => ({
          type: 'stream',
          url: `/watch?v=${song.id}`,
          title: decodeHtml(song.name),
          thumbnail: getImage(song.image),
          uploaderName: song.primaryArtists || 'Artist',
          source: 'Saavn'
        })));
      }
    }
  } catch (e) {
    console.error("Saavn falló, probando backup...", e);
  }

  // 2. RESPALDO DE EMERGENCIA: iTunes API (Nunca bloquea a Vercel)
  // Si Saavn falla, al menos mostramos resultados de iTunes.
  // Nota: El audio de iTunes es solo preview (30s), pero confirmará que tu app funciona.
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`);
    const json = await res.json();
    
    if (json.results) {
      return NextResponse.json(json.results.map((song: any) => ({
        type: 'stream',
        // Usamos un prefijo 'itunes:' para saber en el audio route que es diferente
        url: `/watch?v=itunes:${song.trackId}`, 
        title: song.trackName,
        thumbnail: song.artworkUrl100.replace('100x100', '300x300'),
        uploaderName: song.artistName,
        source: 'iTunes_Backup' // Para que sepas en la consola que usó el backup
      })));
    }
  } catch (e) {
    console.error("iTunes falló:", e);
  }

  return NextResponse.json([]);
}

// Helpers
function getImage(img: any) {
  if (Array.isArray(img)) return img[img.length - 1]?.link || img[img.length - 1]?.url;
  return typeof img === 'string' ? img : '';
}

function decodeHtml(html: string) {
  return html ? html.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'") : '';
}