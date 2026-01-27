import { NextResponse } from 'next/server';

// LISTA ACTUALIZADA Y EXTENDIDA (Enero 2026)
const PIPED_SERVERS = [
  'https://pipedapi.kavin.rocks',      // Clásico
  'https://api.piped.io',              // Oficial
  'https://piped-api.garudalinux.org', // Muy estable (Garuda)
  'https://pipedapi.drgns.space',      // Alternativo rápido
  'https://pa.il.ax',                  // Mirror Israel
  'https://p.euten.eu',                // Mirror Europa
  'https://api.onionpiped.com'         // Respaldo
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // Probamos uno por uno
  for (const apiUrl of PIPED_SERVERS) {
    try {
      // Usamos un Controller para matar la petición si tarda más de 3 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}&filter=all`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId); // Limpiamos el timer si respondió a tiempo

      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      const items = data.items.filter((item: any) => item.type === 'stream');
      
      if (items.length > 0) {
        return NextResponse.json(items);
      }
      // Si no devolvió nada, probamos el siguiente...

    } catch (error) {
      // Silenciosamente fallamos y pasamos al siguiente servidor
      continue;
    }
  }

  return NextResponse.json({ error: 'Todos los servidores fallaron o bloquearon la IP' }, { status: 500 });
}