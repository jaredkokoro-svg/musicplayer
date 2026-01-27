import { NextResponse } from 'next/server';

// Lista de espejos (Mirrors) de Piped. Si uno falla, usamos el otro.
const PIPED_SERVERS = [
  'https://api.piped.io',             // Oficial (a veces lento)
  'https://pipedapi.kavin.rocks',     // Popular
  'https://api.onionpiped.com',       // Alternativa
  'https://pipedapi.drgns.space',     // Alternativa 2
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // Bucle para probar servidores hasta que uno funcione
  for (const apiUrl of PIPED_SERVERS) {
    try {
      console.log(`Intentando conectar con: ${apiUrl}`);
      
      const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}&filter=all`, {
        headers: {
          // TRUCO: Fingimos ser un navegador real para evitar bloqueos
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      // Filtramos solo videos (streams)
      const items = data.items.filter((item: any) => item.type === 'stream');
      
      // Si tuvimos éxito, devolvemos los datos y salimos del bucle
      return NextResponse.json(items);
      
    } catch (error) {
      console.error(`Fallo servidor ${apiUrl}, probando el siguiente...`);
      // Continuamos al siguiente servidor del array...
    }
  }

  // Si todos fallan
  return NextResponse.json({ error: 'Todos los servidores fallaron' }, { status: 500 });
}