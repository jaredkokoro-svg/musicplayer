import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // Usamos una instancia robusta de Invidious (Francia)
  // Si esta falla, puedes cambiarla por 'https://yewtu.be'
  const BASE_URL = 'https://invidious.fdn.fr';

  try {
    // 1. Pedimos la página web de búsqueda (HTML), NO la API
    // Esto es más difícil de bloquear para ellos.
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await res.text();

    // 2. Usamos REGEX para extraer los videos del HTML
    // Buscamos patrones: href="/watch?v=VIDEO_ID">TITULO</a>
    const videoRegex = /<div class="h-box">[\s\S]*?href="\/watch\?v=([a-zA-Z0-9_-]{11})"[^>]*>([^<]+)<\/a>[\s\S]*?<b>([^<]+)<\/b>/g;
    
    const items = [];
    let match;

    // Iteramos sobre todas las coincidencias
    while ((match = videoRegex.exec(html)) !== null) {
      // match[1] = ID, match[2] = Titulo, match[3] = Autor
      items.push({
        type: 'stream',
        url: `/watch?v=${match[1]}`, // ID de YouTube real
        title: decodeHtml(match[2]),
        thumbnail: `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`,
        uploaderName: match[3],
        source: 'Inv_HTML_Scraper' // Para tu control
      });
      
      if (items.length >= 15) break;
    }

    if (items.length > 0) return NextResponse.json(items);

  } catch (e) {
    console.error("HTML Scraper error:", e);
  }

  // --- RESPALDO: iTunes (Solo si falla el scraper) ---
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

function decodeHtml(html: string) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}