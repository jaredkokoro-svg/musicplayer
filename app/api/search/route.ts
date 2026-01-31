import { NextResponse } from 'next/server';

// Lista priorizada de instancias que suelen funcionar con Vercel
const PIPED_INSTANCES = [
  'https://piped-api.garudalinux.org', // La más robusta para Linux
  'https://pipedapi.drgns.space',      // Suele ser rápida
  'https://pa.il.ax',                  // Mirror Israel
  'https://p.euten.eu',                // Mirror Europa
  'https://api.piped.io',
  'https://pipedapi.kavin.rocks',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // Probamos servidor por servidor
  for (const api of PIPED_INSTANCES) {
    try {
      // Timeout de 3s por servidor para no hacerte esperar eternamente
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(`${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' 
        }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const items = data.items;

      if (items && items.length > 0) {
        return NextResponse.json(items.map((item: any) => ({
          type: 'stream',
          url: `/watch?v=${item.url.split('v=')[1]}`,
          title: item.title,
          thumbnail: item.thumbnail,
          uploaderName: item.uploaderName,
          source: 'Piped_API'
        })));
      }

    } catch (e) {
      continue;
    }
  }

  // Si llegamos aquí, fallaron todos. Devolvemos array vacío (nada de iTunes).
  return NextResponse.json([]);
}