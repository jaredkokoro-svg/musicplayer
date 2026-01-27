import { NextResponse } from 'next/server';

// LISTA MIXTA (Piped + Invidious)
// Invidious suele bloquear menos a Vercel.
const INSTANCES = [
  // --- INVIDIOUS (API v1) ---
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.projectsegfau.lt',
  'https://inv.us.projectsegfau.lt',
  'https://invidious.jing.rocks',
  // --- PIPED ---
  'https://pipedapi.kavin.rocks',
  'https://api.piped.io',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  for (const domain of INSTANCES) {
    try {
      // 1. Detectar si es Invidious o Piped según el dominio
      const isInvidious = !domain.includes('piped');
      
      // 2. Construir la URL correcta
      const url = isInvidious 
        ? `${domain}/api/v1/search?q=${encodeURIComponent(query)}&type=video`
        : `${domain}/search?q=${encodeURIComponent(query)}&filter=all`;

      console.log(`Probando: ${domain}`);

      // 3. Fetch con Timeout de 3s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' } 
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue; // Si falla, siguiente...

      const data = await res.json();
      
      // 4. NORMALIZAR DATOS (Convertir todo al formato que usa tu app)
      let items = [];
      
      if (isInvidious) {
        // Formato Invidious -> Formato FocusFlow
        items = data.map((item: any) => ({
          type: 'stream',
          url: `/watch?v=${item.videoId}`,
          title: item.title,
          thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          uploaderName: item.author,
          duration: typeof item.lengthSeconds === 'number' 
            ? new Date(item.lengthSeconds * 1000).toISOString().substr(14, 5) 
            : '0:00',
          views: item.viewCount
        }));
      } else {
        // Formato Piped (Ya compatible)
        items = data.items.filter((i: any) => i.type === 'stream');
      }

      if (items.length > 0) return NextResponse.json(items);

    } catch (e) {
      console.error(`Fallo ${domain}:`, e);
      continue;
    }
  }

  return NextResponse.json({ error: 'Todos los servidores fallaron' }, { status: 500 });
}