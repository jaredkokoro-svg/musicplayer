import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  // Usamos saavn.me que es más estable para servidores
  const API_URL = 'https://saavn.me/search/songs';

  try {
    const res = await fetch(`${API_URL}?query=${encodeURIComponent(query)}&limit=10`, {
      // ESTO ES CLAVE: cache: 'no-store' evita problemas de caché de Vercel
      cache: 'no-store',
      headers: {
        // Headers genéricos de Linux para parecer un servidor normal, no un bot
        'User-Agent': 'Wget/1.21.2',
        'Accept': '*/*'
      }
    });

    if (!res.ok) throw new Error('Api Error');

    const json = await res.json();
    const results = json.data?.results || json.results || [];

    // Mapeo simple
    const items = results.map((song: any) => ({
      type: 'stream',
      url: `/watch?v=${song.id}`, 
      title: song.name,
      uploaderName: song.primaryArtists || 'Unknown',
      thumbnail: '', // No cargamos imágenes para ahorrar ancho de banda y sospechas
    }));

    return NextResponse.json(items);

  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}